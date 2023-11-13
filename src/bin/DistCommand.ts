import { BaseCmd } from 'cliyargs';
import FS from 'fs-extra';
import Path from 'path';
import { cmd_pack, CONFIG_FILENAME } from './index.js';
import { taskUnit } from '../util/index.js';
import { PackCommand, PackResult } from './PackCommand.js';
import { conprint } from 'cliyargs/dist/utils/index.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export class DistCommand extends BaseCmd<any> {
  async run(): Promise<void> {
    await super.run();

    const sourceRoot = process.cwd();

    const configFile = Path.join(sourceRoot, CONFIG_FILENAME);
    if (!FS.existsSync(configFile)) {
      throw new Error(`${CONFIG_FILENAME} not found.`);
    }

    const config = require(configFile);

    const destinationList = config.destinations;

    // Pack the library
    const packResult: PackResult = await new PackCommand({
      name: cmd_pack,
      args: [],
      options: {}
    }).pack();

    const parcelDir = packResult.packDirPath;
    const packageName = packResult.pkgName;
    const packageVersion = packResult.pkgVersion;

    for (let dest of destinationList) {
      // dest path must exist.
      if (!FS.existsSync(dest)) {
        console.error(new Error(`Path not found: ${dest}`));
        return;
      }

      // dest path must be a folder.
      if (!FS.statSync(dest).isDirectory()) {
        console.error(new Error(`Path is not a directory: ${dest}`));
        return;
      }

      conprint.info(`-> destination: ${dest}`);

      taskUnit({
        desc: 'Copy parcel dir to dest node_modules/',
        fn() {
          const destNodeModulesDir = Path.join(dest, 'node_modules/');
          FS.ensureDirSync(destNodeModulesDir);

          // <step: copy parcelDir to dest node_modules>
          const copyFrom = parcelDir;
          const copyTo = Path.join(destNodeModulesDir, packageName);
          FS.ensureDirSync(copyTo);
          FS.copySync(copyFrom, copyTo, { recursive: true, overwrite: true });
          // </step>
        }
      });

      taskUnit({
        desc: 'put package entry in dest package.json',
        fn() {
          const destPackageJsonFile = Path.join(dest, 'package.json');
          if (destPackageJsonFile) {
            // // make a copy of the dest package.json file
            // const copyToFile = Path.join(dest, 'copy-package.json');
            // FS.copyFileSync(destPackageJsonFile, copyToFile, FS.constants.COPYFILE_FICLONE);

            const destPkgJsob = require(destPackageJsonFile);
            if (!destPkgJsob.dependencies) {
              destPkgJsob.dependencies = {};
            }
            const dependencies: any = Object.keys(destPkgJsob.dependencies);
            if (dependencies.includes(packageName)) {
              const versionValue = destPkgJsob.dependencies[packageName];
              if (versionValue !== packageVersion) {
                destPkgJsob.dependencies[packageName] = packageVersion;
              }
            } else {
              destPkgJsob.dependencies[packageName] = packageVersion;
            }

            // write updated dest package.json file
            FS.writeFileSync(destPackageJsonFile, JSON.stringify(destPkgJsob, null, 2), { encoding: 'utf-8' });
          }
        }
      });
    }
  }
}
