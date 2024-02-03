import * as fs from 'fs';

import { Options, OutputFormat, evaluate } from "../src/main";

import { Interpreter } from '../src/interpreter/interpreter';
import chalk from 'chalk';
import yargs from 'yargs'

const readline = require('readline');
const packageJson = require('../package.json')

const input_file = 'input_files';
const version = packageJson.version;
const args = yargs.command('$0', `${packageJson.description}\nVersion: ${version}`)
    .positional(input_file, {
        array: true,
        description: 'List of 1 or more input files'
    })
    .option('format', {
        choices: Object.values(OutputFormat) as OutputFormat[],
        description: 'Output format'
    })
    .option('geojson', {
        boolean: true,
        description: 'Output as GeoJSON'
    })
    .option('interactive', {
        alias: 'i',
        boolean: true,
        description: 'Launch an interactive session'
    })
    .option('evaluate', {
        alias: 'e',
        string: true,
        description: 'Evaluate the specified script text'
    })
    .version(version)
    .parseSync();

const getJsonString = (json: any) => {
    return JSON.stringify(json);
}

const outputFormat = args.geojson ? OutputFormat.GeoJSON : 
    args.format ? args.format : OutputFormat.WKT;
const options: Options = {
    outputFormat: outputFormat,
    scope: Interpreter.createGlobalScope()  // shared scope across evaluations
};

const evaluateScript = args.evaluate;
const inputFiles = args._;
const isInteractive = args.interactive;
let result;
let hasEvaluated = false;

if (evaluateScript) {
    result = evaluate(evaluateScript, options);
    hasEvaluated = true;
}

if (inputFiles && inputFiles.length > 0) {
    inputFiles.forEach(inputFile => {
        const input = fs.readFileSync(inputFile, 'utf-8');

        result = evaluate(input, options);
        if (options.outputFormat === OutputFormat.GeoJSON) {
            try {
                result = getJsonString(result);
            } catch(err) {
                // return raw output
            }
        }
    });
    hasEvaluated = true;
}

// Run interactive mode
if (isInteractive) {
    const EXIT_CMD = `exit()`;
    const END_TOKEN = `;;`;
    let currentInput = ``;
    let count = 0;
    const prompt = () => {
        const line = chalk.cyan(`-- [${count}] --`);
        console.log(line);
        count++;
    }

const instructions = 
`Starting wkt-lang interactive session...

End expressions with ;; to evaluate.
The last evaluation result is stored in the ${Interpreter.IDENTIFIER_LAST} variable.
`;
console.log(chalk.grey(instructions));
prompt();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '',
      terminal: true
    });
    
    rl.on('line', (line: string) => {
        if (line.toLocaleLowerCase() === EXIT_CMD) {
            rl.close();
        } else {
            currentInput += `${line.trim()}\n`;
            const inputEndIndex = currentInput.indexOf(END_TOKEN);
            if (inputEndIndex >= 0) {
                try {
                    let result = evaluate(currentInput.substring(0, inputEndIndex), options);
                    result = options.outputFormat === OutputFormat.GeoJSON ? getJsonString(result) : result;
                    console.log(chalk.grey(result));
                    prompt();
                } catch (err) {
                    console.error(chalk.redBright(err));
                    prompt();
                }
                currentInput = '';
            }
        }
    });
    
    rl.once('close', () => {
         // end of input
     });
} else {
    if (hasEvaluated) {
        if (typeof result !== 'undefined') {
            console.log(result);
        }
    } else {
        yargs.showHelp();
    }
}
