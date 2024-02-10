import { Options, OutputFormat, evaluate } from './main';

import { Interpreter } from './interpreter/interpreter';

const fs = require('fs');

const options: Options = {
    outputFormat: OutputFormat.GeoJSON
};

const defaultEval = (input: string, opts = options) => evaluate(input, opts);

// Example files
test('should evaluate reference programs', () => {
    let content = fs.readFileSync('./examples/reference.wktl', 'utf-8');
    let result = defaultEval(content);
    expect(result).toBeTruthy();

    content = fs.readFileSync('./examples/test.wktl', 'utf-8');
    result = defaultEval(content);

    result = defaultEval(`
        # Multi-line functions
        myFunction = Function(() => {
            a = 1;
            b = 2;
            Point(a b)
        });
        myPoint = myFunction(); # Point(1 2)
        myPoint
    `)
    expect(result.geometry.coordinates).toStrictEqual([1, 2]);
});

// Basic geometry structures

test('should create points', () => {
    let result = defaultEval(`Point (4 ((((12))) + (3 * 2.5) + 4))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates[0]).toBe(4);
    expect(result.geometry.coordinates[1]).toBe(23.5);

    result = defaultEval(`Point (2 (1 + (3^9) * 14894.5325 / -24.53))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates[0]).toBe(2);
    expect(result.geometry.coordinates[1]).toBe(-11951449.599164288);
});

test('should create lines', () => {
    let result = defaultEval(`LineString (4 (12 + (3 * 2.5) + 4), 24.56 85.24, POINT(2 3), Point(5 5) + Point(25 5))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[4, 23.5], [24.56, 85.24], [2, 3], [30, 10]]);
});

test('should create polygon', () => {
    let result = defaultEval(`Polygon ((30 10, 40 40, 20 40, 10 20, (30+1) (10/2), Point(5 5) + Point(25 5)))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[[30, 10], [40, 40], [20, 40], [10, 20], [31, 5], [30, 10]]]);
});

test('should create multi point', () => {
    let result = defaultEval(`MULTIPOINT ((10 40), (40 30), (20 20), (30 10))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[10, 40], [40, 30], [20, 20], [30, 10]]);

    result = defaultEval(`MULTIPOINT (10 40, 40 30, 20 20, 30 10)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[10, 40], [40, 30], [20, 20], [30, 10]]);

    result = defaultEval(`MULTIPOINT ((10 40), Point(40 30), Point(10 10) + Point(10 10), 30 10)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[10, 40], [40, 30], [20, 20], [30, 10]]);
});

test('should create multi polygon', () => {
    let result = defaultEval(`MULTIPOLYGON (((30 20, (45 40), Point(10 40), Point((15 * 2) (25 - 5)))),
        ((15 5, Point(4 1) * Point(10 10), 10 20, 5 10, 15 5)))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([
        [[[30, 20], [45, 40], [10, 40], [30, 20]]],
        [[[15, 5], [40, 10], [10, 20], [5, 10], [15, 5]]]
    ]);
});

