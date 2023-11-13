import { conprint } from 'cliyargs/dist/utils/index.js';
import fs from 'fs-extra';

export function _fn(fn: () => any) {
  return fn();
}

export interface TaskUnit<T> {
  desc?: string;
  fn: () => T | any;
  suppress?: boolean;
  printDesc?: boolean;
}

export function taskUnit<T>(task: TaskUnit<T>) {
  const { desc, fn, suppress = false, printDesc = false } = task;

  if (suppress) {
    conprint.notice('<suppressed task>');
    return;
  }

  if (desc && printDesc) {
    conprint.info(`${desc}`);
  }
  return fn();
}

/*====================================================================================================================*/

type Params_AddToGitignore = {
  entry: string;
  regex?: RegExp;
  gitignoreFile: string;
};

export function addToGitIgnore(params: Params_AddToGitignore) {
  const { regex, gitignoreFile, entry } = params;
  fs.ensureFileSync(gitignoreFile);

  const entryRegex = regex ?? new RegExp(`^(\n)?${entry}\\s*$`, 'm');

  const destGitignoreContents = fs.readFileSync(gitignoreFile, { encoding: 'utf-8' })
    .replace(entryRegex, '')
    .concat(`\n${entry}`);
  fs.writeFileSync(gitignoreFile, destGitignoreContents, { encoding: 'utf-8' });
}
