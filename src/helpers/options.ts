/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable functional/no-let */
import { existsSync } from "fs"
import path from "path"

import chalk from "chalk"
import Metalsmith from "metalsmith"
import metadata from "read-metadata"
import validateName from "validate-npm-package-name"

import { gitUser } from "../utils/git-user"
import { gitUserName } from "../utils/git-user-name"

import * as logger from "./logger"

type CallbackMetalsmith = (
  metalsmith: Metalsmith,
  options: Options,
  helpers: {
    readonly chalk: typeof chalk
    readonly logger: typeof logger
  }
) => void

export type Options = {
  // eslint-disable-next-line functional/prefer-readonly-type
  helpers?: Record<string, (...args: any) => any>

  // eslint-disable-next-line functional/prefer-readonly-type
  metalsmith?:
    | CallbackMetalsmith
    | {
        // eslint-disable-next-line functional/prefer-readonly-type
        before?: CallbackMetalsmith
        // eslint-disable-next-line functional/prefer-readonly-type
        after?: CallbackMetalsmith
      }
  // eslint-disable-next-line functional/prefer-readonly-type
  prompts: Record<
    string,
    {
      readonly type?: string
      readonly message?: string
      readonly choices?: readonly any[]
      readonly validate?: () => boolean
      // eslint-disable-next-line functional/prefer-readonly-type
      default?: any
    }
  >
  // eslint-disable-next-line functional/prefer-readonly-type
  filters?: Record<string, string>
  // eslint-disable-next-line functional/prefer-readonly-type
  skipInterpolation?: string | readonly string[]
}
export function getOptions(name: string, dir: string): any {
  const opts = getMetadata(dir)

  setDefault(opts, "name", name)
  setDefault(opts, "gitUserName", gitUserName())
  if ("DB_DATABASE" in opts) {
    setDefault(opts, "DB_DATABASE", name)
  }

  setValidateName(opts)

  const author = gitUser()
  if (author) {
    setDefault(opts, "author", author)
  }

  addHelpers(opts)

  return opts
}

function addHelpers(opts: Options) {
  // eslint-disable-next-line functional/immutable-data
  opts.helpers = {
    if_or(v1, v2, options) {
      if (v1 || v2) {
        return options.fn(this)
      }

      return options.inverse(this)
    },
    if_not(v1, options) {
      if (!v1) {
        return options.fn(this)
      }

      return options.inverse(this)
    },
    exists(value, options) {
      if (value) {
        return options.fn(this)
      }

      return options.inverse(this)
    },
    if_xor(v1, v2, v3, options) {
      if (v1 || v2 === v3) {
        return options.fn(this)
      }

      return options.inverse(this)
    },
    if_ne(v1, v2, options) {
      if (v1 !== v2) {
        return options.fn(this)
      }

      return options.inverse(this)
    },
    if_in(v1, v2, options) {
      if (v2 in v1) {
        return options.fn(this)
      }

      return options.inverse(this)
    },
    // eslint-disable-next-line functional/functional-parameters
    if_includes(v1, ...args) {
      const array = args.slice(0, args.length - 1)
      const options = args[args.length - 1]

      if (array.includes(v1)) {
        return options.fn(this)
      }

      return options.inverse(this)
    },
    ...(opts.helpers || {}),
  }
}

function getMetadata(dir: string) {
  const json = path.join(dir, "meta.json")
  const js = path.join(dir, "meta.js")
  let opts: any = {}

  if (existsSync(json)) {
    opts = metadata.sync(json)
  } else if (existsSync(js)) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const req = require(path.resolve(js))
    if (req !== Object(req)) {
      // eslint-disable-next-line functional/no-throw-statement
      throw new Error("meta.js needs to expose an object")
    }
    opts = req
  }

  return opts
}

function setDefault(opts: Options, key: string, val: string) {
  // eslint-disable-next-line functional/immutable-data
  const prompts = opts.prompts || (opts.prompts = {})
  if (!prompts[key] || typeof prompts[key] !== "object") {
    // eslint-disable-next-line functional/immutable-data
    prompts[key] = {
      type: "string",
      default: val,
    }
  } else {
    // eslint-disable-next-line functional/immutable-data
    prompts[key]["default"] = val
  }
}

function setValidateName(opts: { readonly prompts: { readonly name: any } }) {
  const name = opts.prompts.name
  const customValidate = name.validate
  // eslint-disable-next-line functional/immutable-data
  name.validate = (name: string) => {
    const its = validateName(name)
    if (!its.validForNewPackages) {
      const errors = (its.errors || []).concat(its.warnings || [])
      return "Sorry, " + errors.join(" and ") + "."
    }
    if (typeof customValidate === "function") return customValidate(name)
    return true
  }
}
