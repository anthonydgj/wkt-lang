import { defaultEval } from "./test-utils";

test('should map array-like geometries', () => {
    let result;
    result = defaultEval(`MultiPoint(1 1, 2 2, 3 3) || Function(x => x + Point(1 1))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[2, 2], [3, 3], [4, 4]]);
    result = defaultEval(`LineString(1 1, 2 2, 3 3) || Function(x => x + Point(1 1))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[2, 2], [3, 3], [4, 4]]);

    result = defaultEval(`GeometryCollection(Point(1 1), Point(2 2), Point(3 3)) || Function(x => x + Point(1 1))`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[2, 2], [3, 3], [4, 4]]);

    result = defaultEval(`Generate 3 Function(x => {x = x+1; Point(x x)}) || Function(x => LineString(x, (x + Point(1 1))))`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([
        [[1, 1], [2, 2]],
        [[2, 2], [3, 3]],
        [[3, 3], [4, 4]],
    ]);

    result = defaultEval(`MultiPoint(1 1, 2 2, 3 3)
        || Function((x, i) => x + Point(i 1))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 2], [3, 3], [5, 4]]);

    result = defaultEval(`Function(() => MultiPoint(1 1, 2 2, 3 3)
        || Function((x, i) => x + Point(i 1)))()`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 2], [3, 3], [5, 4]]);

    result = defaultEval(`
        CreateCircles = Function(() => {
            Generate 5 Function(i => {
                ring = i + 1;
                PointCircle((ring * 2), (ring * 10))
            }) | Flatten        
        });
        CreateCircles()
            || Function(x => If (x:x() <= 0) Then (x + Point(0 10)) Else (x - Point(0 10)))
            || Function(x => GeometryCollection(x, (x + Point(11 0))))
            | Flatten
    `);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.length).toBe(300);
});

test('should filter array-like geometries', () => {
    let result;
    result = defaultEval(`MultiPoint(1 1, 2 2, 3 3) |> Function(x => x:x() <= 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2]]);

    result = defaultEval(`MultiPoint(1 1, 2 2, 3 3) |> Function((x, i) => i < 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2]]);

});

test('should error when attempting to generate non-geometries', () => {
    try {
        defaultEval(`
           Generate 100 Function(x => x)
        `);
        fail('Expected an error.');
    } catch (err) {
        // Do nothing
    }
});
