import * as fs from 'fs';
import * as yargs from 'yargs'

import { Options, OutputFormat, evaluate } from "../src/main";

import { Interpreter } from '../src/interpreter/interpreter';
import chalk from 'chalk';

const readline = require('readline');

const input_file = 'input_files';
const args = yargs.command(`wkt ${input_file}`, 'WKT script interpreter')
    .positional(input_file, {
        array: true,
        alias: 'inputFiles'
    })
    .option('format', {
        choices: Object.values(OutputFormat) as OutputFormat[],
    })
    .option('geojson', {
        boolean: true
    })
    .option('interactive', {
        alias: 'i',
        boolean: true
    })
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

const inputFiles = args._;
const isInteractive = args.interactive;
let finalResult;

if (inputFiles) {
    inputFiles.forEach(inputFile => {
        const input = fs.readFileSync(inputFile, 'utf-8');

        let result = evaluate(input, options);
        if (options.outputFormat === OutputFormat.GeoJSON) {
            try {
                result = getJsonString(result);
            } catch(err) {
                // return raw output
            }
        }

        if (typeof result !== 'undefined') {
            finalResult = result;
        }
    })
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
    console.log(finalResult);
}
