#!/usr/bin/env node

import { BaseCmdOpts, cliyargs, CmdInfo } from 'cliyargs';
import { InitCommand } from './InitCommand.js';
import { DistCommand } from './DistCommand.js';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { PackCommand } from './PackCommand.js';

/* ================================================================================================================== */

export const CONFIG_FILENAME = 'packlib-config.cjs';

export const cmd_init = 'init';
export const cmd_pack = 'pack';
export const cmd_dist = 'dist';

/* ================================================================================================================== */

const argv = cliyargs.yargs
  .command(cmd_init, `Generate ${CONFIG_FILENAME}`)
  .command(cmd_pack, 'Pack the library module into a folder')
  .command(cmd_dist, 'Distribute the module to destination projects specified in packlib-config.js')
  .alias({
    'ls': cmd_init
  })
  .help().argv;

const commandInfo: CmdInfo<BaseCmdOpts> = cliyargs.getCommandInfo(argv);

export interface IOptions extends BaseCmdOpts {
}

cliyargs.processCommand(commandInfo, async (commandName) => {
  switch (commandName) {
    case cmd_init:
      await new InitCommand(commandInfo).run();
      break;

    case cmd_dist:
      await new DistCommand(commandInfo).run();
      break;

    case cmd_pack:
    default:
      await new PackCommand(commandInfo).run();
  }
});

/* ================================================================================================================== */

export interface ShellExecOptions extends SpawnOptionsWithoutStdio {
}

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
