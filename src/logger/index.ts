import LogDriver from "log-driver";
import chalk from "chalk";

function formatLogging(level: string, ...messages: string[]) {
  let output = "";

  if (level === "fail") output += chalk.black.bgRed("fail");
  if (level === "error") output += chalk.red("erro");
  if (level === "warn") output += chalk.yellow("warn");
  if (level === "info") output += chalk.blue("info");
  if (level === "debug") output += chalk.blue("debg");
  if (level === "silly") output += chalk.blue("sill");

  return `${output}  ${messages.join("  ")}`;
}

export const logger = LogDriver({
  levels: ["fail", "error", "warn", "info", "debug", "silly"],
  level: process.env.LOG_LEVEL || "info",
  format: formatLogging
});
