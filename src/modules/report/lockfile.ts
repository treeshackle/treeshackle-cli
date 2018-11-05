import prettyBytes from "pretty-bytes";
import { ISizedLibraryExport } from "./compiler";
import { VERSION } from "./consts";

export type IReportItem = {
  size: string;
  type: string;
};

export type IExportReport = {
  [moduleName: string]: IReportItem;
};

export type ILockfile = {
  treeshackle: {
    version: string;
  };
  exports: IExportReport;
};

export function createReport(defs: ISizedLibraryExport[]): IExportReport {
  return defs.reduce((data: any, def) => {
    return {
      ...data,
      [def.name]: {
        size: prettyBytes(def.size),
        type: def.type
      }
    };
  }, {});
}

export type ExportChange =
  | {
      type: "addition" | "removal";
      name: string;
      export: IReportItem;
    }
  | {
      type: "change";
      name: string;
      before: IReportItem;
      after: IReportItem;
    };

export function diffReport(prev: IExportReport, next: IExportReport) {
  const changes: ExportChange[] = [];

  const uniqueExports: Set<string> = new Set([
    ...Object.keys(prev),
    ...Object.keys(next)
  ]);

  for (let exportName of uniqueExports) {
    switch (true) {
      case typeof prev[exportName] === "undefined": {
        changes.push({
          type: "addition",
          name: exportName,
          export: next[exportName]
        });
        break;
      }
      case typeof next[exportName] === "undefined": {
        changes.push({
          type: "removal",
          name: exportName,
          export: prev[exportName]
        });
        break;
      }
      case prev[exportName].type !== next[exportName].type:
      case prev[exportName].size !== next[exportName].size: {
        changes.push({
          type: "change",
          name: exportName,
          before: prev[exportName],
          after: next[exportName]
        });
        break;
      }
    }
  }

  return changes;
}

export function generateLockfile(report: IExportReport) {
  return JSON.stringify(
    {
      treeshackle: { version: VERSION },
      exports: report
    },
    null,
    2
  );
}

export function getExportType(libExport: any): string {
  switch (true) {
    default: {
      return typeof libExport;
    }
  }
}
