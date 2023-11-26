import FS from 'fs-extra';
import Path from 'path';
import { CONFIG_FILENAME } from './index.js';
import { _fn, addToGitIgnore } from '../util/index.js';
import { BaseCommand } from './base.command.js';

export class InitCommand extends BaseCommand {
  async run(): Promise<void> {
    await super.run();

    const data = `module.exports = {
    destinations: []
}
`;
    const configFile = Path.join(process.cwd(), CONFIG_FILENAME);
    if (FS.existsSync(configFile)) {
      console.log(`${CONFIG_FILENAME} already exists in this location`);
      return;
    }

    // create the file and write default contents
    FS.writeFileSync(configFile, data, { encoding: 'utf-8' });

    // update source lib gitignore file
    addToGitIgnore({
      entry: Path.basename(configFile),
      gitignoreFile: _fn(() => {
        const file = Path.join(process.cwd(), '.gitignore');
        FS.ensureFileSync(file);
        return file;
      })
    });
  }
}
