import esm from "esm";
import fs from "fs-extra";
import ora from "ora";
import path from "path";
import prettyBytes from "pretty-bytes";
import { CommandModule } from "yargs";
import chalk from "chalk";
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
import { pluralize, disableStdio, enableStdio } from "../../utils";
import { ConfigProvider } from "./config";
import { formatReportItem } from "./view";

const requireModule = esm(module);

function silentlyEvaluateModule(file: string) {
  disableStdio();
  let result;
  let error = null;
  try {
    result = requireModule(file);
  } catch (e) {
    error = e;
  } finally {
    enableStdio();
  }

  if (error != null) {
    logger.error("There was an error evaluating module.", error);
    throw error;
  }

  return result;
}

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
    const config = await ConfigProvider.get(WORK_DIR);
    const moduleExports = await getPackageJson(WORK_DIR)
      .catch(() => logger.error("erer"))
      .then(resolveModulePath)
      .then(resolveRequirePath)
      .then(silentlyEvaluateModule)
      .then(resolveModuleExports);

    const unit = pluralize("export", moduleExports.length);
    const exportUnits = `${moduleExports.length} ${unit}`;

    logger.info(`Found ${exportUnits}`);
    const spinner = ora("Analyzing module...").start();
    const sizedLibExports = await compile(
      moduleExports,
      config,
      (p: number) => {
        spinner.text = `${Math.round(p * 100)}% Compiling ${exportUnits}.`;
      }
    );

    const exportsReport = createReport(sizedLibExports);

    if (args.ci) {
      const previousReport: ILockfile = await fs.readJSON(LOCKFILE_PATH);
      const reportDiff = diffReport(previousReport.exports, exportsReport);
      spinner.stop();

      if (reportDiff.length > 0) {
        logger.info(`Running in CI mode: ${LOCKFILE_NAME} is inconsistent.`);
        reportDiff.map(formatReportItem).forEach(result => console.log(result));
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
    logger.error("Unable to find 'package.json'. Falling back to current dir.");
    throw error;
  }
}

function resolveModulePath(packageJson: PackageJson | void): string {
  if (!packageJson) return WORK_DIR;
  if (packageJson.module) return packageJson.module;
  if (packageJson["jsnext:main"]) return packageJson["jsnext:main"];
  logger.warn("No ES6 module definition in 'package.json'.");
  logger.warn("Falling back to default module resolution.");
  return WORK_DIR;
}

function resolveRequirePath(modulePath: string) {
  return path.resolve(WORK_DIR, modulePath);
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
