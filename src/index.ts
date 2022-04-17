#!/usr/bin/env node

import { existsSync } from "fs"
import { homedir } from "os"
import path from "path"

import axios from "axios"
import chalk from "chalk"
import { program } from "commander"
import download from "download-git-repo"
import inquirer from "inquirer"
import ora from "ora"
import { sync as rm } from "rimraf"
import tildify from "tildify"

import { version } from "../package.json"

import { generate } from "./helpers/generate"
import { fatal, success } from "./helpers/logger"
import { getTemplatePath, isLocalPath } from "./utils/local-path"

program

  .option("-c, --clone", "use git clone")
  .option("--offline", "use cached template")
  .version(version)

program.parse(process.argv)

// eslint-disable-next-line functional/no-let
let template = program.args?.[0]
void main()

async function main() {
  if (!template) {
    const spinner = ora("getting list templates from github...")
    spinner.start()

    try {
      const { data } = await axios.get<
        readonly {
          readonly name: string
          readonly description: string
        }[]
      >("https://api.github.com/users/express-templates/repos", {
        headers: {
          "User-Agent": "shin-templates",
        },
      })

      spinner.stop()

      const listTemplates = data.map((repo) => {
        return {
          name:
            "  " +
            chalk.yellow("★") +
            "  " +
            chalk.blue(repo.name) +
            " - " +
            (repo.description || ""),
          value: repo.name,
        }
      })

      template = await inquirer
        .prompt([
          {
            type: "list",
            name: "tpl",
            message: "Select template to start project:",
            choices: listTemplates,
            prefix: "express-templates/",
          },
        ])
        .then(({ tpl }) => tpl)

      init()
    } catch (err) {
      fatal(err)
    }
  } else {
    init()
  }
}

async function init() {
  const hasSlash = template?.indexOf("/") > -1
  const rawName =
    program.args[1] ??
    (await inquirer
      .prompt([
        {
          type: "string",
          name: "rawName",
          validate(val) {
            return !!val
          },
          message:
            "Folder name containing the project (create if don't exists):",
        },
      ])
      .then(({ rawName }) => rawName))

  const inPlace = !rawName || rawName === "."
  const name = inPlace ? process.cwd() : rawName
  const to = path.resolve(rawName || ".")
  const clone = program.opts().clone ?? false

  const tmp = path.join(
    homedir(),
    ".cache",
    ".express-templates",
    template.replace(/[\\/:]/g, "-")
  )
  if (program.opts().offline) {
    console.log(`> Use cached template at ${chalk.yellow(tildify(tmp))}`)
    template = tmp
  }

  console.log()
  process.on("exit", () => {
    console.log()
  })

  if (inPlace || existsSync(to)) {
    inquirer
      .prompt([
        {
          type: "confirm",
          message: inPlace
            ? "Generate project in current directory?"
            : "Target directory exists. Continue?",
          name: "ok",
        },
      ])
      .then((answers) => {
        if (answers.ok) {
          run()
        }
      })
      .catch(fatal)
  } else {
    run()
  }

  function run() {
    // check if template is local
    if (isLocalPath(template)) {
      const templatePath = getTemplatePath(template)
      if (existsSync(templatePath)) {
        generate(name, templatePath, to, (err) => {
          if (err) fatal(err)
          console.log()
          success("Generated \"%s\".", name)
        })
      } else {
        fatal("Local template \"%s\" not found.", template)
      }
    } else {
      if (!hasSlash) {
        // use official templates
        const officialTemplate = "express-templates/" + template
        if (template.indexOf("#") !== -1) {
          downloadAndGenerate(officialTemplate)
        } else {
          if (template.indexOf("-2.0") !== -1) {
            return
          }

          // warnings.v2BranchIsNowDefault(template, inPlace ? '' : name)
          downloadAndGenerate(officialTemplate)
        }
      } else {
        downloadAndGenerate(template)
      }
    }
  }

  function downloadAndGenerate(template: string) {
    const spinner = ora("downloading template")
    spinner.start()
    // Remove if local template exists
    if (existsSync(tmp)) rm(tmp)
    download(template, tmp, { clone }, (err) => {
      spinner.stop()
      if (err)
        fatal("Failed to download repo " + template + ": " + err.message.trim())
      generate(name, tmp, to, (err) => {
        if (err) fatal(err)
        console.log()
        success("Generated \"%s\".", name)
      })
    })
  }
}
