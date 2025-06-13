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
import boxen from "boxen";
import figlet from "figlet";
import centerAlign from "center-align";
import terminalSize from "terminal-size";
import readline from "readline";
import { confirm } from "@inquirer/prompts";
import { file } from "bun";

const exec = promisify(execCallback);

type Choice = {
  name: string;
  value: string;
};

type Question = {
  message: string;
  type: "input" | "select" | "file-selector";
  choices?: Choice[];
  showIf?: string;
};

type QuestionsData = {
  questions: Question[];
};

const getTerminalDimensions = () => {
  const { columns, rows } = terminalSize();
  return { columns, rows };
};

const createBanner = (text: string) => {
  const { columns } = getTerminalDimensions();
  const maxWidth = Math.min(columns - 10, 80);

  const figletText = figlet.textSync(text, {
    font: "Standard",
    horizontalLayout: "default",
    verticalLayout: "default",
  });

  const centeredLines = figletText
    .split("\n")
    .map((line) => centerAlign(line, columns));

  const bannerContent = centeredLines.join("\n");

  return boxen(bannerContent, {
    padding: 1,
    margin: { top: 1, bottom: 1, left: 0, right: 0 },
    borderStyle: "double",
    borderColor: "magenta",
    width: columns - 4,
    textAlignment: "center",
  });
};

const createBox = (content: string) => {
  const { columns } = getTerminalDimensions();
  const maxWidth = Math.min(columns - 10, 100);

  return boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "cyan",
    width: maxWidth,
  });
};

const simulateProcessing = async (message: string, successMessage: string) => {
  const spinner = ora({
    text: chalk.yellow(message),
    spinner: "dots",
  }).start();

  const delay = Math.floor(Math.random() * 5000) + 3000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  spinner.succeed(chalk.green(successMessage));
};

const validateTemplateFile = async (filePath: string): Promise<void> => {
  await simulateProcessing(
    "Checking if path exists...",
    "Path exists validation completed",
  );

  if (!fs.existsSync(filePath)) {
    throw new Error("The specified path does not exist");
  }

  await simulateProcessing(
    "Verifying file existence...",
    "File existence verified",
  );

  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    throw new Error("The path does not point to a file");
  }

  await simulateProcessing(
    "Validating file extension...",
    "File extension validation completed",
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
    const files = await decompress(filePath, tempDir);

    extractionSpinner.succeed(chalk.green("Zip extraction completed"));

    await simulateProcessing(
      "Checking for required files...",
      "Required files check completed",
    );

    const hasValidFiles = files.some(
      (file) => file.path.endsWith(".bin.gz") || file.path.endsWith(".gpb.gz"),
    );

    if (!hasValidFiles) {
      throw new Error(
        "Zip file must contain at least one .bin.gz or .gpb.gz file",
      );
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (err) {
    extractionSpinner.fail(chalk.red("Failed to extract zip file"));
    throw err;
  }
};

async function loadQuestions(): Promise<QuestionsData> {
  const data = fs.readFileSync(path.join(__dirname, "questions.json"), "utf-8");
  return JSON.parse(data);
}

function shouldShowQuestion(
  question: Question,
  answers: Record<string, string>,
): boolean {
  if (!question.showIf) return true;
  try {
    return new Function("answers", `return ${question.showIf}`)(answers);
  } catch (error) {
    console.error(
      chalk.red(`Error evaluating showIf condition: ${question.showIf}`),
    );
    return false;
  }
}

type ProcessingStep = {
  message: string;
  duration: [number, number];
  subSteps?: ProcessingStep[];
};

const buildProcessSteps: ProcessingStep[] = [
  {
    message: "Uploading Data to Backend",
    duration: [2000, 2500],
  },
  {
    message: "Cloning Repository",
    duration: [13000, 17000],
  },
  {
    message: "Generating Values.yaml",
    duration: [2000, 3000],
  },
  {
    message: "Applying Patch Customization based on user input",
    duration: [55000, 65000],
  },
  {
    message: "Triggering Pipeline",
    duration: [180000, 300000],
    subSteps: [
      {
        message: "Starting build process",
        duration: [10000, 15000],
      },
      {
        message: "Code scanning",
        duration: [30000, 45000],
      },
      {
        message: "Security and Vulnerability Scanning",
        duration: [60000, 90000],
      },
      {
        message: "Building Chart",
        duration: [80000, 150000],
      },
    ],
  },
  {
    message: "Cleanup",
    duration: [3000, 5000],
  },
];

const getRandomDuration = (range: [number, number]): number => {
  return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
};

const simulateProcessingSteps = async (
  steps: ProcessingStep[],
): Promise<void> => {
  console.log(
    createBox(
      chalk.bold("\n🎉 Questionnaire Completed 🎉 !\n\n") +
        chalk.bold.cyan("Building Your Environment"),
    ),
  );

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepSpinner = ora({
      text: chalk.yellow(`[${i + 1}/${steps.length}] ${step.message}...`),
      spinner: "dots",
    }).start();

    const duration = getRandomDuration(step.duration);

    if (step.subSteps && step.subSteps.length > 0) {
      stepSpinner.succeed(
        chalk.green(`[${i + 1}/${steps.length}] ${step.message}`),
      );

      for (let j = 0; j < step.subSteps.length; j++) {
        const substep = step.subSteps[j];
        const subSpinner = ora({
          text: chalk.yellow(
            `    [${j + 1}/${step.subSteps.length}] ${substep.message}...`,
          ),
          spinner: "dots",
        }).start();

        await new Promise((resolve) =>
          setTimeout(resolve, getRandomDuration(substep.duration)),
        );

        subSpinner.succeed(
          chalk.green(
            `    [${j + 1}/${step.subSteps.length}] ${substep.message}`,
          ),
        );
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, duration));
      stepSpinner.succeed(
        chalk.green(`[${i + 1}/${steps.length}] ${step.message}`),
      );
    }
  }

  console.log(
    boxen(chalk.bold.green("\n🎉 Chart Build Successful! 🎉"), {
      padding: 1,
      margin: 1,
      borderStyle: "double",
      borderColor: "green",
    }),
  );
};

