import { Options, OutputFormat, evaluate } from '../main';

export const options: Options = {
    outputFormat: OutputFormat.GeoJSON
};

export const defaultEval = (input: string, opts = options) => evaluate(input, opts);
