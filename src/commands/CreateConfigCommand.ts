import { ClyBaseCommand } from 'cliyargs';
import FS from 'fs-extra';
import Path from 'path';
import { CONFIG_FILENAME } from '../index';

export class CreateConfigCommand extends ClyBaseCommand<any> {
  async run(): Promise<void> {
    await super.run();

    const data = `module.exports = {
    destinations: []
}
`;
    const file = Path.join(process.cwd(), CONFIG_FILENAME);
    if (FS.existsSync(file)) {
      console.log(`${CONFIG_FILENAME} already exists in this location`);
      return;
    }

    // create the file and write default contents
    FS.writeFileSync(file, data, { encoding: 'utf-8' });
  }
}
