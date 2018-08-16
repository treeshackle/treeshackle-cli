import { CommandModule } from "yargs";
import fs from "fs-extra";
import path from "path";
import esm from "esm";
import { logger } from "../../logger";
import { compile, SizedDefinition } from "./compiler";
import ora from "ora";
import prettyBytes from "pretty-bytes";
import yaml from "js-yaml";
import * as diff from "diff";
import chalk from "chalk";

const requireModule = esm(module);
const LOCKFILE_NAME = "treeshackle-lock.yaml";
const LOCKFILE_PATH = path.resolve(process.cwd(), LOCKFILE_NAME);

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
    const modPath = await resolveModulePath(process.cwd());
    const lib = requireModule(modPath);
    const componentList = Object.keys(lib).sort();

    const EXPORT_COUNT = componentList.length;

    logger.info(
      `Found ${componentList.length} component${EXPORT_COUNT === 1 ? "" : "s"}`
    );

    // TODO: Allow defining what exports you want to generate the lockfile for
    logger.info(
      "No lib definitions found. Generating lockfile for all exports."
    );

    const spinner = ora(`0% Compiling ${EXPORT_COUNT} exports...`).start();

    const result = await compile(componentList, (progress: number) => {
      const percentageComplete = Math.round(progress * 100);
      spinner.text = `${percentageComplete}% Compiling ${EXPORT_COUNT} exports...`;
    });

    const lockfile = createLockFile(result);

    if (args.ci) {
      const oldLockfile = (await fs.readFile(LOCKFILE_PATH)).toString();
      const lockDiff = diff.diffTrimmedLines(oldLockfile, lockfile);
      if (lockDiff.length > 1) {
        spinner.stop();
        logger.warn(`${LOCKFILE_NAME} has changes. Exiting...`);
        generateDiffOutput(lockDiff);
        process.exit(1);
      }
    }

    if (args.write) {
      await fs.writeFile(LOCKFILE_PATH, lockfile);
      spinner.succeed(`Done! Results written to '${LOCKFILE_NAME}'`);
    } else {
      spinner.stop();
      result.forEach(def => {
        const name = def.name.padEnd(35, " ");
        console.log(`${name} = ${prettyBytes(def.size)}`);
      });
    }
  }
};

async function resolveModulePath(dir: string) {
  let packageJson;
  let mod = dir;
  try {
    packageJson = await fs.readJson(path.resolve(dir, "package.json"));
  } catch (error) {
    logger.error("Not an npm library. Unable to find package.json.");
    process.exit(1);
  }

  if (!packageJson.module) {
    logger.warn("There is no ES6 module definition in the package.json file.");
    logger.info("Falling back to default node module resolution...");
  } else {
    mod = packageJson.module;
  }

  return path.resolve(dir, mod);
}

export function createLockFile(defs: SizedDefinition[]) {
  const obj = defs.reduce((data: any, def) => {
    return {
      ...data,
      [def.name]: prettyBytes(def.size || 0)
    };
  }, {});

  return yaml.dump({
    treeshackle: { version: "1.0.0" },
    exports: obj
  });
}

/**
 * TODO: Better diffing. Not just textual.
 */
export function generateDiffOutput(diff: diff.IDiffResult[]) {
  for (let d of diff) {
    const lines = d.value.trim().split("\n");
    if (d.added) {
      process.stdout.write(chalk.green(lines.map(x => `+ ${x}`).join("\n")));
    }
    if (d.removed) {
      process.stdout.write(chalk.red(lines.map(x => `- ${x}`).join("\n")));
    }
    process.stdout.write("\n");
  }
}
