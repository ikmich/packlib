#!/usr/bin/env node

import { cliyargs, IClyCommandInfo, IClyCommandOpts } from 'cliyargs';
import { CreateConfigCommand } from './commands/CreateConfigCommand';
import { DeployCommand } from './commands/DeployCommand';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';

/* ================================================================================================================== */
/* ================================================================================================================== */
/* ================================================================================================================== */

export const CONFIG_FILENAME = 'packlib-config.js';

/* ================================================================================================================== */
/* ================================================================================================================== */
/* ================================================================================================================== */

const argv = cliyargs.yargs
  .command('config', `Generate ${CONFIG_FILENAME}`)
  .command('deploy', 'Pack tarball and copy to destinations specified in packlib-config.js')
  .help().argv;

const commandInfo: IClyCommandInfo<IClyCommandOpts> = cliyargs.parseYargv(argv);

export interface IOptions extends IClyCommandOpts {}

cliyargs.processCommand(commandInfo, async (commandName) => {
  // Get the command arguments
  const args = commandInfo.args;

  // Get the command options (flags/switches)
  const options = commandInfo.options;

  switch (commandName) {
    case 'config':
      await new CreateConfigCommand(commandInfo).run();
      break;
    case 'deploy':
      await new DeployCommand(commandInfo).run();
      break;
  }
});

/* ================================================================================================================== */
/* ================================================================================================================== */
/* ================================================================================================================== */

export interface ShellExecOptions extends SpawnOptionsWithoutStdio {}

export type TRunShellCommandResult = {
  childProcess: any;
  promise: Promise<any>;
};

export function runShellCmd(command: string, options?: ShellExecOptions): TRunShellCommandResult {
  if (!command || !command.trim()) command = 'echo "Nothing"';
  if (!options) options = {};
  if (!options.cwd) options.cwd = process.cwd();

  let opts: SpawnOptionsWithoutStdio = { ...options, shell: true };

  const parts = command.split(/\s+/);
  const main = parts[0];
  const args = parts.filter((item, i) => {
    return i > 0;
  });

  let childProcess = spawn(main, args, opts);

  return {
    childProcess,
    promise: new Promise((resolve, reject) => {
      childProcess.stdout.on('data', (chunk: Buffer) => {
        console.log(chunk.toString('utf-8').replace(/\n$/, ''));
      });
      childProcess.stderr.on('data', (err: Buffer) => {
        console.log(err.toString('utf-8').replace(/\n$/, ''));
      });
      childProcess.on('close', (code: number, signal: NodeJS.Signals) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Exited with code ${code}`));
        }
      });
      childProcess.on('error', (err: Error) => {
        console.error(err);
      });
    })
  };
}
