import { BaseCmd } from 'cliyargs';
import Path from 'path';
import { CONFIG_FILENAME } from './index.js';
import fs from 'fs-extra';
import { PackageDomain } from 'package-deps-admin/dist/package-domain.js';
import { createRequire } from 'module';
import { taskUnit } from '../util/index.js';
import { shell_ } from '@ikmich/utilis';

const require = createRequire(import.meta.url);

export class UnlinkDistCommand extends BaseCmd<any> {
  async run() {
    await super.run();

    const sourceRoot = process.cwd();
    const sourcePkgJsonFile = Path.join(sourceRoot, 'package.json');
    if (!fs.existsSync(sourcePkgJsonFile)) {
      throw new Error('package.json not found');
    }
    const packageObj = require(sourcePkgJsonFile);
    const packageName = packageObj.name;
    const packageVersion = packageObj.version;

    const configFile = Path.join(sourceRoot, CONFIG_FILENAME);
    if (!fs.existsSync(configFile)) {
      throw new Error(`${CONFIG_FILENAME} not found.`);
    }

    const config = require(configFile);

    const sourceDomain = new PackageDomain(packageName, sourceRoot);

    const destinationList: string[] = config.destinations;
    for (let dest of destinationList) {
      /* Uninstall the existing dependency. */
      await taskUnit({
        desc: `Uninstalling package ${packageName}`,
        async fn() {
          await shell_.exec(`cd ${dest} && npm uninstall ${packageName}`);
        },
        printDesc: true
      });

      const destPackageJsonFile = Path.join(dest, 'package.json');
      let destPkgConfig: any;
      if (destPackageJsonFile) {
        destPkgConfig = require(destPackageJsonFile);
      }

      if (destPkgConfig) {
        const destPackageName = destPkgConfig['name'];
        const destDomain = new PackageDomain(destPackageName, dest);

        await PackageDomain.removeTransitDependencies(sourceDomain, destDomain);
      }

    }
  }
}