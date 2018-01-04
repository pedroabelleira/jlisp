import { run, runWithoutIncludes } from "../interpreter";
import { debug } from "../debug";
import { assertRun, assertRunError, runSuite } from "./testing";
import { RAW_NIL, RAW_TRUE, RAW_FALSE } from "../tokenizer";


export const MACRO_TESTS: () => void = () => { runSuite(() => {

//*
assertRun('(define val 2)', "2");
assertRun('(define val 2) (+ val 1)', 3);
assertRun('(define val (+ 1 1)) (+ val 1)', 3);
assertRun('(+ (if (= 1 0) (+ 5 5) (+ 8 8)) 0)', 16);
assertRun('(+ (if (= 1 1) (+ 5 5) (+ 8 8)) 0)', 10);
assertRun('(define myvalue 15) (+ (if (= 15 myvalue) 10 (+ 8 8)) 0)', 10);

assertRun(`
    ;;; Check that def works and defined symbols can be used in subexpressions
    (define myvalue 15) 
    (+ 
        (if (= 15 myvalue) 
            10 
            (+ 8 8)) 
        0
    )
`, 10);

assertRun(`
    ;;; Check that 'if' macro only evaluates the expressions it needs
    (define foobar 1)
    (if (= 1 1) 0 (set! foobar 99))
    (+ foobar 0)
`, 1);

assertRun('(eval (read-string "(+ 2 1)"))', 3);

assertRunError(`(lambda ("a" b) (+ a b))`, "must be variable names");

assertRun(`
    ;;; Check that lambdas can be assigned to variables and that those work
    (define sum 
        (lambda (a b)
            (+ a b)))
    (sum 2 3)
`, 5);

assertRun(`
    ;;; Check that operator defn works
    (defn sum (a b) (+ a b))
    (sum 2 2)
`, '4');

assertRun(`
    ;;; Check that operator defn works (2)
    (defn sum (a b) (+ a (+ 0 b)))
    (sum 2 2)
`, '4');

assertRun(`
    ;;; Check that 'begin' macro works 
    (begin
        (+ 1 1)
        (- 1 1)
    )
`, 0); // Changed the convention again. Begin now returns last evaluated expression 

assertRun(`
    ;;; Check that 'begin' macro works with macros
    (define a 10)
    (begin
        (set! a (- a 1))
        (set! a (- a 1))
    )
    (+ a 0)
`, '8');

assertRun(`
    ;;; Check that 'set!' macro works 
    (define a 10)
    (set! a 5)
    (+ a 0)
`, '5');

assertRun(`
    ;;; Check that 'set!' macro works (2)
    (define a 10)
    (set! a (- a 1))
    (+ a 0)
`, '9');

assertRun(`
    ;;; Check that 'while' macro works 
    ;;; Note that this implementation of Lisp has lexical variable scope, therefore the unexpected result
    (define a 10)
    (while (> a 0)
        (begin
            (set! a (- a 1))
        )
    )
    (+ a 0)
`, '0');

assertRunError(`
    ;;; Check that 'car' works correctly 
    (car (2 3 4 5))
`, 'Item is not a function');

assertRun(`
    ;;; Check that 'car' works correctly (2)
    (car (list 2 3 4 5))
`, '2');

assertRun(`
    ;;; Check that cons works correctly
    (car (cons 45 (list 2 3 4 5)))
`, '45');

assertRun(`
    ;;; Check that defn can be defined with a macro 

    (defmacro testdefun (name vars body)
        (list (quote define) name 
            (list (quote lambda)
                vars 
                body
            )
        )
    )

    (testdefun sum (a b) (+ a b))
    (sum 1 2)
`, 3);


assertRun(`
    ;;; Check that defn can be defined with a macro with quotes syntax

    (defmacro testdefun (name vars body)
        \`(define ,name 
            (lambda
                ,vars 
                ,body
            )
        )
    )

    (testdefun sum (a b) (+ a b))
    (sum 1 2)
`, 3);

assertRun(`
    ;;; Check that defmacro allows for basic macros with quote syntax 
    (defmacro nil! (variable)
        \`(set! ,variable 3)
    )
    (define a 10)
    (nil! a)
    (+ a 0)
`, 3);

// assertRun(`
//     ;;; Check that defmacro allows for simple creation of macros
//     (defmacro mymacro (a b)
//         (+ a b)
//     )
//     (mymacro 30 12)
// `, 42);

// assertRun(`
//     ;;; Check that defmacro works correctly for plain (not containing macro) expressions
//     (defmacro eight () (+ 4 4))
//     (+ 0 (eight))
// `, "8");

assertRun(`
    ;;; Check that defmacro works correctly for quoted basic expressions 
    (defmacro eight () (quote (+ 4 4)))
    (eight)
`, "8");


assertRun(`
    ;;; Check that defmacro works correctly for quoted basic expressions 
    (defmacro unless (test arg1 arg2) 
        \`(if (not ,test) ,arg1 ,arg2)
    )
    (unless (= 1 0) 5 0)
`, "5");

assertRun(`
    ;;; Check that defmacro can be used for alias
    (defmacro myset! set!)
    (myset! a 5) 
    (+ a 0)
`, "5");

assertRun(`
    ;;; Check that 'native' works (1)
    (native "1 + 1")
`, 2);

assertRun(`
    ;;; Check that 'native' works (2)
    (define a 1)
    (native "a + 1" a)
`, 2);


assertRun(`
    ;;; Check that 'native' works (1)
    (defn sum (a b)
        (native "a + b" a b)
    )
    (sum 1 2)
`, 3);


assertRun(`
    (defn strleen (s)
        (native "s? s.length: 0" s)
    )
    (strleen "abc")
`, 3);


assertRun(`
    ;;; Check that 'try' works (1)
    (try
        (+ 1 ff)
        20
    )
`, 20);

assertRun(`
    ;;; Check that 'try' works (2)
    (try
        (+ 1 1)
        20
    )
`, 2);

assertRunError(`
    ;;; Check that 'throw' works (1)
    (throw "My error message")
`, "My error message");

assertRun(`
    ;;; Check that 'try'-'catch' works 
    (defn assert_positive (a) 
        (if (>= a 0) 
            true
            (throw "Number is negative")
        )
    )
    (assert_positive 5)
`, RAW_TRUE);

assertRunError(`
    ;;; Check that 'try'-'catch' works 
    (defn assert_positive (a) 
        (if (>= a 0) 
            true
            (throw "Number is negative")
        )
    )
    (assert_positive (- 0 1))
`, "Number is negative");

assertRun(`
    ;;; Check that variable desctructuring works in Lambda   
    (defn slice (a b & rest)
        (len rest))
    (slice 0 1 2 3)
`, "2");

assertRun(`
    ;;; Check that variable desctructuring works in Lambda   
    (defn slice (& rest)
        (len rest))
    (slice 0 1 2 3)
`, "4");

// */


});}
declare var module
if (!module.parent) {
    MACRO_TESTS();
}