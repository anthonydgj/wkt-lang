import { defaultEval } from './test-utils';

const fs = require('fs');

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
