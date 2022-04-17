import { execSync } from "child_process"

export function gitUserName() {
  try {
    return execSync("git config --get user.name") + ""
  } catch {
    return ""
  }
}
