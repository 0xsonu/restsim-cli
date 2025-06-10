import { readFileSync } from "fs";
import YAML from "yaml";

export type FlatObject = Record<string, any>;

export function parseYamlFile(path: string): any {
  const file = readFileSync(path, "utf8");
  return YAML.parse(file);
}

export function flatten(obj: any, prefix = ""): FlatObject {
  return Object.keys(obj).reduce((acc: FlatObject, key) => {
    const pre = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(acc, flatten(value, pre));
    } else {
      acc[pre] = value;
    }
    return acc;
  }, {});
}

export function unflatten(flat: FlatObject): any {
  const result: any = {};
  for (const path in flat) {
    const keys = path.split(".");
    keys.reduce((acc, key, idx) => {
      if (idx === keys.length - 1) {
        acc[key] = flat[path];
      } else {
        acc[key] = acc[key] || {};
      }
      return acc[key];
    }, result);
  }
  return result;
}