test('should create multi line string', () => {
    let result = defaultEval(`MULTILINESTRING ((10 10, Point(20 (10 * 2)), Point(10 10) * Point(1 4)),
        (40 40, 30 30, 40 20, 30 10))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([
        [[10, 10], [20, 20], [10, 40]],
        [[40, 40], [30, 30], [40, 20], [30, 10]]
    ]);
});

test('should create collection', () => {
    let result = defaultEval(`
        GeometryCollection(
            Point (4 (12 + (3 * 2.5) + 4)),
            LineString (4 (12 + (3 * 2.5) + 4), 24.56 85.24),
            Polygon ((1 2, 3 4, 5 6, 1 2))
        )
    `);
    expect(result).toBeTruthy();

    const point = result.geometry.geometries[0];
    expect(point.coordinates).toStrictEqual([4, 23.5]);

    const lineString = result.geometry.geometries[1];
    expect(lineString.coordinates).toStrictEqual([[4, 23.5], [24.56, 85.24]]);

    const polygon = result.geometry.geometries[2];
    expect(polygon.coordinates).toStrictEqual([[[1, 2], [3, 4], [5, 6], [1, 2]]]);
});


// Geometry arithmetic

test('should support point arithmetic', () => {
    let result = defaultEval(`Point(1 2) + Point(1 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates[0]).toBe(2);
    expect(result.geometry.coordinates[1]).toBe(4);

    result = defaultEval(`Point(1 2) - Point(1 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([0, 0]);

    result = defaultEval(`Point(1 2) * Point(3 4)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([3, 8]);

    result = defaultEval(`Point(5 10) / Point(5 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([1, 5]);

    result = defaultEval(`Point(2 5) ^ Point(3 0)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([8, 1]);
    
    result = defaultEval(`Point(2 5) % Point(3 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([2, 1]);
});

test('should support line string arithmetic', () => {
    let result = defaultEval(`LineString(0 0, 1 1, 2 2) + LineString(0 0, 1 1, 2 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[0, 0], [2, 2], [4, 4]]);

    result = defaultEval(`LineString(10 0, 1 1, 2 2) - LineString(0 1, 2 3, 4 5)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[10, -1], [-1, -2], [-2, -3]]);

    result = defaultEval(`LineString(10 0, 1 1, 2 2) * LineString(0 1, 2 3, 4 5)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[0, 0], [2, 3], [8, 10]]);

    result = defaultEval(`LineString(10 0, 1 6, 10 20) / LineString(1 1, 2 3, 2 5)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[10, 0], [0.5, 2], [5, 4]]);

    result = defaultEval(`LineString(0 0, 1 1, 2 2) ^ LineString(1 2, 3 4, 4 5)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[0, 0], [1, 1], [16, 32]]);

    result = defaultEval(`LineString(2 2, 5 5) % LineString(3 3, 2 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[2, 2], [1, 1]]);
});

test('should support line string and point arithmetic', () => {
    let result = defaultEval(`LineString(0 0, 1 1, 2 2) + Point(1 1)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3]]);
    result = defaultEval(`Point(1 1) + LineString(0 0, 1 1, 2 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

    result = defaultEval(`LineString(10 0, 1 1, 2 2) - Point(1 1)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[9, -1], [0, 0], [1, 1]]);
    result = defaultEval(`Point(1 1) - LineString(10 0, 1 1, 2 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[-9, 1], [0, 0], [-1, -1]]);

    result = defaultEval(`LineString(10 0, 1 1, 2 2) * Point(2 3)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[20, 0], [2, 3], [4, 6]]);
    result = defaultEval(`Point(2 3) * LineString(10 0, 1 1, 2 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[20, 0], [2, 3], [4, 6]]);

    result = defaultEval(`LineString(10 0, 1 6, 10 21) / Point(2 3)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[5, 0], [0.5, 2], [5, 7]]);
    result = defaultEval(`Point(8 9) / LineString(2 1, 16 3, 4 -18)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[4, 9], [0.5, 3], [2, -0.5]]);

    result = defaultEval(`LineString(1 2, 3 4) ^ Point(2 3)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 8], [9, 64]]);
    result = defaultEval(`Point(2 3) ^ LineString(1 2, 3 4)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[2, 9], [8, 81]]);

    result = defaultEval(`LineString(2 5, 2 5) % Point(3 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[2, 1], [2, 1]]);
    result = defaultEval(`Point(2 5) % LineString(3 2, 3 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[2, 1], [2, 1]]);

});

test('should support polygon and point arithmetic', () => {
    let result = defaultEval(`Polygon((1 1, 2 2, 3 3, 1 1)) + Point(1 1)`);
    expect(result.geometry.coordinates).toStrictEqual([[[2, 2], [3, 3], [4, 4], [2, 2]]]);
    result = defaultEval(`Point(1 1) + Polygon((1 1, 2 2, 3 3, 1 1))`);
    expect(result.geometry.coordinates).toStrictEqual([[[2, 2], [3, 3], [4, 4], [2, 2]]]);
    result = defaultEval(`Polygon((1 1, 2 2, 3 3, 1 1)) - Point(-1 -1)`);
    expect(result.geometry.coordinates).toStrictEqual([[[2, 2], [3, 3], [4, 4], [2, 2]]]);
    result = defaultEval(`Point(3 3) - Polygon((1 1, 2 2, 3 3, 1 1))`);
    expect(result.geometry.coordinates).toStrictEqual([[[2, 2], [1, 1], [0, 0], [2, 2]]]);
    result = defaultEval(`Polygon((8 8, 8 0, 0 0, 0 8, 8 8), (6 6, 6 2, 2 2, 2 6, 6 6)) + Point(1 1)`)
    expect(result.geometry.coordinates).toStrictEqual([
        [[9, 9], [9, 1], [1, 1], [1, 9], [9, 9]],
        [[7, 7], [7, 3], [3, 3], [3, 7], [7, 7]]
    ]);
});

test('should support variable type arithmetic', () => {
    let result;
    result = defaultEval(`Point(1 2) + 3`);
    expect(result).toBeTruthy();
    expect(result?.geometry?.coordinates).toStrictEqual([4, 5]);
    result = defaultEval(`44 / Point(1 2)`);
    expect(result).toBeTruthy();
    expect(result?.geometry?.coordinates).toStrictEqual([44, 22]);

    result = defaultEval(`LineString(1 1, 2 2) + 3`);
    expect(result).toBeTruthy();
    expect(result?.geometry?.coordinates).toStrictEqual([[4, 4], [5, 5]]);
    result = defaultEval(`44 / LineString(1 1, 2 2)`);
    expect(result).toBeTruthy();
    expect(result?.geometry?.coordinates).toStrictEqual([[44, 44], [22, 22]]);

    result = defaultEval(`MultiPoint(1 1, 2 2) + 3`);
    expect(result).toBeTruthy();
    expect(result?.geometry?.coordinates).toStrictEqual([[4, 4], [5, 5]]);
    result = defaultEval(`44 / MultiPoint(1 1, 2 2)`);
    expect(result).toBeTruthy();
    expect(result?.geometry?.coordinates).toStrictEqual([[44, 44], [22, 22]]);

    result = defaultEval(`GeometryCollection(1 1, 2 2) + 3`);
    expect(result).toBeTruthy();
    expect(result?.geometry.geometries?.map((f: any) => f.coordinates)).toStrictEqual([[4, 4], [5, 5]]);
    result = defaultEval(`44 / GeometryCollection(1 1, 2 2)`);
    expect(result).toBeTruthy();
    expect(result?.geometry.geometries?.map((f: any) => f.coordinates)).toStrictEqual([[44, 44], [22, 22]]);

    result = defaultEval(`
    GeometryCollection(
        Point(1 1),
        MultiPoint(1 1, 2 2),
        LineString(1 1, 2 2, 3 3),
        MultiLineString((1 1, 2 2, 3 3), (4 4, 5 5, 6 6)),
        Polygon((1 1, 2 2, 3 3, 1 1), (7 7, 8 8, 9 9, 7 7)),
        GeometryCollection(
            Point(1 1),
            MultiPoint(1 1, 2 2),
            LineString(1 1, 2 2, 3 3),
            MultiLineString((1 1, 2 2, 3 3), (4 4, 5 5, 6 6)),
            Polygon((1 1, 2 2, 3 3, 1 1), (7 7, 8 8, 9 9, 7 7))
        )
    ) + 3
    `);
    expect(result).toBeTruthy();
    let geometries = result?.geometry.geometries;
    expect(geometries[0].coordinates).toStrictEqual([4, 4]);
    expect(geometries[1].coordinates).toStrictEqual([[4, 4], [5, 5]]);
    expect(geometries[2].coordinates).toStrictEqual([[4, 4], [5, 5], [6, 6]]);
    expect(geometries[3].coordinates).toStrictEqual([[[4, 4], [5, 5], [6, 6]], [[7, 7], [8, 8], [9, 9]]]);
    expect(geometries[4].coordinates).toStrictEqual([[[4, 4], [5, 5], [6, 6], [4, 4]], [[10, 10], [11, 11], [12, 12], [10, 10]]]);
    geometries = geometries[5].geometries;
    expect(geometries[0].coordinates).toStrictEqual([4, 4]);
    expect(geometries[1].coordinates).toStrictEqual([[4, 4], [5, 5]]);
    expect(geometries[2].coordinates).toStrictEqual([[4, 4], [5, 5], [6, 6]]);
    expect(geometries[3].coordinates).toStrictEqual([[[4, 4], [5, 5], [6, 6]], [[7, 7], [8, 8], [9, 9]]]);
    expect(geometries[4].coordinates).toStrictEqual([[[4, 4], [5, 5], [6, 6], [4, 4]], [[10, 10], [11, 11], [12, 12], [10, 10]]]);
});

// Sequential expressions

test('should evaluate sequential expressions and return the last value', () => {
    let result = defaultEval(`Point(2 5) ^ (3 0); 1 + 3; (Point(1 2) * Point(3 3))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([3, 6]);
});


