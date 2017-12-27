import { run, runWithoutIncludes } from "../interpreter";
import { NIL, TRUE, FALSE } from "../parser";
import { debug } from "../debug";
import { assertRun, assertRunError, runSuite } from "./testing";
import { RAW_FALSE, RAW_NIL } from "../tokenizer";

export const FUNCTION_TESTS: () => void = () => { runSuite(() => {

assertRun("(= 1 0)", RAW_FALSE);
assertRun("(+ 1 0)", 1);
assertRun("(+ 2 2)", 4);
assertRun("(- 2 2)", 0);
assertRun("(/ 2 2)", 1);
assertRun("(* 2 2 2)", 8);
assertRun("(+ 1 1 (+ 1 1))", 4);
assertRun('(concat "A" "B")', '"AB"');
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

assertRunError(`(lambda ("a" b) (+ a b))`, "must be variable names");

assertRun(`
    ;;; Check that lambdas work
    ( (lambda (a b) (+ a b)) 3 5 )
`, 8);

assertRun(`
    ;;; Check that lambdas use internal variables 
    (define a 20)
    (define b 20)
    ( (lambda (a b) (+ a b)) 3 5 )
`, 8);

assertRun(`
    ;;; Check that lambdas can be assigned to variables and that those work
    (define sum 
        (lambda (a b)
            (+ a b)))
    (sum 2 3)
`, 5);

assertRun(`
    ;;; Check that operator alias works
    (define sum +)
    (sum 2 2)
`, '4');

assertRun(`
    ;;; Check that operator alias works (2)
    (define + -)
    (if (= (- 3 2) (+ 3 2)) 1 0)
`, "1");


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
    ;;; Check that builin functions can be overwritten 
    (defn print () 1)
    (print "Hello, World!" 3.45 "Foo")
    (print "Second line" (concat "I " "rock!"))
    (print (+ 2 2))
`, '1');

assertRun(`
    ;;; Check that operator alias works and that old operators are kept
    (define sum +)
    (define + -)
    (if (= (sum 3 2) (+ 3 2)) 1 0)
`, '0');

assertRun(`
    ;;; Checks that strlen works
    (strlen "Hello")
`, 5);

assertRun(`
    ;;; Checks that strlen works
    (strlen "")
`, 0);

assertRunError(`
    ;;; Checks that strlen works
    (strlen 3)
`, "takes 1 string argument"); 

assertRun(`
    ;;; Check that the factorial program works 
    (define factorial 
        (lambda (n) 
            (if (= 1 n) 
                1
                (* n (factorial (- n 1)) ) 
            )
        )
    )
    (factorial 5)
`, '120');

assertRun(`
    ;;; Check that the fibonacci program works 
    (define fib (lambda (n)
    (if (< n 2) n (+ (fib (- n 1))
                    (fib (- n 2))))))
    (fib 9)
`, '34');

assertRun(`
    ;;; Check that the factorial program works defined as defn
    (defn factorial (n) 
        (if (= 1 n) 
            1
            (* n (factorial (- n 1) ))
        )
    )
    (factorial 5)
`, '120');

assertRun(`
    ;;; Check that str->list works correctly 
    (car (cdr (str->list "Hello")))
`, '"e"');

////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////
// These don't work yet
///////////////////////////////////////////////////////////////////////

// assertRun(`
//     ;;; Check that str can be defined in lisp 

//     (defn str (strings)
//         (def tok (car (list strings)))
//         (if (> (strlen tok) 0) 
//             (concat tok (str (cdr strings)))    
//             ""
//         )
//     )

// ;;     (print "***********")
// ;;     (print (str "Hi" " there!"))
//     (= "Hello" (str "He" "llo"))

// `, TRUE);



});}

declare var module
if (!module.parent) {
    FUNCTION_TESTS();
}