import { run, runWithoutIncludes } from "../interpreter";
import { itemToString } from '../functions';
import { assertEquals, runSuite } from "./testing";
import { debug } from "../debug";
import { parse } from "../parser";



export const PARSER_TESTS: () => void = () => { runSuite(() => {


let progs = [
    "(= 1 1)",
    "(map + (list 1 2 3))",
    "(if (cond) true false)",
    "(begin (define myvalue 15) (+ (if (= 15 myvalue) 10 (+ 8 8)) 0))",
    `(begin (define factorial (lambda (n) (if (= 1 n) 1 (* n (factorial (- n 1)))))) (factorial 5))`
]; 

progs.forEach(p => assertEquals(() => itemToString(parse(p)[0]), p));

});}

declare var module
if (!module.parent) {
    PARSER_TESTS();
}