#!/usr/bin/env node

import { program } from 'commander';
import loader from '../index.js';

program
  .version('1.0.0')
  .description('Page loader utility')
  .usage('[options]')
  .option('-o, --output <dir>', 'output dir')
  .action(() => {
    loader(program.args[0], program.opts().output)
      .then(({ filePath }) => {
        console.log(`URL successfully downloaded to ${filePath}`);
      })
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  })
  .parse();
