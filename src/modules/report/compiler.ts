import fs from "fs";
import path from "path";
// @ts-ignore
import ufs from "unionfs";
import MemoryFs from "memory-fs";
import webpack from "webpack";
import { logger } from "../../logger";

const WORKDIR = process.cwd(); // TODO: crawl up to get package.json
const WORKSPACE = path.resolve(WORKDIR, ".treeshackle");
const FILES_DIR_IN = path.resolve(WORKSPACE, "in");
const FILES_DIR_OUT = path.resolve(WORKSPACE, "out");

export interface ExportDefinition {
  name: string;
  file: string;
  inpath: string;
  outpath: string;
}

export interface SizedDefinition extends ExportDefinition {
  size: number;
}

export async function compile(
  exportsList: string[],
  progressCallback: (progress: number) => void
): Promise<SizedDefinition[]> {
  const exportDefinitions = exportsList.map(generateExportDefinition);

  const memfs = new MemoryFs();
  memfs.mkdirpSync(FILES_DIR_IN);
  memfs.mkdirpSync(FILES_DIR_OUT);

  const entries = {} as webpack.Entry;
  logger.debug("Preparing to write input files to in memory file system");
  for (let { inpath, file, name } of exportDefinitions) {
    logger.silly("Write input file to memory fs", inpath);
    memfs.writeFileSync(inpath, file);
    entries[name] = inpath;
  }

  logger.debug("Configuring webpack to compile in-memory files");
  const compiler = webpack({
    externals: [/^[^\.\/].+$/],
    target: "node",
    context: WORKDIR,
    mode: "production",
    optimization: {
      runtimeChunk: {
        name: "webpack"
      }
    },
    entry: entries,
    output: {
      path: FILES_DIR_OUT
    },
    resolve: {
      mainFields: ["module"]
    },
    plugins: [new webpack.ProgressPlugin(progressCallback)],
    cache: false
  });

  logger.debug("Creating union filesystem for Webpack compilation");
  compiler.inputFileSystem = ufs.use(fs).use(memfs);
  compiler.outputFileSystem = memfs as any; // TODO: Where is the purge method on memory-fs?

  logger.debug("Initializing webpack compiler");
  await new Promise((resolve, reject) =>
    compiler.run((error, stats) => {
      logger.debug("Webpack compilation complete");
      if (error) reject(error);
      else resolve(stats);
    })
  );

  const sizedExports: SizedDefinition[] = [];
  logger.debug("Measuring size of compiled output files for each export");
  for (let definition of exportDefinitions) {
    try {
      logger.silly("Reading compiled file from memory fs", definition.outpath);
      const file = memfs.readFileSync(definition.outpath);
      const size = Buffer.byteLength(file, "utf8");
      logger.silly("Measuring size of file", definition.outpath, size);
      sizedExports.push({ ...definition, size });
    } catch (error) {
      logger.error("There was an error reading the compiled resource", error);
      throw error;
    }
  }

  return sizedExports;
}

export function generateExportDefinition(
  componentName: string
): ExportDefinition {
  return {
    file: `import { ${componentName} as c } from "../.."; c;`,
    name: componentName,
    inpath: path.resolve(FILES_DIR_IN, `${componentName}.js`),
    outpath: path.resolve(FILES_DIR_OUT, `${componentName}.js`)
  };
}
