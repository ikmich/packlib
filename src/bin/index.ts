#!/usr/bin/env node

import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { InitCommand } from './InitCommand.js';
import { DistCommand } from './DistCommand.js';
import { PackCommand } from './PackCommand.js';
import { UnlinkDistCommand } from './UnlinkDistCommand.js';
import { Command } from 'commander';

/* ================================================================================================================== */

export const CONFIG_FILENAME = 'packlib-config.cjs';

export const cmd_init = 'init';
export const cmd_pack = 'pack';
export const cmd_dist = 'dist';
export const cmd_unlink_dist = 'unlink-dist';

/* ================================================================================================================== */

const program = new Command();

program.description('Pack and distribute npm library for local development');

program
  .command(cmd_init)
  .description(`Generate ${CONFIG_FILENAME}`)
  .action(async () => {
    await new InitCommand(program).run();
  });

program
  .command(cmd_pack)
  .description('Pack the library module into a folder')
  .action(async () => {
    await new PackCommand(program).run();
  });

program
  .command(cmd_dist)
  .description(`Distribute the module to destination projects specified in ${CONFIG_FILENAME}`)
  .action(async () => {
    await new DistCommand(program).run();
  });

program
  .command(cmd_unlink_dist)
  .description(`Remove the module from the destination projects specified in ${CONFIG_FILENAME}`)
  .action(async () => {
    await new UnlinkDistCommand(program).run();
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
