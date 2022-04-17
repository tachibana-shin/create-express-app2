import path from "path";

import chalk from "chalk";
import {handlebars} from "consolidate"
import Handlebars from "handlebars";
import Metalsmith from "metalsmith";
import multimatch from "multimatch";

import {ask} from "./ask";
import {complete} from "./complete";
import {filter} from "./filter";
import {getOptions, Options} from "./options";


const { render } = handlebars;

// register handlebars helper
Handlebars.registerHelper("if_eq", function (a, b, opts) {
  return a === b ? opts.fn(this) : opts.inverse(this);
});

Handlebars.registerHelper("unless_eq", function (a, b, opts) {
  return a === b ? opts.inverse(this) : opts.fn(this);
});


module.exports = function generate(name: string, src: string, dest: string, done: (arg0: Error | null) => void) {
  const opts = getOptions(name, src);
  const metalsmith = Metalsmith(path.join(src, "template"));
  const data = Object.assign(metalsmith.metadata(), {
    destDirName: name,
    inPlace: dest === process.cwd(),
    noEscape: true,
  });
  opts.helpers &&
    Object.keys(opts.helpers).map((key) => {
      Handlebars.registerHelper(key, opts.helpers[key]);
    });

  const helpers = { chalk, logger };

  if (opts.metalsmith && typeof opts.metalsmith.before === "function") {
    opts.metalsmith.before(metalsmith, opts, helpers);
  }

  metalsmith
    .use(askQuestions(opts.prompts))
    .use(filterFiles(opts.filters))
    .use(renderTemplateFiles(opts.skipInterpolation));

  if (typeof opts.metalsmith === "function") {
    opts.metalsmith(metalsmith, opts, helpers);
  } else if (opts.metalsmith && typeof opts.metalsmith.after === "function") {
    opts.metalsmith.after(metalsmith, opts, helpers);
  }

  metalsmith
    .clean(false)
    .source(".") // start from template root instead of `./src` which is Metalsmith's default for `source`
    .destination(dest)
    .build((err, files) => {
      done(err);
      const helpers = { chalk, logger, files };
      complete(data, helpers);
    });

  return data;
};


function askQuestions(prompts: Options["prompts"]) {
  return (files: any, metalsmith: { metadata: () => any; }, done: any) => {
    ask(prompts, metalsmith.metadata(), done);
  };
}

function filterFiles(filters: Record<string, string>) {
  return (files: Record<string, string>, metalsmith: { metadata: () => any; }, done: any) => {
    filter(files, filters, metalsmith.metadata(), done);
  };
}

function renderTemplateFiles(skipInterpolation: Options["skipInterpolation"]) {
  skipInterpolation =
    typeof skipInterpolation === "string"
      ? [skipInterpolation]
      : skipInterpolation;
  return (files: { [x: string]: { contents: Buffer; }; }, metalsmith: { metadata: () => any; }, done: any) => {
    const keys = Object.keys(files);
    const metalsmithMetadata = metalsmith.metadata();
    // eslint-disable-next-line functional/no-loop-statement
    for (const file in keys) {

        if (
          skipInterpolation &&
          multimatch([file], skipInterpolation, { dot: true }).length
        ) {
          return
        }
        const str = files[file].contents.toString();
        // do not attempt to render files that do not have mustaches
        if (!/{{([^{}]+)}}/g.test(str)) {
          return
        }
        render(str, metalsmithMetadata, (err, res) => {
          if (err) {
            err.message = `[${file}] ${err.message}`;
            return
          }
          files[file].contents = new Buffer(res);
        });
      }
    
  };
}                                                                                                                                                                                                                                                                                  
