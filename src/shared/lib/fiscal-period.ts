function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function clampDay(year: number, month: number, day: number): Date {
  const last = daysInMonth(year, month);
  return new Date(year, month - 1, Math.min(day, last));
}

/** Fiscal period 1–12 for an ISO date (mirrors backend FiscalYearConfig). */
export function fiscalPeriodForIsoDate(
  isoDate: string,
  startMonth = 1,
  startDay = 1,
): number {
  const [y, m, d] = isoDate.split("-").map((part) => Number(part));
  const documentDate = new Date(y, m - 1, d);
  const month = Math.min(12, Math.max(1, startMonth));
  const start = clampDay(documentDate.getFullYear(), month, startDay);
  const fiscalYear =
    documentDate >= start ? documentDate.getFullYear() : documentDate.getFullYear() - 1;
  const fyStart = clampDay(fiscalYear, month, startDay);
  const fyEnd = new Date(clampDay(fiscalYear + 1, month, startDay).getTime() - 86400000);
  let cursor = fyStart;
  for (let period = 1; period <= 12; period += 1) {
    let periodEnd: Date;
    if (period === 12) {
      periodEnd = fyEnd;
    } else {
      let nextMonth = cursor.getMonth() + 2;
      let nextYear = cursor.getFullYear();
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      const nextStart = clampDay(nextYear, nextMonth, startDay);
      periodEnd = new Date(nextStart.getTime() - 86400000);
    }
    if (documentDate >= cursor && documentDate <= periodEnd) {
      return period;
    }
    cursor = new Date(periodEnd.getTime() + 86400000);
  }
  return 12;
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
