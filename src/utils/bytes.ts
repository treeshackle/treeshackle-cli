const byteMulti = new Map<string, number>();
byteMulti.set("B", 1);
byteMulti.set("kB", 1e3);
byteMulti.set("MB", 1e6);
byteMulti.set("GB", 1e9);

/**
 * Matches the number and the units
 */
const UnitsRegExp = /^([0-9,\.]+) ?([a-zA-Z]*)$/;

/**
 * Convert a byte string into an integer of bytes.
 * i.e. "1 MB" returns `1000000`
 */
export function fromByteString(byteString: string): number {
  const result = byteString.match(UnitsRegExp);

  if (result === null) throw new Error("Invalid Bytes");

  const [, size, unit] = result;
  const multiplier = byteMulti.get(unit);

  if (multiplier == null) throw new Error("Unknown unit");

  return Math.round(parseFloat(size) * multiplier);
}
