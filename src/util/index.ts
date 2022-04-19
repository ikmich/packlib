import { conprint } from 'cliyargs/lib/utils';

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
