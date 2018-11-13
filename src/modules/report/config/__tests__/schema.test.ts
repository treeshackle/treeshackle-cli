import { normalize } from "../schema";

describe("normalize", () => {
  it("should normalize the object if it is valid", () => {
    expect(normalize({})).toEqual({ modules: { exclude: [] } });
  });
  it("should throw an error if the object is invalid", () => {
    expect(() => normalize({ foo: "bar" })).toThrow();
  });
});
