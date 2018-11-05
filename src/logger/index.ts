import LogDriver from "log-driver";
import chalk from "chalk";

type Loggable = Object | string;

function stringify(value: Loggable): string {
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return value.toString();
    }
  }

  return value;
}

function formatLogging(level: string, ...messages: Loggable[]) {
  let output = "";

  if (level === "fail") output += chalk.black.bgRed("FAIL");
  if (level === "error") output += chalk.red("ERRO");
  if (level === "warn") output += chalk.yellow("WARN");
  if (level === "info") output += chalk.blue("INFO");
  if (level === "debug") output += chalk.blue("DEBG");
  if (level === "silly") output += chalk.black.bgBlue("SILL");

  return `${output}  ${messages.map(stringify).join("  ")}`;
}

export const logger = LogDriver({
  levels: ["fail", "error", "warn", "info", "debug", "silly"],
  level: process.env.LOG_LEVEL || "info",
  format: formatLogging
});
