import path from "path";
import * as pjson from "../../../package.json";

export const WORK_DIR = process.cwd();
export const LOCKFILE_NAME = "treeshackle-lock.json";
export const LOCKFILE_PATH = path.resolve(WORK_DIR, LOCKFILE_NAME);
export const VERSION =
  process.env.NODE_ENV === "test" ? "1.0.0-test" : pjson.version;
