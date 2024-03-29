import * as turf from '@turf/turf';
import * as wellknown from 'wellknown';

import { Interpreter } from "./interpreter/interpreter";
import { Scope } from "./interpreter/scope";

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
    if (typeof result === 'object') {
        switch(options?.outputFormat) {
            case OutputFormat.WKT:
                return wellknown.stringify(result);
            case OutputFormat.GeoJSON:
                return turf.feature(result) as any;
            default:
                break;
        }
    }
    return result;
}

