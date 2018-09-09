import { ISizedLibraryExport } from "../compiler";
import {
  generateLockfile,
  getExportType,
  createReport,
  diffReport,
  IExportReport
} from "../lockfile";

const libExports: ISizedLibraryExport[] = [
  {
    name: "foo",
    size: 12345,
    file: "foo/bar.js",
    inpath: "in/path.js",
    outpath: "out/path.js",
    type: "function"
  },
  {
    name: "bar",
    size: 987,
    file: "bar/foo.js",
    inpath: "path/in.js",
    outpath: "path/out.js",
    type: "function"
  }
];

const testReport1: IExportReport = {
  fooBar: {
    size: "1.81 kB",
    type: "function"
  },
  bazBar: {
    size: "5.81 kB",
    type: "function"
  },
  test: {
    size: "12.3 kB",
    type: "function"
  }
};

const testReport2: IExportReport = {
  fooBar: {
    size: "2.81 kB",
    type: "function"
  },
  bazBar: {
    size: "5.81 kB",
    type: "string"
  },
  bangBox: {
    size: "480 B",
    type: "string"
  }
};

describe("generateLockfile", () => {
  it("should match the lockfile snapshot", () => {
    expect(generateLockfile(testReport1)).toMatchSnapshot();
  });
});

describe("getExportType", () => {
  it("should return the type of the export", () => {
    // Initial version of treeshackle is only going to be able to
    // get the primitive type.
    expect(getExportType("foo")).toBe("string");
    expect(getExportType(() => {})).toBe("function");
    expect(getExportType(4)).toBe("number");
    expect(getExportType({})).toBe("object");
  });
});

describe("createReport", () => {
  expect(createReport(libExports)).toMatchSnapshot();
});

describe("diffReport", () => {
  it("should match the diff snapshot", () => {
    expect(diffReport(testReport1, testReport2)).toMatchSnapshot();
  });
});
