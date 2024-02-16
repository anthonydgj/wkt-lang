import { Options, OutputFormat, WktLang } from '../main';

export const DEFAULT_OPTIONS: Options = {
    outputFormat: OutputFormat.GeoJSON
};

export const defaultEval = (input: string, opts = DEFAULT_OPTIONS) => 
    new WktLang().evaluate(input, {...DEFAULT_OPTIONS, ...opts});
