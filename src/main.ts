import { Interpreter } from "./interpreter/interpreter";
import { Scope } from "./interpreter/scope";
import { convertToWK } from 'wkt-parser-helper';

export enum OutputFormat {
    WKT = 'WKT',
    GeoJSON = 'GeoJSON'
}

export interface Options {
    outputFormat?: OutputFormat,
    scope?: Scope
}

export const DEFAULT_OPTIONS: Options = {
    outputFormat: OutputFormat.WKT
}

export function evaluate(input: string, options: Options = DEFAULT_OPTIONS) {
    const result = Interpreter.evaluateInput(input, options?.scope);
    if (result === null) {
        return undefined;
    }
    if (
        options?.outputFormat === OutputFormat.WKT &&
        typeof result === 'object'
    ) {
        return convertToWK(result);
    }
    return result;
}

