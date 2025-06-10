#!/usr/bin/env bun

import ora from "ora";
import chalk from "chalk";
import { parseYamlFile, flatten, unflatten } from "./parser.ts";
import { promptUser } from "./ui.ts";
import { writeYamlFile } from "./writter.ts";

async function main() {
  console.clear();
  console.log(
    chalk.green.bold("\n🛠️ Helm Values Customizer CLI (Bun Edition)\n"),
  );

  const spinner = ora("Loading values.yaml...").start();
  const defaultConfig = parseYamlFile("values.yaml");
  const flat = flatten(defaultConfig);
  spinner.succeed("Loaded values.yaml");

  console.log(chalk.blue("\n🔧 Customize the values below:\n"));
  const { result, modifiedKeys } = await promptUser(flat);
  const finalYaml = unflatten(result);

  if (modifiedKeys.size > 0) {
    console.log(chalk.green("\n✅ Modified keys:"));
    [...modifiedKeys].forEach((k) =>
      console.log(`  ${chalk.yellow("✔")} ${k}`),
    );
  } else {
    console.log(chalk.gray("\nNo changes made."));
  }

  writeYamlFile("custom-values.yaml", finalYaml);

  console.log(chalk.bold(`\n📁 Output saved to custom-values.yaml\n`));
}

main().catch((err) => {
  console.error(chalk.red("❌ Fatal Error:"), err);
  process.exit(1);
});
