#!/usr/bin/env node

import { program } from "commander";
import { createRequire } from "module";
import loader from "../index.js";

const require = createRequire(import.meta.url);
const packageFile = require("../package.json");

program
  .version(packageFile.version)
  .description(packageFile.description)
  .usage("[options]")
  .option(
    "-o, --output <dir>",
    'output dir (default: "/home/user/current-dir")'
  )
  .action(() => {
    console.log(loader(program.args[0], program.opts().output));
  })
  .parse();
