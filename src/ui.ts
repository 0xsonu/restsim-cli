import { input } from "@inquirer/prompts";
import chalk from "chalk";

export async function promptUser(flatConfig: Record<string, any>) {
  const result: Record<string, any> = {};
  const modified: Set<string> = new Set();

  for (const key of Object.keys(flatConfig)) {
    const defaultVal = flatConfig[key];
    const response = await input({
      message: `Set value for ${chalk.cyan(key)} (${chalk.gray(defaultVal)}):`,
      default: String(defaultVal),
    });

    const finalVal =
      response === "" ? defaultVal : castValue(response, defaultVal);
    if (finalVal !== defaultVal) modified.add(key);
    result[key] = finalVal;
  }

  return { modifiedKeys: modified, result };
}

function castValue(input: string, original: any): any {
  if (typeof original === "number") {
    const num = Number(input);
    return isNaN(num) ? input : num;
  }
  if (typeof original === "boolean") {
    return input.toLowerCase() === "true";
  }
  return input;
}
