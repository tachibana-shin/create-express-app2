import fs from "fs"
import path from "path"

import chalk from "chalk"

function sortDependencies(data: {
  readonly inPlace: boolean
  readonly destDirName: string
}): void {
  const packageJsonFile = path.join(
    data.inPlace ? "" : data.destDirName,
    "package.json"
  )
  const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, "utf8"))
  // eslint-disable-next-line functional/immutable-data
  packageJson.devDependencies = sortObject(packageJson.devDependencies)
  // eslint-disable-next-line functional/immutable-data
  packageJson.dependencies = sortObject(packageJson.dependencies)
  fs.writeFileSync(packageJsonFile, JSON.stringify(packageJson, null, 2) + "\n")
}

function printMessage(
  data: {
    readonly inPlace: boolean
    readonly destDirName: string
    readonly autoInstall?: string
  },
  { green, yellow }: typeof chalk
) {
  const message = `
# ${green("Project initialization finished!")}
# ========================

To get started:

  ${yellow(
    `${data.inPlace ? "" : `cd ${data.destDirName}\n  `}
pnpm i (or if using yarn: yarn)
pnpm lint -- --fix (or for yarn: yarn run lint --fix)
pnpm dev`
  )}
  
  
`
  console.log(message)
}

function sortObject(object: Record<string, string>) {
  // Based on https://github.com/yarnpkg/yarn/blob/v1.3.2/src/config.js#L79-L85
  const sortedObject: typeof object = {}
  // eslint-disable-next-line functional/immutable-data
  Object.keys(object)
    .sort()
    .forEach((item) => {
      // eslint-disable-next-line functional/immutable-data
      sortedObject[item] = object[item]
    })

  return sortedObject
}

export async function complete(data: {
  readonly inPlace: boolean
  readonly destDirName: string
}) {
  sortDependencies(data)

  printMessage(data, chalk)
}
