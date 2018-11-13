import chalk from "chalk";
import prettyBytes from "pretty-bytes";
import { ExportChange } from "./lockfile";
import { fromByteString } from "../../utils";

export function formatReportItem(change: ExportChange) {
  switch (change.type) {
    case "addition": {
      return `┌ ${chalk.yellow.bold(change.name)} [added]
│ type: ${change.export.type}
│ size: +${change.export.size}
└─────
`;
    }
    case "removal": {
      return `┌ ${chalk.yellow.bold(change.name)} [removed]
│ type: ${change.export.type}
│ size: -${change.export.size}
└─────
`;
    }
    case "change": {
      const before = {
        ...change.before,
        size: fromByteString(change.before.size)
      };
      const after = {
        ...change.after,
        size: fromByteString(change.after.size)
      };

      const diffSize = prettyBytes(Math.abs(after.size - before.size));
      if (after.size > before.size) {
        return `┌ ${chalk.bold.red(change.name)} [increase]
│ type: ${change.after.type}
│ diff: +${diffSize}
│ size: ${change.after.size}
└─────
`;
      }
      if (after.size < before.size) {
        return `┌ ${chalk.bold.green(change.name)} [decrease]
│ type: ${change.after.type}
│ diff: -${diffSize}
│ size: ${change.after.size}
└─────
`;
      }
    }
  }
}
