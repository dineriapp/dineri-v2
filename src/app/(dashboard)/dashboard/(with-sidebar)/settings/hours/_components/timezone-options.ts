const POPULAR_TIMEZONES = [
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const getOffset = (timezone: string) => {
  const offset =
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value ?? "";

  return offset.replace("GMT", "UTC");
};

export const ALL_TIMEZONE_OPTIONS = Intl.supportedValuesOf("timeZone").map((timezone) => ({
  value: timezone,
  label: `${timezone.replaceAll("_", " ")} (${getOffset(timezone)})`,
}));

export const POPULAR_TIMEZONE_OPTIONS = POPULAR_TIMEZONES.map((timezone) => ({
  value: timezone,
  label: `${timezone.replaceAll("_", " ")} (${getOffset(timezone)})`,
}));
