#!/usr/bin/env bun

import ora from "ora";
import chalk from "chalk";
import { parseYamlFile } from "./parser.ts";
import { writeYamlFile } from "./writter.ts";
import { promptFromSchema } from "./ui.ts";
import { HelmValuesSchema } from "./schema.ts";

async function main() {
  console.clear();
  console.log(
    chalk.green.bold("\n🛠️ Helm Values Customizer CLI (Schema-Based)\n"),
  );

  const spinner = ora("Loading values.yaml...").start();
  const defaultConfig = parseYamlFile("values.yaml");
  spinner.succeed("Loaded values.yaml");

  console.log(chalk.blue("\n🔧 Customize your Helm values below:\n"));

  const userInput = await promptFromSchema(defaultConfig, HelmValuesSchema);

  const parsed = HelmValuesSchema.safeParse(userInput);
  if (!parsed.success) {
    console.error(
      chalk.red("❌ Invalid configuration:"),
      parsed.error.format(),
    );
    process.exit(1);
  }

  writeYamlFile("custom-values.yaml", userInput);

  console.log(chalk.bold(`\n📁 Saved to custom-values.yaml\n`));
}

main().catch((err) => {
  console.error(chalk.red("❌ Unexpected Error:"), err);
  process.exit(1);
});
