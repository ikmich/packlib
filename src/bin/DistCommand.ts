import { BaseCmd } from 'cliyargs';
import fs from 'fs-extra';
import Path from 'path';
import { cmd_pack, CONFIG_FILENAME } from './index.js';
import { taskUnit } from '../util/index.js';
import { PackCommand, PackResult } from './PackCommand.js';
import { conprint } from 'cliyargs/dist/utils/index.js';
import { createRequire } from 'module';
import { shell_ } from '@ikmich/utilis';
import { PackageDomain } from 'package-deps-admin/dist/package-domain.js';

const require = createRequire(import.meta.url);

export class DistCommand extends BaseCmd<any> {
  async run(): Promise<void> {
    await super.run();

    const sourceRoot = process.cwd();

    const configFile = Path.join(sourceRoot, CONFIG_FILENAME);
    if (!fs.existsSync(configFile)) {
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
      if (!fs.existsSync(dest)) {
        console.error(new Error(`Path not found: ${dest}`));
        return;
      }

      // dest path must be a folder.
      if (!fs.statSync(dest).isDirectory()) {
        console.error(new Error(`Path is not a directory: ${dest}`));
        return;
      }

      conprint.info(`-> destination: ${dest}`);

      /* Uninstall the existing dependency. */
      await taskUnit({
        desc: `Uninstalling package ${packageName}`,
        async fn() {
          await shell_.exec(`cd ${dest} && npm uninstall ${packageName}`);
        },
        printDesc: true
      });

      const destNodeModulesDir = Path.join(dest, 'node_modules/');
      taskUnit({
        desc: `Copying parcel dir to destination - ${destNodeModulesDir}`,
        fn() {
          fs.ensureDirSync(destNodeModulesDir);

          // <step: copy parcelDir to dest node_modules>
          const copyFrom = parcelDir;
          const copyTo = Path.join(destNodeModulesDir, packageName);
          fs.ensureDirSync(copyTo);
          fs.copySync(copyFrom, copyTo, { recursive: true, overwrite: true });
          // </step>
        },
        printDesc: true
      });

      let destPkgConfig: any;

      taskUnit({
        desc: 'put package entry in destination package.json',
        fn() {
          const destPackageJsonFile = Path.join(dest, 'package.json');
          if (destPackageJsonFile) {
            // // make a copy of the dest package.json file
            // const copyToFile = Path.join(dest, 'copy-package.json');
            // FS.copyFileSync(destPackageJsonFile, copyToFile, FS.constants.COPYFILE_FICLONE);

            destPkgConfig = require(destPackageJsonFile);
            if (!destPkgConfig.dependencies) {
              destPkgConfig.dependencies = {};
            }

            const dependencies: any = Object.keys(destPkgConfig.dependencies);
            if (dependencies.includes(packageName)) {
              const versionValue = destPkgConfig.dependencies[packageName];
              if (versionValue !== packageVersion) {
                destPkgConfig.dependencies[packageName] = packageVersion;
              }
            } else {
              destPkgConfig.dependencies[packageName] = packageVersion;
            }

            // write updated dest package.json file
            fs.writeFileSync(destPackageJsonFile, JSON.stringify(destPkgConfig, null, 2), { encoding: 'utf-8' });
          }
        }
      });

      taskUnit({
        desc: 'Install dependencies of source module in dest module',
        async fn() {
          // install dependencies of this library.
          const sourceDomain = new PackageDomain(packResult.pkgName, sourceRoot);
          const destPackageName = destPkgConfig['name'];
          const destDomain = new PackageDomain(destPackageName, dest);
          await PackageDomain.transitDependencies(sourceDomain, destDomain);
        }
      });
    }
  }
}
