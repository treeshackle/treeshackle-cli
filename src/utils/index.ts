export function pluralize(unit: string, count: number) {
  // Simple pluralization
  return unit + (count === 1 ? "" : "s");
}

const byteMagnitude = new Map<string, number>();
byteMagnitude.set("B", 1);
byteMagnitude.set("kB", 1e3);
byteMagnitude.set("MB", 1e6);

const UnitsRegExp = /^([0-9,\.]+) ([a-zA-Z]*)$/;
export function fromByteString(byteString: string) {
  const result = byteString.match(UnitsRegExp);
  if (result === null) {
    throw new Error("Invalid Bytes");
  }
  const [, size, unit] = result;
  const magnitude = byteMagnitude.get(unit);
  if (magnitude == null) {
    throw new Error("Unkown unit");
  }

  return Number(size) * magnitude;
}
