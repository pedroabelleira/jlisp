import { run, runWithoutIncludes } from "../interpreter";
import { debug } from "../debug";
import { assertRun, assertRunError, runSuite } from "./testing";
import { RAW_NIL, RAW_TRUE, RAW_FALSE } from "../tokenizer";


export const MACRO_TESTS: () => void = () => { runSuite(() => {

assertRun('(define val 2)', "");
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
`, '0');

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
    ;;; Check that quote / unquote works correctly 
    (unquote (quote (= 1 1))
`, RAW_TRUE);

assertRun(`
    ;;; Check that quote / unquote works correctly (2)
    (define a 10)
    (unquote (quote (set! a 1)))
    (+ a 2)
`, 3);

assertRun(`
    ;;; Check that quote / unquote works correctly (3)
    (unquote (quote (def a 1)))
    (+ a 2)
`, 3);

assertRun(`
    ;;; Check that quote / unquote works correctly (3)
    (unquote (quote (def a 1)))
    (+ a 2)
`, 3);

assertRun(`
    ;;; Check that quote / eval works correctly (4)
    (def a 1)
    (+ (eval (quote a)) 2)
`, "3");

assertRun(`
    ;;; Check that quote / unquote works correctly (4)
    (def a 1)
    (+ (eval (quote a)) 2)
`, "3");


// */

///////////////////////////////////////////////////////////////////////
// These don't work yet
///////////////////////////////////////////////////////////////////////

// assertRun(`
//     ;;; Check that defmacro allows for basic macros with 1 argument 
//     (defmacro nil! (var)
//         ((quote set!) var 3)
//         ;;(list (quote set!) var 3)
//     )
//     (define a 10)
//     (nil! a)
//     (= a 3)
// `, RAW_TRUE);

// assertRunError(`
//     ;;; Check that defmacro allows for basic macros with 1 argument 
//     (defmacro nil! (var)
//         ((quote set!) var 3)
//     )
//     (define a 10)
//     (nil! a)
//     (= a 123)
// `, "symbol 'a' not found");

// assertRun(`
//     ;;; Check that defmacro allows for basic macro aliasing 
//     (defmacro setq (a b)
//         (list (quote set!) a b)
//     )
//     (def x 1)
//     (setq x 2)
//     (= x 2)
// `, RAW_TRUE);

// assertRun(`
//     ;;; Check that defmacro allows for basic macros returning a value 
//     (defmacro isnil? (var)
//         ((quote list) (quote =) (quote var) (quote nil))
//     )
//     (isnil? a)
// `, RAW_TRUE);

// assertRun(`
//     ;;; Check that defmacro allows for macro aliasing 
//     (defmacro mymacro (a b)
//         ((quote +) a b)
//     )
//     (mymacro 30 12)
// `, 42);

// assertRun(`
//     ;;; Check that defmacro allows for simple creation of macros
//     (defmacro mymacro (a b)
//         (list + a b)
//     )
//     (mymacro 30 12)
// `, 42);

// assertRun(`
//     ;;; Check that cons works correctly (2)

//     (defn str (strings)
//         (def tok (car strings))
//         (if (> (strlen tok) 0) 
//             (concat tok (str (cdr strings)))    
//             ""
//         )
//     )

//     (set! a (cons 1 (list 2 3)))
//     (set! b (car (cdr a)))
//     (+ b 0)
// `, "2");

// assertRun(`
//     ;;; Check that str can be defined in lisp 

//     (defn str (strings)
//         (def tok (car (list strings)))
//         (if (> (strlen tok) 0) 
//             (concat tok (str (cdr strings)))    
//             ""
//         )
//     )

//     (print "***********")
//     (print (str "Hi" " there!"))
//     (= "Hello" (str "He" "llo"))

// `, TRUE);

// assertRun(`
//     ;;; Check that str->list works correctly 
//     (car (str->list "Hello"))
// `, 'H');

// assertRun(`
//     ;;; Check that defmacro works correctly for plain (not containing macro) expressions
//     (defmacro eight () (+ 4 4))
//     (+ 0 (eight))
// `, "8");

// assertRun(`
//     ;;; Check that defmacro works correctly for quoted basic expressions 
//     (defmacro eight () (quote (+ 4 4)))
//     (eight)
// `, "8");

// assertRun(`
//     ;;; Check that defmacro works correctly for quoted basic expressions 
//     (defmacro eight () (quote (+ 4 4)))
//     (eight)
// `, "8");

// assertRun(`
//     ;;; Check that defmacro works correctly for quoted basic expressions 
//     (defmacro unless (test body) 
//         (begin
//             (print "******")
//             (print body)
//             (print "******")
//             (def first (car body))
//             (def second (car (cdr body)))
//             (if (test) first second)
//         )
//     )
//     (unless (= 1 0) 5 0)
// `, "5");

// assertRun(`
//     ;;; Check that defmacro can be used for alias
//     (defmacro mydef (test body) 
//         (define test body)
//     )
//     (mydef a 10)
//     (+ a 0) 
// `, "5");

///////////////////////////////
});}

declare var module
if (!module.parent) {
    MACRO_TESTS();
}