import path from "path"

import chalk from "chalk"
import { handlebars } from "consolidate"
import Handlebars from "handlebars"
import Metalsmith, { Plugin } from "metalsmith"
import multimatch from "multimatch"

import { ask } from "./ask"
import { complete } from "./complete"
import { filter } from "./filter"
import * as logger from "./logger"
import { getOptions, Options } from "./options"

const { render } = handlebars

// register handlebars helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Handlebars.registerHelper("if_eq", function (this: any, a, b, opts) {
  return a === b ? opts.fn(this) : opts.inverse(this)
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
Handlebars.registerHelper("unless_eq", function (this: any, a, b, opts) {
  return a === b ? opts.inverse(this) : opts.fn(this)
})

export function generate(
  name: string,
  src: string,
  dest: string,
  done: (arg0: Error | null) => void
) {
  const opts = getOptions(name, src)
  const metalsmith = Metalsmith(path.join(src, "template"))
  const data = Object.assign(metalsmith.metadata(), {
    destDirName: name,
    inPlace: dest === process.cwd(),
    noEscape: true,
  })
  opts.helpers &&
    Object.keys(opts.helpers).map((key) => {
      Handlebars.registerHelper(key, opts.helpers[key])
    })

  const helpers = { chalk, logger }

  if (opts.metalsmith && typeof opts.metalsmith.before === "function") {
    opts.metalsmith.before(metalsmith, opts, helpers)
  }

  metalsmith
    .use(askQuestions(opts.prompts))
    .use(filterFiles(opts.filters))
    .use(renderTemplateFiles(opts.skipInterpolation))

  if (typeof opts.metalsmith === "function") {
    opts.metalsmith(metalsmith, opts, helpers)
  } else if (opts.metalsmith && typeof opts.metalsmith.after === "function") {
    opts.metalsmith.after(metalsmith, opts, helpers)
  }

  metalsmith
    .clean(false)
    .source(".") // start from template root instead of `./src` which is Metalsmith's default for `source`
    .destination(dest)
    .build((err) => {
      done(err)
      complete(data)
    })

  return data
}

function askQuestions(prompts: Options["prompts"]): Plugin {
  return async (files, metalsmith, done) => {
    await ask(prompts, metalsmith.metadata())
    done(null, files, metalsmith)
  }
}

function filterFiles(filters: Record<string, string>): Plugin {
  return (files, metalsmith, done) => {
    filter(files, filters, metalsmith.metadata())
    done(null, files, metalsmith)
  }
}

function renderTemplateFiles(
  skipInterpolation: Options["skipInterpolation"]
): Plugin {
  skipInterpolation =
    typeof skipInterpolation === "string"
      ? [skipInterpolation]
      : skipInterpolation
  return (files, metalsmith, done) => {
    const keys = Object.keys(files)
    const metalsmithMetadata = metalsmith.metadata()
    // eslint-disable-next-line functional/no-loop-statement
    for (const file in keys) {
      if (
        skipInterpolation &&
        multimatch([file], skipInterpolation, { dot: true }).length
      ) {
        return
      }
      const str = files[file].contents.toString()
      // do not attempt to render files that do not have mustaches
      if (!/{{([^{}]+)}}/g.test(str)) {
        return
      }
      render(str, metalsmithMetadata, (err, res) => {
        if (err) {
          // eslint-disable-next-line functional/immutable-data
          err.message = `[${file}] ${err.message}`
          return
        }
        // eslint-disable-next-line functional/immutable-data
        files[file].contents = Buffer.from(res)
      })
    }

    done(null, files, metalsmith)
  }
}
