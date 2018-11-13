import path from "path";
import { WORK_DIR } from "../consts";

export const WORKSPACE = path.resolve(WORK_DIR, ".treeshackle");
export const FILES_DIR_IN = path.resolve(WORKSPACE, "in");
export const FILES_DIR_OUT = path.resolve(WORKSPACE, "out");
