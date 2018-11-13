import path from "path";
import webpack from "webpack";
import { logger } from "../../../logger";
import { TreeshackleConfig } from "../config/schema";
import { FILES_DIR_IN, FILES_DIR_OUT } from "./config";
import { createMemoryFs, createWebpackCompiler } from "./webpack";

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

export async function compile(
  exportsList: ILibraryDefinition[],
  config: TreeshackleConfig,
  progressCallback: (progress: number) => void
): Promise<ISizedLibraryExport[]> {
  const exportDefinitions = exportsList.map(generateExportDefinition);

  logger.debug("Instansiate in-memory file system");
  const memfs = createMemoryFs();
  const entries = {} as webpack.Entry;

  logger.debug("Preparing to write input files to in-memory file system");
  for (let { inpath, file, name } of exportDefinitions) {
    logger.debug("Write input file to memory fs", inpath);
    logger.silly("File Content", file);
    memfs.writeFileSync(inpath, file);
    entries[name] = inpath;
  }

  logger.debug("Configuring webpack to compile in-memory files");
  const compiler = createWebpackCompiler(
    memfs,
    entries,
    config.modules.exclude,
    progressCallback
  );

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
      logger.silly("File content", file);
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
