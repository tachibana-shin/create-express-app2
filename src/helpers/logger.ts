// eslint-disable-next-line import/order
import { format } from "util";
import chalk from "chalk";

const prefix = "  create-express-app";
const sep = chalk.gray("·");

// eslint-disable-next-line functional/functional-parameters, @typescript-eslint/no-explicit-any
export function log(...args: any) {
  const msg = format.apply(format, args);
  console.log(chalk.white(prefix), sep, msg);
}
// eslint-disable-next-line functional/functional-parameters, @typescript-eslint/no-explicit-any
export function fatal(...args: any) {
  // eslint-disable-next-line functional/immutable-data
  if (args[0] instanceof Error) args[0] = args[0].message.trim();
  const msg = format.apply(format, args);
  console.error(chalk.red(prefix), sep, msg);
  process.exit(1);
}
// eslint-disable-next-line functional/functional-parameters, @typescript-eslint/no-explicit-any
export function success(...args: any) {
  const msg = format.apply(format, args);
  console.log(chalk.white(prefix), sep, msg);
}
