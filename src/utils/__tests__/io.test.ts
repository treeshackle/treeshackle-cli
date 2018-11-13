import { disableStdio, enableStdio } from "../io";

describe("disableStdio", () => {
  it("should monkeypatch the stdout and stderr methods", () => {
    const mockStdout = jest.fn();
    const mockStderr = jest.fn();

    process.stdout.write = mockStdout;
    process.stderr.write = mockStderr;

    disableStdio();
    console.log("foo");
    console.error("bar");
    enableStdio();

    expect(mockStdout).not.toHaveBeenCalled();
    expect(mockStderr).not.toHaveBeenCalled();
  });
});
