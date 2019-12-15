import * as yargs from 'yargs';
import * as chalk from 'chalk';
import * as figlet from 'figlet';
import * as ora from 'ora';

import { PackageInfo } from './package-info';
import { Toolkit } from './toolkit';

const NAME = 'cdk-build-tools';

// eslint-disable-next-line no-console
console.log(chalk.blue(figlet.textSync(NAME)), '\n');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json');

const main = async (): Promise<void> => {
    const { argv } = yargs
        .version(version)
        .scriptName(NAME)
        .help('help')
        .command('build', 'Build a package', (cargv: yargs.Argv) =>
            cargv.option('only-lambdas', {
                type: 'boolean',
                desc: 'Only build and bundle lambdas',
            }),
        )
        .command('watch', ' Start compiler in watch mode')
        .command('test', ' Start test');

    const packageInfo = await PackageInfo.createInstance();

    const toolkit = new Toolkit(packageInfo);

    const command = argv._[0];

    switch (command) {
        case 'build': {
            console.log(
                `Building ${chalk.bold.green(
                    packageInfo.name,
                )} version ${chalk.bold.green(packageInfo.version)}...`,
                '\n',
            );

            const spinner = ora('Bundle lambdas').start();

            await toolkit.bundleLambdas();

            spinner.succeed();

            if (argv.onlyLambdas) {
                return;
            }

            spinner.start('Compile package');

            await toolkit.compile(false);

            spinner.succeed();

            break;
        }

        case 'watch': {
            await toolkit.compile(true);
            break;
        }

        case 'test': {
            console.log(
                `Testing ${chalk.bold.green(
                    packageInfo.name,
                )} version ${chalk.bold.green(packageInfo.version)}...`,
                '\n',
            );

            const spinner = ora('Bundle lambdas').start();

            await toolkit.bundleLambdas();

            spinner.succeed();

            console.log('\n');

            try {
                await toolkit.test();
            } catch (error) {
                console.error(error);
            }

            break;
        }

        default: {
            throw new Error(`Unknown command: ${command}`);
        }
    }
};

main().catch(e => {
    process.stderr.write(`${e.toString()}\n`);
    process.exit(1);
});