// Comments

test('should evaluate expressions with surrounding comments', () => {
    let result = defaultEval(`# just a comment`);
    expect(result).toBeUndefined();

    result = defaultEval(`
    # comment on one line
    # comment on another line
    `);
    expect(result).toBeUndefined();

    result = defaultEval(`
    # comment
    Point(1 2) # inline comment
    `);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([1, 2]);

    result = defaultEval(`
    # comment
    Point(1 2); # inline comment

    # Additional comment
    Point(3 4)

    # Trailing comment
    `);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([3, 4]);

});


// End

test('should run without return value', () => {
    let result = defaultEval(``);
    expect(result).toBeUndefined();

    result = defaultEval(`# just a comment`);
    expect(result).toBeUndefined();
});

test('should return last value', () => {
    let result = defaultEval(`Point(1 1)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([1, 1]);

    result = defaultEval(`Point(1 1);`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([1, 1]);
});


// Variables

test('should declare variables', () => {
    let result = defaultEval(`a = Point(1 2)`);
    expect(result).toBeUndefined();

    // support valid variable name characters
    result = defaultEval(`
        a = Point(1 1);
        b2 = Point(2 2);
        c_3 = Point(3 3);
        GeometryCollection(a, b2, c_3)
    `);
    expect(result).toBeTruthy();

    // support variable names that include a keyword
    result = defaultEval(`pointA = Point(1 2); pointA`);
    expect(result).toBeTruthy();
});

test('should evaluate variables', () => {
    let result = defaultEval(`
        a = 2 * 42;
        b = 8 / 2;
        a + b
    `);
    expect(result).toBeTruthy();
    expect(result).toBe(88);


    result = defaultEval(`
        c = Point(1 2);
        c + Point(3 4)
    `);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([4, 6]);
});

test('should reassign variables', () => {
    let result = defaultEval(`
        a = 1;
        b = 2;
        a = a + b;
        Point(a b)
    `);
    expect(result.geometry.coordinates).toStrictEqual([3, 2]);
});


// Functions

test('should evaluate functions', () => {
    let result = defaultEval(`
        fn = Function(() => 3);
        fn()
    `);
    expect(result).toBe(3);

    result = defaultEval(`
        Function(() => 3 ;
        4 ; 6)()
    `);
    expect(result).toBe(6);

    result = defaultEval(`
        createPoint = Function(() => Point(2 3));
        LineString(createPoint(), createPoint())
    `);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[2, 3], [2, 3]]);
});

test('should evaluate functions with parameters', () => {
    let result;
    
    result = defaultEval(`
        fn = Function(a => a + 1);
        fn(2)
    `);
    expect(result).toBe(3);

    result = defaultEval(`
        fn1 = Function(a => {
            a + 1;
            fn2 = Function(b => a + b);
            fn2(3)
        });
        fn1(2)
    `);
    expect(result).toBe(5);    

    result = defaultEval(`
        x = 2;
        fn1 = Function(a => {
            x = 5;
            a = a + x;
            fn2 = Function(b => a + b);
            fn2(3)
        });
        y = fn1(x);
        Point(x y)
    `);
    expect(result).toBeTruthy(); 
    expect(result.geometry.coordinates).toStrictEqual([2, 10]);

    result = defaultEval(`
        x = 2;
        fn1 = Function((a, c) => {
            x = 5;
            a = a + x;
            fn2 = Function(b => a + b);
            fn2(3)
        });
        y = fn1(x, 5);
        Point(x y)
    `);
    expect(result).toBeTruthy(); 
    expect(result.geometry.coordinates).toStrictEqual([2, 10]);

    result = defaultEval(`
        getLatitude = Function(() => 55);
        createPointOneArg = Function(x => Point(x getLatitude()));
        createPointTwoArgs = Function((x, y) => Point(x y));
        otherLine = LineString(
            createPointOneArg(10),
            createPointTwoArgs(20, 55)
        );
        otherLine # LINESTRING(10 55, 20 55)
    `);
    expect(result).toBeTruthy(); 
    expect(result.geometry.coordinates).toStrictEqual([[10, 55], [20, 55]]);

});


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


// Last expression result variable

test('should return last evaluated value using $?', () => {
    const scope = Interpreter.createGlobalScope();
    defaultEval(`Point(2 3)`, { scope });
    let result = defaultEval(`$?`, { scope });
    expect(result).toBeTruthy();
    expect(result.coordinates).toStrictEqual([2, 3]);
})

// Generate expression

test('should generate geometries', () => {
    let result;
    result = defaultEval(`Generate 3 Point(0 0)`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[0, 0], [0, 0], [0, 0]]);

    result = defaultEval(`Generate 3 Function(x => Point(x x))`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[0, 0], [1, 1], [2, 2]]);

    result = defaultEval(`a = (Generate 3 Function(x => Point(x x))); a`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[0, 0], [1, 1], [2, 2]]);

    result = defaultEval(`
        Generate 3 Function(x => Point(x x))
            || Function(p => Generate 3 Function(x => p + Point(x x)))
            | Flatten
    `);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([
        [0, 0], [1, 1], [2, 2],
        [1, 1], [2, 2], [3, 3],
        [2, 2], [3, 3], [4, 4],
    ]);

    result = defaultEval(`Point(1 1) - (Generate 3 Function(x => Point(x x)))`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[1, 1], [0, 0], [-1, -1]]);

    result = defaultEval(`(Generate 3 Function(x => Point(x x))) + Point(1 1)`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

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

test('should access point coordinates', () => {
    let result;
    result = defaultEval(`Point(2 3):x()`);
    expect(result).toBe(2);
    result = defaultEval(`Point(2 3):y()`);
    expect(result).toBe(3);
    result = defaultEval(`a = Point(2 3); a:x()`);
    expect(result).toBe(2);
    result = defaultEval(`a = Point(2 3); a:y()`);
    expect(result).toBe(3);
});

test('should update point coordinates', () => {
    let result;
    result = defaultEval(`Point(2 3):x(4)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([4, 3]);
    result = defaultEval(`Point(2 3):y(5)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([2, 5]);

    result = defaultEval(`a = Point(2 3); a:x(4)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([4, 3]);
    result = defaultEval(`a = Point(2 3); a:y(5)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([2, 5]);
});

test('should have immutable updates using copies', () => {
    let result;
    result = defaultEval(`a = Point(2 3); a:x(4); a`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([2, 3]);
    result = defaultEval(`a = Point(2 3); a:y(5); a`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([2, 3]);
});

test('should access geometry collection values', () => {
    let result;
    result = defaultEval(`GeometryCollection(Point(1 2), Point(3 4)):numGeometries()`);
    expect(result).toBe(2);
    result = defaultEval(`g = GeometryCollection(Point(1 2), Point(3 4)); g:numGeometries()`);
    expect(result).toBe(2);

    result = defaultEval(`GeometryCollection(Point(1 2), Point(3 4)):geometryN(1)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([3, 4]);
    result = defaultEval(`g = GeometryCollection(Point(1 2), Point(3 4)); g:geometryN(1)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([3, 4]);
});

test('should access line string values', () => {
    let result;
    result = defaultEval(`LineString(1 2, 3 4):numPoints()`);
    expect(result).toBe(2);
    result = defaultEval(`l = LineString(1 2, 3 4); l:numPoints()`);
    expect(result).toBe(2);

    result = defaultEval(`LineString(1 2, 3 4):pointN(1)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([3, 4]);
    result = defaultEval(`l = LineString(1 2, 3 4); l:pointN(1)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([3, 4]);
    result = defaultEval(`l = LineString(1 2, 3 4); l:pointN(l:numPoints() - 1)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([3, 4]);

});

test('should support conditionals', () => {
    let result;
    result = defaultEval(`false`);
    expect(result).toBe(false);
    result = defaultEval(`true`);
    expect(result).toBe(true);

    result = defaultEval(`1 > 2`);
    expect(result).toBe(false);
    result = defaultEval(`2 > 1`);
    expect(result).toBe(true);

    result = defaultEval(`1 >= 2`);
    expect(result).toBe(false);
    result = defaultEval(`1 >= 1`);
    expect(result).toBe(true);

    result = defaultEval(`1 < 2`);
    expect(result).toBe(true);
    result = defaultEval(`2 < 1`);
    expect(result).toBe(false);

    result = defaultEval(`2 <= 2`);
    expect(result).toBe(true);
    result = defaultEval(`2 <= 1`);
    expect(result).toBe(false);

    result = defaultEval(`1 == 2`);
    expect(result).toBe(false);
    result = defaultEval(`1 == 1`);
    expect(result).toBe(true);

    result = defaultEval(`1 != 2`);
    expect(result).toBe(true);
    result = defaultEval(`1 != 1`);
    expect(result).toBe(false);

    result = defaultEval(`Point(1 1):x() == 2`);
    expect(result).toBe(false);
    result = defaultEval(`Point(1 1):x() == 1`);
    expect(result).toBe(true);

});

test('should support If-Then-Else expressions', () => {
    let result;
    result = defaultEval(`If 3 > 4 Then (Point(1 1)) Else (Point(2 2))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([2, 2]);

    result = defaultEval(`If 3 < 4 Then (Point(1 1)) Else (Point(2 2))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([1, 1]);

    result = defaultEval(`Function(x => If 3 < 4 Then (Point(1 1)) Else ( Point(2 2)))()`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([1, 1]);

    result = defaultEval(`If 3 < 4 Then (Point(1 1)) Else (Point(2 2))`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([1, 1]);

    result = defaultEval(`
        If 3 < 4 Then
            (Generate 3 Function(x => Point(x x)))
        Else (Point(2 2))`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[0, 0], [1, 1], [2, 2]]);

    result = defaultEval(`
        If 3 < 4 Then (
            Generate 3 Function(x => Point(x x))
                || Function(p => p + 1)
        )
        Else (Point(2 2))`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

    result = defaultEval(`
        a = If 3 < 4 Then (
            Generate 3 Function(x => Point(x x))
                || Function(p => p + 1)
        ) Else (Point(2 2));
        a`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

});

test('should support logical operators', () => {
    let result;
    result = defaultEval(`true AND true`);
    expect(result).toBe(true);

    result = defaultEval(`true AND false`);
    expect(result).toBe(false);

    result = defaultEval(`false AND true`);
    expect(result).toBe(false);

    result = defaultEval(`false AND false`);
    expect(result).toBe(false);

    result = defaultEval(`true OR true`);
    expect(result).toBe(true);

    result = defaultEval(`true OR false`);
    expect(result).toBe(true);

    result = defaultEval(`false OR true`);
    expect(result).toBe(true);

    result = defaultEval(`false OR false`);
    expect(result).toBe(false);

    result = defaultEval(`!true`);
    expect(result).toBe(false);

    result = defaultEval(`!false`);
    expect(result).toBe(true);
});

test('should concatenate geometries', () => {
    let result;
    result = defaultEval(`LineString(1 1, 2 2) ++ LineString(3 3, 4 4)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3], [4, 4]])

    result = defaultEval(`LineString(1 1, 2 2) ++ Point(3 3)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

    result = defaultEval(`MultiPoint(1 1, 2 2) ++ MultiPoint(3 3, 4 4)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3], [4, 4]])

    result = defaultEval(`MultiPoint(1 1, 2 2) ++ Point(3 3)`);
    expect(result).toBeTruthy();
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3]]);
    
    result = defaultEval(`GeometryCollection(Point(1 1), Point(2 2)) ++ GeometryCollection(Point(3 3), Point(4 4))`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[1, 1], [2, 2], [3, 3], [4, 4]]);

    result = defaultEval(`GeometryCollection(Point(1 1), Point(2 2)) ++ Point(3 3)`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

    result = defaultEval(`GeometryCollection(Point(1 1), Point(2 2)) ++ Point(3 3)`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[1, 1], [2, 2], [3, 3]]);

    result = defaultEval(`GeometryCollection(Point(1 1), Point(2 2)) ++ Point(3 3) ++ Point(4 4)`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[1, 1], [2, 2], [3, 3], [4, 4]]);

    result = defaultEval(`LineString(1 1, 2 2) ++ MultiPoint(3 3, 4 4)`);
    expect(result).toBeTruthy();
    expect(result.geometry.type).toBe('LineString');
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3], [4, 4]]);

    result = defaultEval(`MultiPoint(1 1, 2 2) ++ LineString(3 3, 4 4)`);
    expect(result).toBeTruthy();
    expect(result.geometry.type).toBe('MultiPoint');
    expect(result.geometry.coordinates).toStrictEqual([[1, 1], [2, 2], [3, 3], [4, 4]]);

    result = defaultEval(`Point(1 1) ++ Point(2 2)`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual([[1, 1], [2, 2]]);

    result = defaultEval(`Point(2 2) ++ GeometryCollection(Point(3 3), Point(4 4))`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries[0].coordinates).toStrictEqual([2, 2]);
    expect(result.geometry.geometries[1].geometries.map((f: any) => f.coordinates)).toStrictEqual([[3, 3], [4, 4]]);
});

test('should handle empty geometries', () => {
    let result;
    result = defaultEval(`GeometryCollection()`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.length).toBe(0);

    result = defaultEval(`GeometryCollection() ++ Point(1 1)`);
    expect(result).toBeTruthy();
    expect(result.geometry.geometries.map((f: any) => f.coordinates)).toStrictEqual(([[1, 1]]))
});

test('should access geometry properties', () => {
    let result;
    result = defaultEval(`GeometryCollection():type()`);
    expect(result).toBe('GeometryCollection');
    result = defaultEval(`GeometryCollection():type() == GeometryCollection`);
    expect(result).toBe(true);
    result = defaultEval(`GeometryCollection():type() == Point`);
    expect(result).toBe(false);
    result = defaultEval(`GeometryCollection():type() != Point`);
    expect(result).toBe(true);
    result = defaultEval(`Point(1 1):type() == Point`);
    expect(result).toBe(true);
    result = defaultEval(`LineString(1 1, 2 2):type() == LineString`);
    expect(result).toBe(true);
    result = defaultEval(`MultiPoint(1 1, 2 2):type() == MultiPoint`);
    expect(result).toBe(true);
    result = defaultEval(`MultiLineString((1 1, 2 2)):type() == MultiLineString`);
    expect(result).toBe(true);
    result = defaultEval(`Polygon((1 1, 2 2, 3 3, 1 1)):type() == Polygon`);
    expect(result).toBe(true);
});

it('should handle recursion', () => {
    let result = defaultEval(`
        build_list = Function(n => {
            # Base case
            if n == 0 then (
                GeometryCollection()
            ) else (
                # Recursive call to build the rest of the list
                rest_of_list = build_list(n - 1);
                
                # Add the current element to the list
                current_element = Point(n n);
                
                # Combine the current element with the rest of the list
                rest_of_list ++ GeometryCollection(current_element)
            )
        });
        build_list(3)
    `);
    expect(result?.geometry.geometries?.map((f: any) => f.coordinates))
        .toStrictEqual([[1, 1], [2, 2], [3, 3]]);
});
