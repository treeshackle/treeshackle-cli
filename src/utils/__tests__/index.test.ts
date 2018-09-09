import { pluralize } from "..";

describe("pluralize", () => {
  it("should pluralize words correctly", () => {
    expect(pluralize("test", 1)).toBe("test");
    expect(pluralize("test", 0)).toBe("tests");
    expect(pluralize("test", 2)).toBe("tests");
    expect(pluralize("test", 1234)).toBe("tests");
    expect(pluralize("test", -1234)).toBe("tests");
  });
});
