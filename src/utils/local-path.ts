import { isAbsolute, join, normalize } from "path";

export function isLocalPath(templatePath: string) {
  return /^[./]|(^[a-zA-Z]:)/.test(templatePath);
}
export function getTemplatePath(templatePath: string) {
  return isAbsolute(templatePath)
    ? templatePath
    : normalize(join(process.cwd(), templatePath));
}