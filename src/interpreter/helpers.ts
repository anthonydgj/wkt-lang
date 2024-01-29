import * as turf from '@turf/turf';

import { GeometryType } from "./types";

export const isAnyGeometryType = (value: any) => {
    const types = Object.values(GeometryType);
    for (const type of types) {
        if (isGeometryType(type, value)) {
            return true;
        }
    }
    return false;
}

export const isGeometryType = (type: GeometryType, ...values: any) => {
    for (const value of values) {
        const isType = typeof value === 'object' &&
            value?.type === type ||
            value?.geometry?.type === type;
        if (!isType) {
            return false;
        }
    }
    return true;
};

export const getGeometryType = (value: any, isForDisplay = false): GeometryType | undefined => {
    if(typeof value === 'object') {
        const type = value?.geometry?.type || value?.type
        if (isForDisplay && type === GeometryType.GeometryCollection) {
            return GeometryType.GeometryCollection;
        }
        return type;
    }
    return undefined;
}


export const isAGeometryType = (value: any, ...types: GeometryType[]) => {
    for (const type of types) {
        if(isGeometryType(type, value)) {
            return true;
        }
    }
    return false;
};

export const getArrayLikeItems = (value: any) => {
    if (
        isGeometryType(GeometryType.LineString, value) ||
        isGeometryType(GeometryType.MultiPoint, value)
    ) {
        return value.coordinates;
    } else if (isGeometryType(GeometryType.GeometryCollection, value)) {
        return value.geometries;
    }
    return undefined;
};

export const isNumber = (...values: any) => {
    return isType('number', ...values);
}

export const isString = (...values: any) => {
    return isType('string', ...values);
};

export const isType = (type: string, ...values: any) => {
    for (const value of values) {
        const isType = typeof value === type;
        if (!isType) {
            return false;
        }
    }
    return true;
}

export const arithmeticOperationExp = (a: any, b: any, op: (a: any, b: any) => any) => {
    return arithmeticOperation(a.eval(), b.eval(), op);
}

export const arithmeticOperation = (A: any, B: any, op: (a: any, b: any) => any): any => {
    if (isNumber(A, B)) {
      return op(A, B);  
    }
    if (isNumber(A) && isAnyGeometryType(B)) {
        return arithmeticOperation(turf.point([A, A]).geometry, B, op);
    }
    if (isNumber(B) && isAnyGeometryType(A)) {
        return arithmeticOperation(A, turf.point([B, B]).geometry, op);
    }
    if (isGeometryType(GeometryType.Point, A, B)) {
        return pointOperation(A, B, op);
    }
    if (isGeometryType(GeometryType.LineString, A, B)) {
        return lineStringOperation(A, B, op);
    }
    if (isGeometryType(GeometryType.MultiPoint, A, B)) {
        return multiPointOperation(A, B, op);
    }
    if (
        isGeometryType(GeometryType.LineString, A) &&
        isGeometryType(GeometryType.Point, B)
    ) {
        return lineStringPointOperation(A, B, op);
    }
    if (
        isGeometryType(GeometryType.Point, A) &&
        isGeometryType(GeometryType.LineString, B)
    ) {
        return lineStringPointOperation(B, A, (aPrime, bPrime) => op(bPrime, aPrime));
    }
    if (
        isGeometryType(GeometryType.MultiPoint, A) &&
        isGeometryType(GeometryType.Point, B)
    ) {
        return multiPointPointOperation(A, B, op);
    }
    if (
        isGeometryType(GeometryType.Point, A) &&
        isGeometryType(GeometryType.MultiPoint, B)
    ) {
        return multiPointPointOperation(B, A, (aPrime, bPrime) => op(bPrime, aPrime));
    }
    if (
        isGeometryType(GeometryType.GeometryCollection, A) &&
        isGeometryType(GeometryType.Point, B)
    ) {
        return geometryCollectionPointOperation(A, B, op);
    }
    if (
        isGeometryType(GeometryType.Point, A) &&
        isGeometryType(GeometryType.GeometryCollection, B)
    ) {
        return geometryCollectionPointOperation(B, A, (aPrime, bPrime) => op(bPrime, aPrime));
    }
    if (
        isGeometryType(GeometryType.Polygon, A) &&
        isGeometryType(GeometryType.Point, B)
    ) {
        return polygonPointOperation(A, B, op);
    }
    if (
        isGeometryType(GeometryType.Point, A) &&
        isGeometryType(GeometryType.Polygon, B)
    ) {
        return polygonPointOperation(B, A, (aPrime, bPrime) => op(bPrime, aPrime));
    }

    return undefined;
}

export const pointOperation = (
    A: any,
    B: any,
    computeFn: (a: number, b: number) => number
) => {
    return turf.point([
        computeFn(A.coordinates[0], B.coordinates[0]),
        computeFn(A.coordinates[1], B.coordinates[1]),
    ]).geometry;
}


export const lineStringOperation = (
    A: any,
    B: any,
    computeFn: (a: number, b: number) => number
) => {
    return turf.lineString(A.coordinates.map((p: number[], index: number) => {
        return [
            computeFn(p[0], B.coordinates[index][0]),
            computeFn(p[1], B.coordinates[index][1]),
        ];
    })).geometry;
}

export const multiPointOperation = (
    A: any,
    B: any,
    computeFn: (a: number, b: number) => number
) => {
    return turf.multiPoint(A.coordinates.map((p: number[], index: number) => {
        return [
            computeFn(p[0], B.coordinates[index][0]),
            computeFn(p[1], B.coordinates[index][1]),
        ];
    })).geometry;
}

export const lineStringPointOperation = (
    A: any,
    B: any,
    computeFn: (a: number, b: number) => number
) => {
    return turf.lineString(A.coordinates.map((p: number[]) => {
        return [
            computeFn(p[0], B.coordinates[0]),
            computeFn(p[1], B.coordinates[1]),
        ];
    })).geometry;
}

export const multiPointPointOperation = (
    A: any,
    B: any,
    computeFn: (a: number, b: number) => number
) => {
    return turf.multiPoint(A.coordinates.map((p: number[]) => {
        return [
            computeFn(p[0], B.coordinates[0]),
            computeFn(p[1], B.coordinates[1]),
        ];
    })).geometry;
}

export const geometryCollectionPointOperation = (
    A: any,
    B: any,
    computeFn: (a: number, b: number) => number
) => {
    return turf.geometryCollection(A.geometries.map((f: any) => {
        return arithmeticOperation(f, B, computeFn);
    })).geometry;
}

export const polygonPointOperation = (
    A: turf.Polygon,
    B: any,
    computeFn: (a: number, b: number) => number
) => {
    const coords: turf.helpers.Position[][] = A.coordinates.map((coords: turf.helpers.Position[]) => {
        return coords.map(p => [
            computeFn(p[0], B.coordinates[0]),
            computeFn(p[1], B.coordinates[1]),
        ]);
    });
    return turf.polygon(coords).geometry;
}

export class OperationNotSupported extends Error {
    constructor() {
        super("Operation not supported");
    }
}
