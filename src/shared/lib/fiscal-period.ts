function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function currentFiscalPeriod(
  startMonth = 1,
  startDay = 1,
  today = new Date(),
): { from: string; to: string } {
  const month = Math.min(12, Math.max(1, startMonth));
  const year = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const started =
    currentMonth > month ||
    (currentMonth === month && currentDay >= Math.min(startDay, daysInMonth(year, month)));
  const startYear = started ? year : year - 1;
  const fromDay = Math.min(Math.max(1, startDay), daysInMonth(startYear, month));
  return {
    from: `${startYear}-${pad(month)}-${pad(fromDay)}`,
    to: toIsoDate(today),
  };
}
