#!/usr/bin/env node

import { program } from "commander";
import { loader } from "../index.js";
import packageFile from "../package.json" assert { type: "json" };

program
  .version(packageFile.version)
  .description(packageFile.description)
  .usage("[options]")
  .option("-o, --output <dir>", "output dir")
  .action(() => {
    loader(program.args[0], program.opts().output);
  })
  .parse();
