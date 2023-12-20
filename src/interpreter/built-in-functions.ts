import * as turf from '@turf/turf';

import { GeometryType } from './types';
import booleanEqual from "@turf/boolean-equal"
import { isGeometryType } from './helpers';

export namespace BuiltInFunctions {

    const FlattenHelper = (value: any) => {
        const flattenedValues: any[] = [];
        if (!!value) {
            if (value?.type === GeometryType.FeatureCollection) {
                for (const item of value.features) {
                    flattenedValues.push(...FlattenHelper(item));
                }
            } else {
                flattenedValues.push(value);
            }
        }
        return flattenedValues;
    };

    export const Flatten = (value: any) => {
        return turf.featureCollection(FlattenHelper(value));
    };

    export const PointCircle = (radius: number, count: number) => {
        const circlePoints: any[] = [];
        const angleIncrement = (2 * Math.PI) / count;
        for (let i = 0; i < count; i++) {
            const angle = i * angleIncrement;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            circlePoints.push(turf.point([x, y]));
        }
        return turf.featureCollection(circlePoints);
    };

    export const PointGrid = (x: number, y: number, spacing = 1) => {
        const points = [];
        for (let i=0; i<x; i++) {
            for (let j=0; j<y; j++) {
                const point = turf.point([i * spacing, j * spacing]);
                points.push(point);
            }
        }
        return turf.featureCollection(points);
    }

    const getPointsList = (value: any) => {
        let points;
        if (isGeometryType(GeometryType.FeatureCollection, value)) {
            points = value?.features.map((f: any) => f.geometry.coordinates);
        } else if (
            isGeometryType(GeometryType.LineString, value) ||
            isGeometryType(GeometryType.MultiPoint, value)
        ) {
            points = value?.geometry.coordinates;
        }
        if (points) {
            return points;
        }
        throw new Error("Expected geometry with points list");
    }

    export const ToLineString = (value: any) => {
        const pointsList = getPointsList(value);
        return turf.lineString(pointsList);
    };

    export const ToMultiPoint = (value: any) => {
        const pointsList = getPointsList(value);
        return turf.multiPoint(pointsList);
    };

    export const ToPolygon = (value: any) => {
        const pointsList = getPointsList(value);
        // Auto-close polygon
        if (pointsList.length > 0) {
            if (!booleanEqual(
                turf.point(pointsList[0]),
                turf.point(pointsList[pointsList.length - 1])
            )) {
                pointsList.push(pointsList[0]);
            }
        }
        return turf.polygon([pointsList]);
    };

    export const ToGeometryCollection = (value: any) => {
        const pointsList = getPointsList(value);
        return turf.featureCollection(pointsList.map((p: any) => turf.point(p)));
    };

}
