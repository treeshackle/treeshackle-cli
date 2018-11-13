import FsExtra from "fs-extra";
import path from "path";
import { InvalidConfigurationException } from "../exceptions";
import { TreeshackleConfig, validate, normalize } from "./schema";
import { logger } from "../../../logger";

interface Dependencies {
  fs: typeof FsExtra;
}

const CONFIG_DEFAULT_FILE_NAME = "treeshackle.json";

export function createConfigProvider({ fs }: Dependencies) {
  /**
   * Get the config file from the specified folder or return a default one if
   * there is none.
   */
  async function get(dir: string): Promise<TreeshackleConfig> {
    // TODO: Look up in the directory tree and allow children to override a
    // parent config as in a monorepo.
    const configPath = path.resolve(dir, CONFIG_DEFAULT_FILE_NAME);
    const exists = await fs.pathExists(configPath);

    if (!exists) {
      logger.debug("No config file found. Falling back to defaults.");
      return normalize({});
    }

    logger.debug("Config file found. Loading configuration from:", configPath);
    try {
      const config = await fs.readJson(configPath);

      let errors = validate(config);
      if (errors.length > 0) {
        throw new InvalidConfigurationException(errors);
      }

      return normalize(config);
    } catch (error) {
      logger.error("There was an error reading the configuration file.", error);
      throw error;
    }
  }

  return {
    get
  };
}
