import { Interpreter } from "../interpreter/interpreter";
import { defaultEval } from "./test-utils";

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

// Last expression result variable

test('should return last evaluated value using $?', () => {
    const scope = Interpreter.createGlobalScope();
    defaultEval(`Point(2 3)`, { scope });
    let result = defaultEval(`$?`, { scope });
    expect(result).toBeTruthy();
    expect(result.coordinates).toStrictEqual([2, 3]);
});
