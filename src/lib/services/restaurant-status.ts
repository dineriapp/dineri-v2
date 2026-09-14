import { DateTime, Duration } from 'luxon';
import { RestaurantOpeningHours, StatusType } from '../types';

export interface RestaurantStatusDetailed {
    isOpen: boolean;
    status: StatusType;
    displayText: string;            // human‑readable, e.g. "Open", "Closes in 30 minutes"
    nextChange?: string;            // e.g. "Closes at 22:00 tomorrow", "Opens at 09:00 on Monday"
    minutesUntilChange?: number;    // positive minutes, only for "closing‑soon" / "opening‑soon"
    // optional client‑side times (converted to client timezone)
    openTimeClient?: string;        // "HH:mm"
    closeTimeClient?: string;
    nextOpeningDay?: string;        // e.g. "Monday"
    nextOpeningTime?: string;       // "HH:mm" in client timezone
}

export interface RestaurantStatusSimple {
    isOpen: boolean;
}

export function getRestaurantStatus(
    openingHours: RestaurantOpeningHours,
    restaurantTz: string,
    clientTz?: string
): RestaurantStatusSimple | RestaurantStatusDetailed {
    // Validate inputs
    if (!openingHours || typeof openingHours !== 'object') {
        throw new Error('Invalid openingHours');
    }
    if (!restaurantTz || typeof restaurantTz !== 'string') {
        throw new Error('Invalid restaurant timezone');
    }

    const nowRest = DateTime.now().setZone(restaurantTz);
    if (!nowRest.isValid) {
        throw new Error(`Invalid restaurant timezone: ${restaurantTz}`);
    }

    // Day index: 0=Sunday, 1=Monday, … 6=Saturday
    const todayIdx = nowRest.weekday % 7;

    // Helper: get open/close DateTimes for a given day and base date
    function getDayOpenClose(dayIdx: number, baseDate: DateTime) {
        const schedule = openingHours[dayIdx];
        if (!schedule?.isOpen || !schedule.openTime || !schedule.closeTime) {
            return null;
        }
        const open = DateTime.fromFormat(schedule.openTime, 'HH:mm', { zone: restaurantTz })
            .set({ year: baseDate.year, month: baseDate.month, day: baseDate.day });
        let close = DateTime.fromFormat(schedule.closeTime, 'HH:mm', { zone: restaurantTz })
            .set({ year: baseDate.year, month: baseDate.month, day: baseDate.day });
        if (close <= open) {
            close = close.plus({ days: 1 });
        }
        return { open, close };
    }

    // 1. Check if currently open
    let isOpen = false;
    let minutesUntilClose: number | null = null;

    const todayOpenClose = getDayOpenClose(todayIdx, nowRest);
    if (todayOpenClose) {
        const { open, close } = todayOpenClose;
        if (nowRest >= open && nowRest < close) {
            isOpen = true;
            minutesUntilClose = close.diff(nowRest, 'minutes').minutes;
        }
    }

    // 2. If not open, find the next opening (today or future)
    let nextOpenDateTime: DateTime | null = null;
    let nextOpenDayIdx: number | null = null;
    let minutesUntilOpen: number | null = null;

    if (!isOpen) {
        // First check if today is open but we are before opening time
        if (todayOpenClose && nowRest < todayOpenClose.open) {
            nextOpenDateTime = todayOpenClose.open;
            nextOpenDayIdx = todayIdx;
            minutesUntilOpen = todayOpenClose.open.diff(nowRest, 'minutes').minutes;
        } else {
            // Search from tomorrow onwards
            for (let i = 1; i <= 7; i++) {
                const dayIdx = (todayIdx + i) % 7;
                const candidate = getDayOpenClose(dayIdx, nowRest.plus({ days: i }));
                if (candidate) {
                    nextOpenDateTime = candidate.open;
                    nextOpenDayIdx = dayIdx;
                    minutesUntilOpen = candidate.open.diff(nowRest, 'minutes').minutes;
                    break;
                }
            }
        }
    }

    // 3. Build the result object
    const result: RestaurantStatusDetailed = {
        isOpen,
        status: 'closed',
        displayText: '',
    };

    // Helper: format duration (only hours & minutes, for short periods)
    function formatDuration(minutes: number): string {
        const dur = Duration.fromObject({ minutes: Math.round(minutes) });
        const { hours = 0, minutes: mins = 0 } = dur.shiftTo('hours', 'minutes').toObject();
        const parts: string[] = [];
        if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        if (mins > 0) parts.push(`${mins} minute${mins !== 1 ? 's' : ''}`);
        return parts.join(' ') || '0 minutes';
    }

    function getDayName(dayIdx: number): string {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIdx];
    }

    // Helper: get a relative day string for a target DateTime (in client TZ)
    function getRelativeDay(target: DateTime, now: DateTime): string {
        if (target.hasSame(now, 'day')) return 'today';
        if (target.hasSame(now.plus({ days: 1 }), 'day')) return 'tomorrow';
        // Otherwise, return the weekday name
        return `on ${target.toFormat('cccc')}`;
    }

    // 4. Populate based on state
    if (isOpen && todayOpenClose) {
        const { open, close } = todayOpenClose;
        const clientOpen = clientTz ? open.setZone(clientTz) : null;
        const clientClose = clientTz ? close.setZone(clientTz) : null;

        const isClosingSoon = minutesUntilClose !== null && minutesUntilClose <= 120;
        result.status = isClosingSoon ? 'closing‑soon' : 'open';
        result.minutesUntilChange = minutesUntilClose !== null ? Math.round(minutesUntilClose) : undefined;

        // Build nextChange with day context
        const closeTimeStr = clientClose ? clientClose.toFormat('HH:mm') : close.toFormat('HH:mm');
        let dayContext = '';
        if (clientTz && clientClose) {
            const nowClient = DateTime.now().setZone(clientTz);
            dayContext = ' ' + getRelativeDay(clientClose, nowClient);
        }

        if (isClosingSoon) {
            result.displayText = `Closes in ${formatDuration(minutesUntilClose!)}`;
            result.nextChange = `Closes at ${closeTimeStr}${dayContext}`;
        } else {
            result.displayText = 'Open';
            result.nextChange = `Closes at ${closeTimeStr}${dayContext}`;
        }

        if (clientTz) {
            result.openTimeClient = clientOpen ? clientOpen.toFormat('HH:mm') : undefined;
            result.closeTimeClient = clientClose ? clientClose.toFormat('HH:mm') : undefined;
        }
    } else if (nextOpenDateTime && nextOpenDayIdx !== null) {
        const clientOpen = clientTz ? nextOpenDateTime.setZone(clientTz) : null;
        result.isOpen = false;
        const isOpeningSoon = minutesUntilOpen !== null && minutesUntilOpen <= 120;
        result.status = isOpeningSoon ? 'opening‑soon' : 'closed';
        result.minutesUntilChange = minutesUntilOpen !== null ? Math.round(minutesUntilOpen) : undefined;

        const timeStr = clientOpen ? clientOpen.toFormat('HH:mm') : nextOpenDateTime.toFormat('HH:mm');

        // Build day context for nextChange and displayText
        let dayContext = '';
        if (clientTz && clientOpen) {
            const nowClient = DateTime.now().setZone(clientTz);
            dayContext = ' ' + getRelativeDay(clientOpen, nowClient);
        }

        if (isOpeningSoon) {
            result.displayText = `Opens in ${formatDuration(minutesUntilOpen!)}`;
            result.nextChange = `Opens at ${timeStr}${dayContext}`;
        } else {
            // Closed (not soon) – determine suffix for displayText
            const isToday = nextOpenDateTime.hasSame(nowRest, 'day');
            const isTomorrow = nextOpenDateTime.hasSame(nowRest.plus({ days: 1 }), 'day');
            let suffix = '';
            if (isToday) suffix = ' today';
            else if (isTomorrow) suffix = ' tomorrow';
            else suffix = ` on ${getDayName(nextOpenDayIdx)}`;
            result.displayText = `Closed – Opens at ${timeStr}${suffix}`;
            // Also set nextChange for consistency (without the "Closed – " prefix)
            result.nextChange = `Opens at ${timeStr}${dayContext}`;
        }

        if (clientTz) {
            result.nextOpeningTime = clientOpen ? clientOpen.toFormat('HH:mm') : undefined;
            result.nextOpeningDay = getDayName(nextOpenDayIdx);
        }
    } else {
        // No open day found (all closed)
        result.isOpen = false;
        result.status = 'closed';
        result.displayText = 'Closed';
        result.nextChange = undefined;
    }

    // 5. Return either simple or detailed
    if (!clientTz) {
        return { isOpen: result.isOpen };
    }
    return result;
}