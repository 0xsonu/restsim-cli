import { writeFileSync } from "fs";
import YAML from "yaml";

export function writeYamlFile(path: string, data: any) {
  const content = YAML.stringify(data);
  writeFileSync(path, content, "utf8");
}
