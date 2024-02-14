export const GRAMMAR = String.raw`
WktLang {

    /******************************
     * wkt-lang syntax extensions *
     ******************************/

    // Top-level expressions
    TopLevel = ScopedExpressions TopLevelEnd
    TopLevelEnd = ExpressionDelimiter | end 
    
    // Comments
    comment = "#" commentSpace* commentText* commentSpace* commentEnd
    commentText = ~commentEnd any
    commentEnd = "\n" | end
    commentSpace = " "

    // Expression structure
    ScopedExpressions = ListOf<GeneralExpression, ExpressionDelimiter> --list
        | GeneralExpression
    GeneralExpression =  GeneralExpression comment --rightComment
        | comment GeneralExpression --leftComment
        | Declaration
        | AssignableExpression 
        | comment    
    ExpressionDelimiter = expressionDelimiter
    expressionDelimiter = ";"

    // Variables
    Declaration = Identifier assignmentOperator AssignableExpression 
    AssignableExpression = 
    	| NonArithmeticAssignableExpression
    	| ArithmeticAssignableExpression
    NonArithmeticAssignableExpression = 
    	| OperationExp
    ArithmeticAssignableExpression = Arithmetic<AssignableExpressionForArithmetic>
    AssignableExpressionForArithmetic = 
        | BooleanResultExp
        | AccessorExp
    	| NumberExp
    	| GeometryExp
        | FunctionTextExp 
        | BooleanValue
        | IfThenElseExp
        | ComputedExp
        | Paren<OperationExp> //Paren<OperationExp>
    assignmentOperator = "="
    ComputedValue<Type> = Type | ComputedExp
    ComputedExp = ComputedPrimitive
    ComputedPrimitive = FunctionCallExp | Identifier

    // Additional operation expressions
    OperationExp =  PipeExp | GenerateExp | ConcatExp
    PipeExp = MappableValue anyPipeOperator Callable
    GenerateExp = generateKeyword ComputedValue<NumberExp> GenerateValue
    ConcatExp = MappableValue concatOperator MappableValue
    GenerateValue = GeometryExp | FunctionTextExp
    generateKeyword = caseInsensitive<"Generate">
    MappableValue = AssignableExpression 

    // Helpers
    Paren<type> = LeftParen type RightParen
    OptionallyParen<type> = LeftParen type RightParen --paren
        | type --noParen
    OptionallyBraced<type> = LeftBrace type RightBrace --brace
    	| type
        
    // Arithmetic expressions
    ParenthesizedArithmetic<Type> = "(" Arithmetic<Type> ")"
    Arithmetic<Type> = ArithmeticAddExp<Type>
    	| Type
    //ArithmeticConcatExp<Type> = ArithmeticConcatExp<Type> concatOperator ArithmeticAddExp<Type> --concat
    //	| ArithmeticAddExp<Type>
    ArithmeticAddExp<Type> = ArithmeticAddExp<Type> plusOperator ArithmeticMulExp<Type>  -- plus
      | ArithmeticAddExp<Type> minusOperator ArithmeticMulExp<Type>  -- minus
      | ArithmeticMulExp<Type>
    ArithmeticMulExp<Type> = ArithmeticMulExp<Type> timesOperator ArithmeticExpExp<Type>  -- times
      | ArithmeticMulExp<Type> divideOperator ArithmeticExpExp<Type>  -- divide
      | ArithmeticMulExp<Type> modOperator ArithmeticExpExp<Type>  -- mod
      | ArithmeticExpExp<Type>
    ArithmeticExpExp<Type> = ArithmeticPriExp<Type> powerOperator ArithmeticExpExp<Type>  -- power
      | ArithmeticPriExp<Type>
    ArithmeticPriExp<Type> = "(" Arithmetic<Type> ")"  -- paren
        | Type
        
   	// Operators
   	operator = 
   		| expressionDelimiter
        | anyPipeOperator
        | plusOperator
        | minusOperator
        | timesOperator
        | divideOperator
        | powerOperator
        | modOperator
        | accessorOperator
        | conditionalOperator
        | assignmentOperator
        | notOperator

    anyPipeOperator = doublePipeOperator | coordinatesPipeOperator | filterOperator | pipeOperator

    pipeOperator = "|"
    coordinatesPipeOperator = "|*"
    doublePipeOperator = "||"
    filterOperator = "|>"
    concatOperator = "++"
    plusOperator = "+"
    minusOperator = "-"
    timesOperator = "*"
    divideOperator = "/"
    powerOperator = "^"
    modOperator = "%"
    accessorOperator = ":"
    
    // Function expressions
    FunctionTextExp = functionKeyword LeftParen FunctionExp RightParen
    FunctionExp = FunctionParameters "=>" FunctionBody
    FunctionParameters = LeftParen ListOf<Identifier, Comma> RightParen --multipleParams
        | Identifier --single
    FunctionBody =  OptionallyBraced<ScopedExpressions>
    FunctionCallExp = Callable Invocation
    Invocation = LeftParen ListOf<GeneralExpression, Comma> RightParen
   	functionKeyword = caseInsensitive<"Function">
    Callable = FunctionTextExp | Identifier
    
    // Accessor expressions
    AccessorExp = ComputedValue<GeometryExp> accessorOperator Identifier Invocation
    
    // If-Then-Else expressions
    IfThenElseExp = ifKeyword OptionallyParen<BooleanResultExp> thenKeyword
    	Paren<ScopedExpressions> elseKeyword 
        Paren<ScopedExpressions>
    ifKeyword = caseInsensitive<"if">
    thenKeyword = caseInsensitive<"then">
    elseKeyword = caseInsensitive<"else">
    
    // Conditional expressions
    BooleanResultExp = EqualityExp | CompareExp | NotExp | booleanValue
    EqualityExp = ComparePrimitive equalityOperatorPrimitive ComparePrimitive
    NotExp = notOperator ComparePrimitive
    ConditionalValue = CompareExp | EqualityExp | BooleanValue | NumberExp
    CompareExp = ComparePrimitive compareOperatorPrimitive ComparePrimitive
    ComparePrimitive = BooleanResultExp | AccessorExp | ComputedValue<NumberExp> | geometryKeyword
    conditionalOperator = compareOperatorPrimitive | equalityOperatorPrimitive
    compareOperatorPrimitive = "<=" | ">=" | "<" | ">"
    equalityOperatorPrimitive = "==" | "!=" | logicalOperator
    logicalOperator = caseInsensitive<"And"> | caseInsensitive<"Or">
    notOperator = "!"

    // Identifiers
    Identifier =  basicIdentifier
    basicIdentifier =  ~nonAllowedIdentifiers id
    id = firstIdCharacter idCharacter*
    firstIdCharacter = simpleLatinLetter | "$"
    idCharacter = simpleLatinLetter | digit | "_" | "?" | "'"
	nonAllowedIdentifiers = keyword identifierEnd
    identifierEnd = end | comma | leftParen | rightParen | operator | wktSpace

    /*************************************
     * OGC Well-Known Text (WKT) Grammar *
     *************************************/

    // Based on WKT Syntax: https://www.ogc.org/standard/sfa/

	GeometrySyntaxExp<GeometryTypeExp, geometryKeyword> = Arithmetic<GeometryArithmetic<GeometryTypeExp, geometryKeyword>>
    GeometryArithmetic<GeometryTypeExp, geometryKeyword> = GeometryPrimitive<GeometryTypeExp, geometryKeyword>
	GeometryPrimitive<GeometryTypeExp, geometryKeyword> = GeometryTaggedText<GeometryTypeExp, geometryKeyword>
    GeometryTaggedText<GeometryTypeExp, geometryKeyword> = geometryKeyword GeometryTypeExp

	GeometryCollectionExp = GeometrySyntaxExp<GeometryCollectionText, geometryCollectionKeyword>
    GeometryCollectionText = emptySet --empty
        | LeftParen ListOf<GeometryExp, Comma> RightParen --present
    geometryCollectionKeyword = caseInsensitive<"GEOMETRYCOLLECTION">

	GeometryExp =  
        | PointExp
        | MultiPointExp
       	| LineStringExp
        | MultiLineStringExp
        | PolygonExp
        | MultiPolygonExp
    	| GeometryCollectionExp 

    // TODO -- support POLYHEDRALSURFACE geometry
 	//PolyhedralSurfaceExp = GeometrySyntaxExp<PolyhedralSurfaceText, polyhedralSurfaceKeyword>
    //PolyhedralSurfaceText = emptySet --empty
    //    | LeftParen NonemptyListOf<PolygonText, Comma> RightParen --present
    //polyhedralSurfaceKeyword = caseInsensitive<"PolyhedralSurface">
    
	MultiPolygonExp = GeometrySyntaxExp<MultiPolygonText, multiPolygonKeyword>
    MultiPolygonText = emptySet --empty
        | LeftParen NonemptyListOf<PolygonText, Comma> RightParen --present
    multiPolygonKeyword = caseInsensitive<"MULTIPOLYGON">
    
	PolygonExp = GeometrySyntaxExp<PolygonText, polygonKeyword>
    PolygonText = emptySet --empty
        | LeftParen NonemptyListOf<LineStringText, Comma> RightParen --present
    polygonKeyword = caseInsensitive<"POLYGON">

	MultiLineStringExp = GeometrySyntaxExp<MultiLineStringText, multiLineStringKeyword>
    MultiLineStringText = emptySet --empty
        | LeftParen NonemptyListOf<LineStringText, Comma> RightParen --present
    multiLineStringKeyword = caseInsensitive<"MULTILINESTRING">
    
	LineStringExp = GeometrySyntaxExp<LineStringText, lineStringKeyword>
    LineStringText = emptySet --empty
        | LeftParen PointList RightParen --present
    lineStringKeyword = caseInsensitive<"LINESTRING">
    
	MultiPointExp = GeometrySyntaxExp<MultiPointText, multiPointKeyword>
    MultiPointText = emptySet --empty
        | LeftParen PointList RightParen --present
    multiPointKeyword = caseInsensitive<"MULTIPOINT">

	// Base point type helpers
    PointList = NonemptyListOf<PointListArgument, Comma>
    PointListArgument = Point | ComputedValue<PointExp>
    PointExp = Arithmetic<PointArithmetic>
    PointArithmetic = PointPrimitive | ComputedExp
	PointPrimitive = PointTaggedText | PointText | Point
    PointTaggedText = pointKeyword PointText
    PointText = emptySet --empty
        | LeftParen Point RightParen --present
    Point = X Y
   	pointKeyword = caseInsensitive<"POINT">
    
    // Keywords
    keyword = geometryKeyword
        | functionKeyword
        | generateKeyword
        | booleanValue
        | ifKeyword
        | thenKeyword
        | elseKeyword
    geometryKeyword = pointKeyword
        | multiPointKeyword
    	| lineStringKeyword
    	| multiLineStringKeyword
        | polygonKeyword
	    | multiPolygonKeyword
        | geometryCollectionKeyword

    // Coordinate values
    X = PointNumberValue 
    Y = PointNumberValue 
    Z = PointNumberValue
    M = PointNumberValue

    // Numeric value
	PointNumberValue = signedNumericLiteral
    	| ComputedPrimitive
    	| LeftParen ComputedValue<NumberExp> RightParen --expression
    NumberExp = Arithmetic<ComputedValue<signedNumericLiteral>>

	// Boolean value
    BooleanValue = ComputedValue<booleanValue>
    booleanValue = caseInsensitive<"true"> | caseInsensitive<"false">

    // OGC specification primitives
    quotedName = doubleQuote name doubleQuote
    name = letters
    letters = wktLetter+
    wktLetter = simpleLatinLetter | digit | special
    simpleLatinLetter = simpleLatinUpperCaseLetter
        | simpleLatinLowerCaseLetter
    signedNumericLiteral = sign unsignedNumericLiteral --signPresent
        | unsignedNumericLiteral --signMissing
    unsignedNumericLiteral = exactNumericLiteral | approximateNumericLiteral
    approximateNumericLiteral = mantissa "E" exponent   // TODO -- handle this notation at higher level expressions
    mantissa = exactNumericLiteral
    exponent = signedInteger
    exactNumericLiteral = unsignedInteger decimalPoint unsignedInteger --decimalWithWholeNumber
        | decimalPoint unsignedInteger --decimalWithoutWholeNumber 
        | unsignedInteger --wholeNumber
    signedInteger = sign unsignedInteger --signedInteger
        | unsignedInteger --unsignedInteger
    unsignedInteger = digit+
    leftDelimiter = leftParen | leftBracket
    rightDelimiter = rightParen | rightBracket
    special = rightParen | leftParen | minusSign | underscore | period | quote | wktSpace
    sign = plusSign | minusSign
    decimalPoint = period // comma // TODO -- comma causes parsing issues
    emptySet = "EMPTY"
    minusSign = "-"
    LeftParen = leftParen
    leftParen = "("
    RightParen = rightParen
    rightParen = ")"
    leftBracket = "["
    rightBracket = "]"
    LeftBrace = leftBrace
    leftBrace = "{"
    RightBrace = rightBrace
    rightBrace = "}"
    period = "."
    plusSign = "+"
    doubleQuote = "\""
    quote = "'"
    Comma = comma
    comma = ","
    underscore = "_" 
    // digit = 0|1|2|3|4|5|6|7|8|9 // provided by default
    simpleLatinLowerCaseLetter = lower // a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z
    simpleLatinUpperCaseLetter = upper // A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z
    wktSpace = " " // unicode "U+0020" (space) // provided by default
}
`