import fs from "fs";
import ufs from "unionfs";
import MemoryFs from "memory-fs";
import webpack from "webpack";
import { logger } from "../../../logger";
import { WORK_DIR } from "../consts";
import { FILES_DIR_OUT, FILES_DIR_IN } from "./config";

export const webpackConfig: (
  exclude: string[]
) => webpack.Configuration = exclude => ({
  externals: [
    (context, request, callback) => {
      logger.silly({ request, context });
      if (exclude.includes(request)) {
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
});

export function createMemoryFs() {
  const memfs = new MemoryFs();
  logger.silly("Create in-memory folder structure");
  memfs.mkdirpSync(FILES_DIR_IN);
  memfs.mkdirpSync(FILES_DIR_OUT);
  return memfs;
}

export function createWebpackCompiler(
  memfs: MemoryFs,
  entries: webpack.Entry,
  excludedModules: string[],
  progressCallback: (progress: number) => void
) {
  const compiler = webpack({
    ...webpackConfig(excludedModules),
    entry: entries,
    plugins: [new webpack.ProgressPlugin(progressCallback)]
  });

  logger.debug("Creating union filesystem for Webpack compilation");

  compiler.inputFileSystem = ufs.use(fs).use(memfs) as any;
  compiler.outputFileSystem = memfs as any;
  return compiler;
}
