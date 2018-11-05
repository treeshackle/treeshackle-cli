import fs from "fs";
import path from "path";
import ufs from "unionfs";
import MemoryFs from "memory-fs";
import webpack from "webpack";
import { logger } from "../../logger";
import { WORK_DIR } from "./consts";

const WORKSPACE = path.resolve(WORK_DIR, ".treeshackle");
const FILES_DIR_IN = path.resolve(WORKSPACE, "in");
const FILES_DIR_OUT = path.resolve(WORKSPACE, "out");

export interface ILibraryDefinition {
  name: string;
  type: string;
}

export interface ILibraryExport extends ILibraryDefinition {
  file: string;
  inpath: string;
  outpath: string;
}

export interface ISizedLibraryExport extends ILibraryExport {
  size: number;
}

// This should be customiseable
const excludeExternals = ["react", "react-dom", "styled-components"];

const webpackConfig: webpack.Configuration = {
  externals: [
    (context, request, callback) => {
      logger.silly({ request, context });
      if (excludeExternals.includes(request)) {
        callback(null, "commonjs " + request);
      } else {
        callback(null, undefined);
      }
    }
  ],
  target: "node",
  context: WORK_DIR,
  mode: "production",
  optimization: {
    runtimeChunk: {
      name: "webpack"
    }
  },
  output: {
    path: FILES_DIR_OUT
  },
  cache: false
};

logger.silly({ FILES_DIR_OUT, FILES_DIR_IN });

export async function compile(
  exportsList: ILibraryDefinition[],
  progressCallback: (progress: number) => void
): Promise<ISizedLibraryExport[]> {
  const exportDefinitions = exportsList.map(generateExportDefinition);

  logger.debug("Instansiate in-memory file system");
  const memfs = new MemoryFs();
  logger.silly("Create in-memory folder structure");
  memfs.mkdirpSync(FILES_DIR_IN);
  memfs.mkdirpSync(FILES_DIR_OUT);

  const entries = {} as webpack.Entry;
  logger.debug("Preparing to write input files to in-memory file system");

  for (let { inpath, file, name } of exportDefinitions) {
    logger.silly("Write input file to memory fs", inpath);
    logger.silly("File Content", file);
    memfs.writeFileSync(inpath, file);
    entries[name] = inpath;
  }

  logger.debug("Configuring webpack to compile in-memory files");
  const compiler = webpack({
    ...webpackConfig,
    entry: entries,
    plugins: [new webpack.ProgressPlugin(progressCallback)]
  });

  logger.debug("Creating union filesystem for Webpack compilation");
  compiler.inputFileSystem = ufs.use(fs).use(memfs) as any; // TODO: Figure out a better way to express this type
  compiler.outputFileSystem = memfs as any; // TODO: Where is the purge method on memory-fs?

  logger.debug("Initializing webpack compiler");
  try {
    const stats = await new Promise((resolve, reject) =>
      compiler.run((error, stats) => {
        logger.debug("Webpack compilation complete");
        if (error) reject(error);
        else resolve(stats);
      })
    );

    logger.silly("Webpack stats", stats);
  } catch (error) {
    logger.error("Compilation error", error);
    throw error;
  }

  const sizedExports: ISizedLibraryExport[] = [];
  logger.debug("Measuring size of compiled output files for each export");
  for (let definition of exportDefinitions) {
    try {
      logger.silly("Reading compiled file from memory fs", definition.outpath);
      const file = memfs.readFileSync(definition.outpath) as Buffer;
      //logger.silly("File content", file);
      logger.silly("Measure size of file", definition.outpath, file.byteLength);
      sizedExports.push({ ...definition, size: file.byteLength });
    } catch (error) {
      logger.error("There was an error reading the compiled resource", error);
      throw error;
    }
  }

  return sizedExports;
}

export function generateExportDefinition(
  libraryDef: ILibraryDefinition
): ILibraryExport {
  return {
    file: `import { ${libraryDef.name} as c } from "../.."; c;`,
    name: libraryDef.name,
    type: libraryDef.type,
    inpath: path.resolve(FILES_DIR_IN, `${libraryDef.name}.js`),
    outpath: path.resolve(FILES_DIR_OUT, `${libraryDef.name}.js`)
  };
}
