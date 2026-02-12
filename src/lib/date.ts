export function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function nowTimestampMs() {
  return Date.parse(new Date().toISOString());
}
