import { input, select } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { exec as execCallback } from "child_process";
import decompress from "decompress";
import decompressTargz from "decompress-targz";
import fileSelector from "inquirer-file-selector";

const exec = promisify(execCallback);

type Choice = {
  name: string;
  value: string;
};

type Question = {
  message: string;
  type: "input" | "select";
  choices?: Choice[];
  showIf?: string;
};

type QuestionsData = {
  questions: Question[];
};

type Choice = { name: string; value: string };
type Question = {
  message: string;
  type: "input" | "select";
  choices?: Choice[];
  showIf?: string;
};
type QuestionsData = { questions: Question[] };

const simulateProcessing = async (message: string, successMessage: string) => {
  const spinner = ora({
    text: chalk.yellow(message),
    spinner: "dots",
  }).start();

  const delay = Math.floor(Math.random() * 5000) + 3000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  spinner.succeed(chalk.green(successMessage));
};

const validateTemplateFile = async (filePath: string) => {
  try {
    await simulateProcessing(
      "Checking if path exists...",
      "Path exists validation completed"
    );

    if (!fs.existsSync(filePath)) {
      throw new Error("The specified path does not exist");
    }

    await simulateProcessing(
      "Verifying file existence...",
      "File existence verified"
    );

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      throw new Error("The path does not point to a file");
    }

    await simulateProcessing(
      "Validating file extension...",
      "File extension validation completed"
    );

    if (path.extname(filePath).toLowerCase() !== ".zip") {
      throw new Error("The file must be a .zip file");
    }

    const tempDir = path.join(__dirname, "temp_validation");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const extractionSpinner = ora({
      text: chalk.yellow("Extracting and validating zip contents..."),
      spinner: "dots",
    }).start();

    try {
      const files = await decompress(filePath, tempDir, {
        plugins: [decompressTargz()],
      });

      extractionSpinner.succeed(chalk.green("Zip extraction completed"));

      await simulateProcessing(
        "Checking for required files...",
        "Required files check completed"
      );

      const hasValidFiles = files.some(
        (file) => file.path.endsWith(".bin.gz") || file.path.endsWith(".gpb.gz")
      );

      if (!hasValidFiles) {
        throw new Error(
          "Zip file must contain at least one .bin.gz or .gpb.gz file"
        );
      }

      fs.rmSync(tempDir, { recursive: true, force: true });

      return true;
    } catch (err) {
      extractionSpinner.fail(chalk.red("Failed to extract zip file"));
      throw err;
    }
  } catch (error) {
    throw error;
  }
};

async function loadQuestions(): Promise<QuestionsData> {
  const data = fs.readFileSync(path.join(__dirname, "questions.json"), "utf-8");
  return JSON.parse(data);
}

function shouldShowQuestion(
  question: Question,
  answers: Record<string, string>
): boolean {
  if (!question.showIf) return true;
  try {
    return new Function("answers", `return ${question.showIf}`)(answers);
  } catch (error) {
    console.error(
      chalk.red(`Error evaluating showIf condition: ${question.showIf}`)
    );
    return false;
  }
}

async function runQuestionnaire() {
  const initialSpinner = ora(chalk.blue("Starting questionnaire...")).start();

  try {
    const questionsData = await loadQuestions();
    initialSpinner.succeed(chalk.green("Questionnaire ready!"));
    console.log(chalk.bold.green("\nPlease answer the following questions:\n"));

    const answers: Record<string, string> = {};

    for (const question of questionsData.questions) {
      if (!shouldShowQuestion(question, answers)) continue;

      let answer: string = "";

      if (question.type === "select") {
        if (!question.choices)
          throw new Error(
            `Missing choices for select question: ${question.message}`
          );
        answer = await select({
          message: chalk.blue(question.message),
          choices: question.choices.map((choice) => ({
            name: choice.name,
            value: choice.value,
          })),
        });
      } else if (question.type === "input") {
        answer = await input({
          message: chalk.blue(question.message),
        });

        if (question.message.includes("Template File zip location")) {
          const validationSpinner = ora(
            chalk.yellow("Starting template file validation...")
          ).start();

          try {
            await validateTemplateFile(answer);
            validationSpinner.succeed(
              chalk.green("Template file validation successful!")
            );
          } catch (error) {
            validationSpinner.fail(
              chalk.red(
                `Validation failed: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`
              )
            );
            console.log(
              chalk.yellow("\nPlease provide a valid template file path:")
            );
            questionIndex--; // Go back one question
            continue;
          }
        }
      } else if (question.type === "file-selector") {
        const selection: Item = await fileSelector({
          message: question.message,
          basePath: process.cwd(),
        });
        console.log(selection);
        answer = selection.path;
      }

      answers[question.message.trim().replace(/[:?]\s*$/, "")] = answer;
    }

    console.log(chalk.bold("\n🎉 Questionnaire completed successfully!"));
    console.log(chalk.bold("\nYour answers:"));
    console.log(answers);

    return answers;
  } catch (error) {
    initialSpinner.fail(chalk.red("Questionnaire failed"));
    console.error(
      chalk.red(
        error instanceof Error ? error.message : "An unknown error occurred"
      )
    );
    throw error;
  }
}

// Install required dependencies: npm install decompress decompress-targz @types/node
runQuestionnaire().catch(() => process.exit(1));
