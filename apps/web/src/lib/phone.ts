/** Accepts 01XXXXXXXXX, 1XXXXXXXXX, 8801XXXXXXXXX or +8801XXXXXXXXX. Returns the 10 digits after +880, or null. */
export function normalizeBdMobile(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("880")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return /^1[3-9]\d{8}$/.test(d) ? d : null;
}
