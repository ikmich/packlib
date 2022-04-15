import { ClyBaseCommand } from 'cliyargs';
import FS from 'fs-extra';
import Path from 'path';
import { CONFIG_FILENAME, runShellCmd } from '../index';

export class DeployCommand extends ClyBaseCommand<any> {
  async run(): Promise<void> {
    await super.run();

    const configFile = Path.join(process.cwd(), CONFIG_FILENAME);
    if (!FS.existsSync(configFile)) {
      throw new Error(`${CONFIG_FILENAME} not found.`);
    }

    const config = require(configFile);

    /* read package.json in host dir */
    const hostPackageJsonFile = Path.join(process.cwd(), 'package.json');
    if (!FS.existsSync(hostPackageJsonFile)) {
      throw new Error('package.json not found');
    }
    const pkg = require(hostPackageJsonFile);

    let tarFileName = `${pkg.name}-${pkg.version}.tgz`;
    const tarFileSource = Path.join(process.cwd(), tarFileName);

    // build the library with 'npm run build'
    await runShellCmd('npm run build').promise;

    // pack lib with 'npm pack'
    await runShellCmd('npm pack').promise;

    for (let dest of config.destinations) {
      // dest path must exist.
      if (!FS.existsSync(dest)) {
        throw new Error(`Path not found: ${dest}`);
      }

      // dest path must be a directory.
      if (!FS.statSync(dest).isDirectory()) {
        throw new Error(`Path is not a directory: ${dest}`);
      }

      console.log('Destination:', dest);

      const tarFileInDest = Path.join(dest, tarFileName);

      // remove tarball in dest
      await runShellCmd(`rm ${tarFileInDest}`).promise;

      // copy tarball to dest
      await runShellCmd(`cp ${tarFileSource} ${dest}`).promise;

      // open perms for tarball in dest
      await runShellCmd(`chmod 777 ${tarFileInDest}`).promise;

      // uninstall lib from dest
      await runShellCmd(`npm uninstall ${pkg.name}`, { cwd: dest }).promise;

      // install tar file in dest
      await runShellCmd(`npm install ${tarFileInDest}`, { cwd: dest }).promise;

      // // add tarball file to .gitignore in dest
      // const gitignoreFile = Path.join(dest, '.gitignore');
      // if (FS.existsSync(gitignoreFile)) {
      //   const contents = FS.readFileSync(gitignoreFile, { encoding: 'utf-8' }) + `\n${tarFileName}`;
      //   FS.writeFileSync(gitignoreFile, contents, { encoding: 'utf-8' });
      // }
    }
  }
}
