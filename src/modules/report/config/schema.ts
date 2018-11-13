import * as yup from "yup";
import { logger } from "../../../logger";

export type TreeshackleConfig = {
  modules: {
    exclude: string[];
  };
};

export const schema = yup
  .object({
    modules: yup
      .object({
        exclude: yup
          .array()
          .of(yup.string())
          .ensure()
      })
      .noUnknown()
  })
  .noUnknown();

export function normalize(config: any): TreeshackleConfig {
  if (!schema.isValidSync(config, { abortEarly: false, strict: true })) {
    logger.error("Invalid config. Validate first.");
    throw new Error("Invalid config");
  }

  return schema.validateSync(config, { abortEarly: false });
}

export function validate(config: any): string[] {
  try {
    schema.validateSync(config, { strict: true });
    return [];
  } catch (error) {
    return error.errors;
  }
}
