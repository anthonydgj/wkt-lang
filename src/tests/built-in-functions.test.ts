import { defaultEval } from "./test-utils";

test('should convert from geometry collection', () => {
    let result;
    result = defaultEval(`GeometryCollection(Point(1 1), Point(2 2), Point(3 3)) | ToLineString`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

    result = defaultEval(`GeometryCollection(Point(1 1), Point(2 2), Point(3 3)) | ToMultiPoint`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

    result = defaultEval(`GeometryCollection(Point(1 1), Point(2 2), Point(3 3)) | ToGeometryCollection`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[1, 1], [2, 2], [3, 3]]);
});

test('should convert from line string', () => {
    let result;
    result = defaultEval(`LineString(1 1, 2 2, 3 3) | ToLineString`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

    result = defaultEval(`LineString(1 1, 2 2, 3 3) | ToMultiPoint`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

    result = defaultEval(`LineString(1 1, 2 2, 3 3) | ToGeometryCollection`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[1, 1], [2, 2], [3, 3]]);
});

test('should convert from multi point', () => {
    let result;
    result = defaultEval(`MultiPoint(1 1, 2 2, 3 3) | ToLineString`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

    result = defaultEval(`MultiPoint(1 1, 2 2, 3 3) | ToMultiPoint`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

    result = defaultEval(`MultiPoint(1 1, 2 2, 3 3) | ToGeometryCollection`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[1, 1], [2, 2], [3, 3]]);
});
