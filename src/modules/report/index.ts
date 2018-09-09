import esm from "esm";
import fs from "fs-extra";
import ora from "ora";
import path from "path";
import prettyBytes from "pretty-bytes";
import { CommandModule } from "yargs";
import { logger } from "../../logger";
import { compile, ILibraryDefinition } from "./compiler";
import {
  createReport,
  diffReport,
  generateLockfile,
  getExportType,
  ILockfile
} from "./lockfile";
import { LOCKFILE_NAME, LOCKFILE_PATH, WORK_DIR } from "./consts";
import { pluralize } from "../../utils";
import chalk from "chalk";

const requireModule = esm(module);

export const command: CommandModule = {
  command: ["report", "*"],
  describe: "Generate a report on the exported modules of your library.",
  builder: {
    write: {
      alias: ["w"],
      type: "boolean",
      demand: false,
      default: false,
      describe: `Write report to lockfile '${LOCKFILE_NAME}'`
    },
    ci: {
      alias: ["c"],
      type: "boolean",
      demand: false,
      default: false,
      describe: `Exit with status code 1 if output does not match '${LOCKFILE_NAME}'`
    }
  },
  async handler(args) {
    const moduleExports = await getPackageJson(WORK_DIR)
      .then(resolveModulePath)
      .then(requireModule)
      .then(resolveModuleExports);

    const exportTerm = pluralize("export", moduleExports.length);
    const units = `${moduleExports.length} ${exportTerm}`;

    logger.info(`Found ${units}`);
    const spinner = ora("Analyzing module...").start();
    const sizedLibExports = await compile(moduleExports, (progress: number) => {
      spinner.text = `${Math.round(progress * 100)}% Compiling ${units}.`;
    });

    const exportsReport = createReport(sizedLibExports);

    if (args.ci) {
      // Running in CI mode...
      const previousLockfile = await fs
        .readFile(LOCKFILE_PATH)
        .then(buffer => buffer.toString());

      const previousReport: ILockfile = JSON.parse(previousLockfile);
      const reportDiff = diffReport(previousReport.exports, exportsReport);

      spinner.stop();
      if (reportDiff.length > 0) {
        logger.error(`Running in CI mode: ${LOCKFILE_NAME} is inconsistent.`);
        logger.error("Exiting...");
        console.log(reportDiff); // TODO: Super basic diffs to start with
        process.exit(1);
      }
      logger.info("Lockfile is consistent: Passing...");
      process.exit(0);
    }

    if (args.write) {
      const lockfile = generateLockfile(exportsReport);
      await fs.writeFile(LOCKFILE_PATH, lockfile);
      spinner.succeed(`Done! Results written to '${LOCKFILE_NAME}'`);
    } else {
      spinner.stop();
      sizedLibExports.forEach(def => {
        const width = 50 - def.name.length;
        console.log(
          `${def.name}${chalk.gray(".".repeat(width))}${prettyBytes(def.size)}`
        );
      });
    }
  }
};

async function getPackageJson(dir: string): Promise<PackageJson> {
  try {
    return <PackageJson>await fs.readJson(path.resolve(dir, "package.json"));
  } catch (error) {
    throw new Error("Unable to find 'package.json'.");
  }
}

function resolveModulePath(packageJson: PackageJson): string {
  if (packageJson.module) return packageJson.module;
  if (packageJson["jsnext:main"]) return packageJson["jsnext:main"] as string;
  logger.warn("No ES6 module definition in 'package.json'.");
  logger.warn("Falling back to default module resolution.");
  return WORK_DIR;
}

function resolveModuleExports(nodeModule: {
  [libExport: string]: any;
}): ILibraryDefinition[] {
  const libExports = Object.keys(nodeModule).sort();
  return libExports.map(name => ({
    name,
    type: getExportType(nodeModule[name])
  }));
}