const setupGracefulShutdown = () => {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  process.stdin.on("keypress", (str, key) => {
    if (key.ctrl && key.name === "c") {
      gracefulExit();
    }
  });

  ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
    process.on(signal, () => {
      gracefulExit();
    });
  });
};

const gracefulExit = () => {
  console.log("\n");
  console.log(
    boxen(
      chalk.bold.yellow(
        "👋 Gracefully shutting down SimBot CLI...\nThank you for using our tool!",
      ),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
        textAlignment: "center",
      },
    ),
  );
  process.exit(0);
};

const requestEmailAndShare = async (): Promise<boolean> => {
  console.log(
    createBox(
      chalk.yellow(
        "Please provide your email address to receive the chart version",
      ),
    ),
  );

  const email = await input({
    message: chalk.blue("Your email address:"),
    validate: (input) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input)) {
        return "Please enter a valid email address";
      }
      return true;
    },
  });

  const sharingSpinner = ora({
    text: chalk.yellow(`Sending chart details to ${email}...`),
    spinner: "dots",
  }).start();

  const duration = getRandomDuration([5000, 8000]);
  await new Promise((resolve) => setTimeout(resolve, duration));

  sharingSpinner.succeed(
    chalk.green(`Chart details successfully sent to ${email}`),
  );

  const continueUsing = await confirm({
    message: chalk.blue("Would you like to continue using SimBot CLI?"),
  });

  if (!continueUsing) {
    gracefulExit();
  }

  return continueUsing;
};

async function runQuestionnaire() {
  console.clear();
  const banner = createBanner("SIMBOT CLI");
  console.log(chalk.cyan(banner));

  const initialMessage =
    chalk.bold.blue("Welcome to SIM BOT!\n") +
    chalk.yellow(
      "This tool will guide you through setting up your environment.\n",
    );

  console.log(createBox(initialMessage));

  const initialSpinner = ora(chalk.blue("Starting questionnaire...")).start();

  try {
    const questionsData = await loadQuestions();
    initialSpinner.succeed(chalk.green("SimBot ready!"));

    const handEmoji = "👋";
    const message =
      chalk.cyanBright.bold("SimBot: ") +
      " " +
      chalk.green(`Hi! ${handEmoji}`) +
      " " +
      chalk.white("I'm here to help you simulate telecom site data.") +
      " " +
      chalk.yellow("What would you like to do today?");
    console.log(createBox(message));

    const answers: Record<string, string> = {};
    let questionIndex = 0;

    for (const question of questionsData.questions) {
      if (!shouldShowQuestion(question, answers)) continue;

      let answer: string = "";
      let isValid = false;

      while (!isValid) {
        if (question.type === "select") {
          if (!question.choices)
            throw new Error(
              `Missing choices for select question: ${question.message}`,
            );
          answer = await select({
            message:
              chalk.bold.greenBright("SimBot :   ") +
              chalk.blue(question.message) +
              chalk.bold.whiteBright("\n  USER  >   "),
            choices: question.choices.map((choice) => ({
              name: choice.name,
              value: choice.value,
            })),
          });
          isValid = true;
        } else if (question.type === "input") {
          answer = await input({
            message:
              chalk.bold.greenBright("SimBot :   ") +
              chalk.blue(question.message) +
              chalk.bold.whiteBright("\n  USER  >   "),
          });
          isValid = true;
        } else if (question.type === "file-selector") {
          let isFileValid = false;

          while (!isFileValid) {
            const selection: any = await fileSelector({
              message:
                chalk.bold.greenBright("SimBot :   ") +
                chalk.blue(question.message) +
                chalk.bold.whiteBright("\n  USER  >   "),
              basePath: process.cwd(),
            });

            if (!selection) {
              console.log(chalk.red("No file selected, please try again."));
              continue;
            }

            try {
              await validateTemplateFile(selection);

              console.log(chalk.green("Template file validation successful!"));
              answer = selection;
              isValid = true;
              isFileValid = true;
            } catch (error) {
              console.log(
                chalk.red(
                  `Validation failed: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`,
                ),
              );

              const retry = await confirm({
                message: chalk.yellow("Would you like to select another file?"),
              });

              if (!retry) {
                gracefulExit();
              }
              // Loop continues to show file selector again
            }
          }
        }
      }

      answers[question.message.trim().replace(/[:?]\s*$/, "")] = answer;
      questionIndex++;
    }

    const completionMessage =
      chalk.bold("\n🎉 Questionnaire completed successfully!\n\n") +
      chalk.bold("Your answers:\n") +
      Object.entries(answers)
        .map(([key, value]) => `${chalk.cyan(key)}: ${chalk.yellow(value)}`)
        .join("\n");

    // console.log(createBox(completionMessage));

    // console.log(chalk.bold.cyan("\nStarting the build process..."));
    await simulateProcessingSteps(buildProcessSteps);

    const shouldContinue = await requestEmailAndShare();

    if (shouldContinue) {
      console.clear();
      return runQuestionnaire();
    }
  } catch (error) {
    initialSpinner.fail(chalk.red("Questionnaire failed"));
    console.error(
      chalk.red(
        error instanceof Error ? error.message : "An unknown error occurred",
      ),
    );
    throw error;
  }
}

setupGracefulShutdown();
runQuestionnaire().catch((error) => {
  console.error(chalk.red("\nAn error occurred:"), error.message);
  gracefulExit();
});
