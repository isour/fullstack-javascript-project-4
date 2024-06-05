#!/usr/bin/env node

import { program } from "commander";
import loader from "../index.js";
import packageFile from "../package.json" assert { type: "json" };

program
  .version(packageFile.version)
  .description(packageFile.description)
  .usage("[options]")
  .option("-o, --output <dir>", "output dir")
  .action(() => {
    loader(program.args[0], program.opts().output)
    .then(({filePath}) => {
      console.log(`URL successfully downloaded to ${filePath}`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    })
  })
  .parse();
