import { spawn, SpawnOptions } from "child_process"
import fs from "fs"
import path from "path"

import chalk from "chalk";

function sortDependencies(data: {
   readonly inPlace: boolean; 
   readonly destDirName: string; }): void {
  const packageJsonFile = path.join(
    data.inPlace ? "" : data.destDirName,
    "package.json"
  );
  const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, "utf8"));
  // eslint-disable-next-line functional/immutable-data
  packageJson.devDependencies = sortObject(packageJson.devDependencies);
  // eslint-disable-next-line functional/immutable-data
  packageJson.dependencies = sortObject(packageJson.dependencies);
  fs.writeFileSync(
    packageJsonFile,
    JSON.stringify(packageJson, null, 2) + "\n"
  );
};

function installDependencies(
  cwd: string,
  executable = "npm"
) {
  console.log(`\n\n# ${chalk.green("Installing project dependencies ...")}`);
  console.log("# ========================\n");
  return runCommand(executable, ["install"], {
    cwd,
  });
};

function printMessage(data: {
   readonly inPlace: boolean; readonly destDirName: string;
   readonly autoInstall?: string;
   }, { green, yellow }: typeof chalk) {
  const message = `
# ${green("Project initialization finished!")}
# ========================

To get started:

  ${yellow(
    `${data.inPlace ? "" : `cd ${data.destDirName}\n  `}${installMsg(data)}npm run lint -- --fix (or for yarn: yarn run lint --fix)
    npm run dev`
  )}
  
  
`;
  console.log(message);
};

function installMsg(data: { 
  readonly autoInstall?: string; }) {
  return !data.autoInstall ? "npm install (or if using yarn: yarn)\n  " : "";
}

function runCommand(cmd: string, args: readonly string[], options:SpawnOptions) {
  return new Promise<void>((resolve) => {
    const swan = spawn(
      cmd,
      args,
        {
          cwd: process.cwd(),
          stdio: "inherit",
          shell: true,
        ...options
        }
    );

    swan.on("exit", resolve);
  });
}

function sortObject(object: Record<string, string>) {
  // Based on https://github.com/yarnpkg/yarn/blob/v1.3.2/src/config.js#L79-L85
  const sortedObject : typeof object = {};
  // eslint-disable-next-line functional/immutable-data
  Object.keys(object)
    .sort()
    .forEach((item) => {
      // eslint-disable-next-line functional/immutable-data
      sortedObject[item] = object[item];
    });

  return sortedObject;
}

export  async function complete(data: { 
  readonly inPlace: boolean; readonly destDirName: string; readonly autoInstall?: string; }) {
    const green = chalk.green;

    sortDependencies(data);

    const cwd = path.join(process.cwd(), data.inPlace ? "" : data.destDirName);

    if (data.autoInstall) {
      try {
      await installDependencies(cwd, data.autoInstall)
          printMessage(data, green);
      } catch (e) {
          console.log(chalk.red("Error:"), e);
        }
    } else {
      printMessage(data, chalk);
    }
  }