import Path from 'path';
import FS from 'fs-extra';
import { runShellCmd } from './index.js';
import { _fn, addToGitIgnore } from '../util/index.js';
import npmPackList from 'npm-packlist';
import { createRequire } from 'module';
import { BaseCommand } from './base.command.js';
import { logInfo } from '../util/log.util.js';

const require = createRequire(import.meta.url);

export interface PackResult {
  pkgName: string;
  pkgVersion: string;
  packDirPath: string;
}

export class PackCommand extends BaseCommand {
  async run() {
    await super.run();
    await PackCommand.pack();
  }

  static async pack(): Promise<PackResult> {
    const sourceRoot = process.cwd();

    /* read package.json in source dir */
    const sourcePkgJsonFile = Path.join(sourceRoot, 'package.json');
    if (!FS.existsSync(sourcePkgJsonFile)) {
      throw new Error('package.json not found');
    }
    const packageObj = require(sourcePkgJsonFile);
    const packageName = packageObj.name;
    const packageVersion = packageObj.version;
    const parcelName = `packlib--${packageName}-${packageVersion}`;
    const packDir = Path.join(sourceRoot, parcelName);

    // build the library with 'npm run build'
    await runShellCmd('npm run build').promise;

    // <step: package the lib parcel>
    logInfo('Packaging the module...');

    const parcelFiles = await npmPackList({
      path: sourceRoot
    });

    FS.ensureDirSync(packDir);

    for (let file of parcelFiles) {
      const sourceFile = Path.join(sourceRoot, file);
      const destFile = Path.join(packDir, file);

      // The destination folder must exist or the operation will fail.
      const destFileParent = Path.dirname(destFile);
      FS.ensureDirSync(destFileParent);

      FS.copyFileSync(sourceFile, destFile, FS.constants.COPYFILE_FICLONE);
    }
    // </step>

    addToGitIgnore({
      entry: parcelName,
      gitignoreFile: _fn(() => {
        const sourceGitignoreFile = Path.join(process.cwd(), '.gitignore');
        FS.ensureFileSync(sourceGitignoreFile);
        return sourceGitignoreFile;
      })
    });

    return {
      pkgName: packageName,
      pkgVersion: packageVersion,
      packDirPath: packDir
    };
  }
}
