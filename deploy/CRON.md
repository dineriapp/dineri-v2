# Scheduled jobs on the VPS

`vercel.json` declares both crons, and **Vercel cron declarations do nothing outside
Vercel**. This deployment is a VPS, so the schedule has to be registered with the
server's own scheduler. Until that is done the routes exist but never run.

This is not theoretical: the 2026-08-13 audit measured 2,476 unpaid bookings past their
release window, still occupying tables, because `release-stale-holds` was never
scheduled.

## The jobs

| Route                           | Schedule     | Purpose                                          |
| ------------------------------- | ------------ | ------------------------------------------------ |
| `/api/cron/release-stale-holds` | every 5 min  | Cancels unpaid bookings whose table hold expired |
| `/api/cron/activity-prune`      | daily, 04:00 | Trims the activity feed                          |

Both authenticate with `Authorization: Bearer $CRON_SECRET` and return 401 without it,
so the secret must match the app's `CRON_SECRET` exactly.

## Setup

Put the secret and host somewhere root-readable only — never in the crontab itself,
where `ps` and `/etc/crontab` expose it:

```sh
sudo install -m 600 /dev/null /etc/dineri/cron.env
sudo tee /etc/dineri/cron.env >/dev/null <<'EOF'
CRON_SECRET=<the same value as the app's CRON_SECRET>
APP_URL=https://<your-domain>
EOF
```

A wrapper keeps the crontab lines short and the failures visible:

```sh
sudo tee /usr/local/bin/dineri-cron >/dev/null <<'EOF'
#!/bin/sh
set -eu
. /etc/dineri/cron.env
exec curl -fsS --max-time 120 \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${APP_URL}/api/cron/$1"
EOF
sudo chmod 755 /usr/local/bin/dineri-cron
```

Then register the schedule (`sudo crontab -e`):

```cron
*/5 * * * * /usr/local/bin/dineri-cron release-stale-holds >> /var/log/dineri-cron.log 2>&1
0 4 * * *   /usr/local/bin/dineri-cron activity-prune      >> /var/log/dineri-cron.log 2>&1
```

`curl -f` makes a non-2xx response a non-zero exit, so a failing job shows up as cron
mail and a log line rather than passing silently.

## Verify

```sh
# Should print {"success":true,"cancelled":N,"hasMore":false}
/usr/local/bin/dineri-cron release-stale-holds

# Should be 401 — proves the route is actually guarded
curl -s -o /dev/null -w '%{http_code}\n' "$APP_URL/api/cron/release-stale-holds"
```

Then confirm the backlog is falling:

```sql
select count(*) from reservations
where payment_status = 'pending' and status in ('pending','confirmed')
  and created_at < now() - interval '32 minutes';
```

## First run against an existing backlog

Do not let the first scheduled tick loose on a large backlog unexamined. The sweep is
capped at 500 rows per run, so a backlog drains over several ticks — but reconcile it
deliberately first:

```sh
pnpm holds:reconcile              # rehearsal: runs the real statement, rolls back
pnpm holds:reconcile --apply      # commit one batch
```

## Log rotation

```sh
sudo tee /etc/logrotate.d/dineri-cron >/dev/null <<'EOF'
/var/log/dineri-cron.log {
  weekly
  rotate 8
  compress
  missingok
  notifempty
}
EOF
```
