import { createConfigProvider } from "./provider";
import fs from "fs-extra";

export const ConfigProvider = createConfigProvider({ fs });
