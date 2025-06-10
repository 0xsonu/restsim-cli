import { input, select } from "@inquirer/prompts";
import chalk from "chalk";
import {
  type ZodTypeAny,
  ZodObject,
  ZodEnum,
  ZodLiteral,
  ZodUnion,
  ZodNumber,
  ZodBoolean,
  ZodString,
  ZodType,
} from "zod";

export async function promptFromSchema(
  currentValue: any,
  schema: ZodTypeAny,
  pathPrefix = "",
): Promise<any> {
  if (schema instanceof ZodObject) {
    const result: Record<string, any> = {};
    const shape = schema.shape;

    for (const key of Object.keys(shape)) {
      const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      const value = currentValue?.[key];
      const fieldSchema = shape[key];

      result[key] = await promptFromSchema(value, fieldSchema, fullPath);
    }
    return result;
  }

  const displayName = chalk.cyan(pathPrefix);
  const defaultValue = currentValue;

  const options = extractOptions(schema);
  let finalValue: any;

  if (options.length > 0) {
    const selected = await select({
      message: `Choose value for ${displayName} (${chalk.gray(defaultValue)}):`,
      choices: [
        ...options.map((opt) => ({ name: String(opt), value: opt })),
        { name: "Not in list", value: "__custom__" },
      ],
    });

    if (selected === "__custom__") {
      const customInput = await input({
        message: `Enter custom value for ${displayName}:`,
        default: String(defaultValue),
      });
      finalValue = castValue(customInput, schema);
    } else {
      finalValue = selected;
    }
  } else {
    const userInput = await input({
      message: `Enter value for ${displayName} (${chalk.gray(defaultValue)}):`,
      default: String(defaultValue),
    });
    finalValue = castValue(userInput, schema);
  }

  return finalValue;
}

function extractOptions(schema: ZodTypeAny): any[] {
  if (schema instanceof ZodEnum) {
    return schema.options;
  }

  if (schema instanceof ZodUnion) {
    return schema._def.options
      .filter((s: ZodTypeAny) => s instanceof ZodLiteral)
      .map((s: ZodLiteral<any>) => s.value);
  }

  return [];
}

function castValue(value: string, schema: ZodTypeAny): any {
  if (schema instanceof ZodNumber) {
    const num = Number(value);
    return isNaN(num) ? value : num;
  }

  if (schema instanceof ZodBoolean) {
    return value.toLowerCase() === "true";
  }

  if (schema instanceof ZodEnum || schema instanceof ZodString) {
    return value;
  }

  return value;
}
