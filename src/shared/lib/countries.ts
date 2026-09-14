export type CountryOption = {
  code: string;
  name: string;
};

const EXCLUDED_REGION_CODES = new Set(["EU", "EZ", "QO", "UN", "UK", "XA", "XB", "XX", "ZZ"]);

let cachedOptions: CountryOption[] | null = null;

function regionCodes(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  if (typeof intl.supportedValuesOf === "function") {
    try {
      return intl.supportedValuesOf("region").filter((code) => /^[A-Z]{2}$/.test(code));
    } catch {
      // Chromium and some Node builds reject the "region" key.
    }
  }

  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  const codes: string[] = [];
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      const name = displayNames.of(code);
      if (name && name !== code && !name.toLowerCase().includes("unknown")) {
        codes.push(code);
      }
    }
  }
  return codes;
}

export function isoCountryOptions(): CountryOption[] {
  if (cachedOptions) {
    return cachedOptions;
  }
  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  cachedOptions = regionCodes()
    .filter((code) => !EXCLUDED_REGION_CODES.has(code))
    .map((code) => ({ code, name: displayNames.of(code) ?? code }))
    .sort((left, right) => left.name.localeCompare(right.name));
  return cachedOptions;
}

export function countryNameForCode(code: string): string | undefined {
  if (!/^[A-Za-z]{2}$/.test(code)) {
    return undefined;
  }
  const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase());
  if (!name || name.toLowerCase().includes("unknown")) {
    return undefined;
  }
  return name;
}

export function countryCodeForName(
  name: string,
  options = isoCountryOptions(),
): string | undefined {
  const normalized = name.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  return options.find((option) => option.name.toLowerCase() === normalized)?.code;
}
