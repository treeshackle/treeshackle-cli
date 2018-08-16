import yargs from "yargs";
import { command as reportCommand } from "./modules/report";

yargs.command(reportCommand);

yargs
  .recommendCommands()
  .demandCommand()
  .strict();

/**
 * Generate help and output argv
 */
yargs
  .help()
  .alias("help", "h")
  .showHelpOnFail(false, "Pass --help to list available commands");