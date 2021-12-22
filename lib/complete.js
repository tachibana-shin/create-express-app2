const path = require("path");
const fs = require("fs");
const spawn = require("child_process").spawn;

const lintStyles = ["standard", "airbnb"];

function sortDependencies(data) {
  const packageJsonFile = path.join(
    data.inPlace ? "" : data.destDirName,
    "package.json"
  );
  const packageJson = JSON.parse(fs.readFileSync(packageJsonFile));
  packageJson.devDependencies = sortObject(packageJson.devDependencies);
  packageJson.dependencies = sortObject(packageJson.dependencies);
  fs.writeFileSync(
    packageJsonFile,
    JSON.stringify(packageJson, null, 2) + "\n"
  );
};

function installDependencies(
  cwd,
  executable = "npm",
  color
) {
  console.log(`\n\n# ${color("Installing project dependencies ...")}`);
  console.log("# ========================\n");
  return runCommand(executable, ["install"], {
    cwd,
  });
};

function printMessage(data, { green, yellow }) {
  const message = `
# ${green("Project initialization finished!")}
# ========================

To get started:

  ${yellow(
    `${data.inPlace ? "" : `cd ${data.destDirName}\n  `}${installMsg(
      data
    )}${lintMsg(data)}npm run dev`
  )}
  
`;
  console.log(message);
};

function lintMsg(data) {
  return !data.autoInstall &&
    data.lint &&
    lintStyles.indexOf(data.lintConfig) !== -1
    ? "npm run lint -- --fix (or for yarn: yarn run lint --fix)\n  "
    : "";
}

function installMsg(data) {
  return !data.autoInstall ? "npm install (or if using yarn: yarn)\n  " : "";
}

function runCommand(cmd, args, options) {
  return new Promise((resolve, reject) => {
    const spwan = spawn(
      cmd,
      args,
      Object.assign(
        {
          cwd: process.cwd(),
          stdio: "inherit",
          shell: true,
        },
        options
      )
    );

    spwan.on("exit", () => {
      resolve();
    });
  });
}

function sortObject(object) {
  // Based on https://github.com/yarnpkg/yarn/blob/v1.3.2/src/config.js#L79-L85
  const sortedObject = {};
  Object.keys(object)
    .sort()
    .forEach((item) => {
      sortedObject[item] = object[item];
    });
  return sortedObject;
}

module.exports = function complete(data, { chalk }) {
    const green = chalk.green;

    sortDependencies(data, green);

    const cwd = path.join(process.cwd(), data.inPlace ? "" : data.destDirName);

    if (data.autoInstall) {
      installDependencies(cwd, data.autoInstall, green)
        .then(() => {
          printMessage(data, green);
        })
        .catch((e) => {
          console.log(chalk.red("Error:"), e);
        });
    } else {
      printMessage(data, chalk);
    }
  },
