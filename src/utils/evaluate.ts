import chalk from "chalk"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function evaluate(exp: string, data: any): any {
  const fn = new Function("data", "with (data) { return " + exp + "}")
  try {
    return fn(data)
  } catch (e) {
    console.error(chalk.red("Error when evaluating filter condition: " + exp))
  }
}
