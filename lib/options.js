const path = require("path");
const metadata = require("read-metadata");
const exists = require("fs").existsSync;
const getGitUser = require("./git-user");
const validateName = require("validate-npm-package-name");

/**
 * Read prompts metadata.
 *
 * @param {String} dir
 * @return {Object}
 */

module.exports = function options(name, dir) {
  const opts = getMetadata(dir);

  setDefault(opts, "name", name);
  if ("DB_DATABASE" in opts) {
    setDefault(opts, "DB_DATABASE", name);
  }

  setValidateName(opts);

  const author = getGitUser();
  if (author) {
    setDefault(opts, "author", author);
  }
  
  addHelpers(opts);

  return opts;
};

function addHelpers(opts) {
  opts.helpers = {
    if_or(v1, v2, options) {
      if (v1 || v2) {
        return options.fn(this);
      }

      return options.inverse(this);
    },
    if_not(v1, options) {
      if (!v1) {
        return options.fn(this);
      }

      return options.inverse(this);
    },
    exists(value, options) {
      if (value) {
        return options.fn(this);
      }

      return options.inverse(this);
    },
    if_xor(v1, v2, v3, options) {
      if (v1 || v2 === v3) {
        return options.fn(this);
      }

      return options.inverse(this);
    },
    if_ne(v1, v2, options) {
      if (v1 !== v2) {
        return options.fn(this);
      }

      return options.inverse(this);
    },
    if_in(v1, v2, options) {
      if (v2 in v1) {
        return options.fn(this);
      }

      return options.inverse(this);
    },
    template_version() {
      return getTemplateVersion(dir);
    },
    ...opts.helpers || {}
  }
}

/**
 * Gets the metadata from either a meta.json or meta.js file.
 *
 * @param  {String} dir
 * @return {Object}
 */
 
function getTemplateVersion(dir) {
  const pkg = path.join(dir, "package.json");
  
  if (exists(pkg)) {
    return require(path.resolve(pkg)).version;
  }
  
  return "0.0.1"
}

function getMetadata(dir) {
  const json = path.join(dir, "meta.json");
  const js = path.join(dir, "meta.js");
  let opts = {};

  if (exists(json)) {
    opts = metadata.sync(json);
  } else if (exists(js)) {
    const req = require(path.resolve(js));
    if (req !== Object(req)) {
      throw new Error("meta.js needs to expose an object");
    }
    opts = req;
  }

  return opts;
}

/**
 * Set the default value for a prompt question
 *
 * @param {Object} opts
 * @param {String} key
 * @param {String} val
 */

function setDefault(opts, key, val) {
  if (opts.schema) {
    opts.prompts = opts.schema;
    delete opts.schema;
  }
  const prompts = opts.prompts || (opts.prompts = {});
  if (!prompts[key] || typeof prompts[key] !== "object") {
    prompts[key] = {
      type: "string",
      default: val,
    };
  } else {
    prompts[key]["default"] = val;
  }
}

function setValidateName(opts) {
  const name = opts.prompts.name;
  const customValidate = name.validate;
  name.validate = (name) => {
    const its = validateName(name);
    if (!its.validForNewPackages) {
      const errors = (its.errors || []).concat(its.warnings || []);
      return "Sorry, " + errors.join(" and ") + ".";
    }
    if (typeof customValidate === "function") return customValidate(name);
    return true;
  };
}
