const SCALE = 4;
const ZERO = BigInt(0);
const FACTOR = BigInt(10) ** BigInt(SCALE);

function toScaled(value: string): bigint {
  const trimmed = value.trim() || "0";
  const negative = trimmed.startsWith("-");
  const unsigned = trimmed.replace(/^[+-]/, "") || "0";
  const [wholeRaw = "0", fractionRaw = ""] = unsigned.split(".");
  if (!/^\d+$/.test(wholeRaw) || (fractionRaw.length > 0 && !/^\d+$/.test(fractionRaw))) {
    return ZERO;
  }
  const whole = BigInt(wholeRaw.replace(/^0+(?=\d)/, "") || "0");
  const fraction = BigInt((fractionRaw + "0".repeat(SCALE)).slice(0, SCALE) || "0");
  const scaled = whole * FACTOR + fraction;
  return negative ? -scaled : scaled;
}

function fromScaled(value: bigint): string {
  const negative = value < ZERO;
  const abs = negative ? -value : value;
  const whole = abs / FACTOR;
  const fraction = (abs % FACTOR).toString().padStart(SCALE, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export type JournalBalanceTotals = {
  totalDebit: string;
  totalCredit: string;
  difference: string;
  isBalanced: boolean;
};

export function journalBalanceTotals(
  lines: ReadonlyArray<{ debit: string; credit: string }>,
): JournalBalanceTotals {
  let debit = ZERO;
  let credit = ZERO;
  for (const line of lines) {
    debit += toScaled(line.debit);
    credit += toScaled(line.credit);
  }
  const difference = credit - debit;
  return {
    totalDebit: fromScaled(debit),
    totalCredit: fromScaled(credit),
    difference: fromScaled(difference < ZERO ? -difference : difference),
    isBalanced: difference === ZERO,
  };
}
