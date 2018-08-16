import LogDriver from "log-driver";
import chalk from "chalk";

function formatLogging(level: string, ...messages: string[]) {
  let output = "";
  switch (level) {
    case "fail":
      output += chalk.black.bgRed("fail");
      break;
    case "error":
      output += chalk.red("erro");
      break;
    case "warn":
      output += chalk.yellow("warn");
      break;
    case "info":
      output += chalk.blue("info");
      break;
    case "debug":
      output += chalk.bgGreen.black("debg");
      break;
    case "silly":
      output += chalk.bgCyan.black("sill");
      break;
  }
  return `${output}  ${messages.join("  ")}`;
}

export const logger = LogDriver({
  levels: ["fail", "error", "warn", "info", "debug", "silly"],
  level: process.env.LOG_LEVEL || "info",
  format: formatLogging
});
