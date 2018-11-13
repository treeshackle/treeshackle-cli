import { fromByteString } from "../bytes";

describe("fromByteString", () => {
  it("should return the number of bytes of the string representation", () => {
    expect(fromByteString("1.22 MB")).toBe(1220000);
    expect(fromByteString("3.293MB")).toBe(3293000);
    expect(fromByteString("3 MB")).toBe(3000000);
    expect(fromByteString(".3 MB")).toBe(300000);
    expect(fromByteString("0.3MB")).toBe(300000);
    expect(fromByteString("1.3 kB")).toBe(1300);
    expect(fromByteString("199B")).toBe(199);
  });

  it("should throw an error for an unknown unit", () => {
    expect(fromByteString.bind(null, "122mnn")).toThrowError("Unknown unit");
  });

  it("should throw an error for nonsensical string", () => {
    expect(fromByteString.bind(null, "oj2j23")).toThrowError("Invalid Bytes");
  });
});
