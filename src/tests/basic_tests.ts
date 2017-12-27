import { run } from "../interpreter";
import { TRUE, FALSE, NIL} from '../parser';
import { debug } from "../debug";
import { assertRun, assertRunError, runSuite } from "./testing";
import { RAW_TRUE, RAW_FALSE } from "../tokenizer";


export const BASIC_TESTS: () => void = () => { runSuite(() => {

assertRun("(= 1 0)", RAW_FALSE);
assertRun("(not (= 1 0))", RAW_TRUE);
assertRun("(!= 1 0))", RAW_TRUE);
assertRun("(= 1 1)", RAW_TRUE);
assertRun("(>= 1 1)", RAW_TRUE);
assertRun("(or true false)", RAW_TRUE);
assertRun("(or false true)", RAW_TRUE);
assertRun("(or true true)", RAW_TRUE);
assertRun("(or false false)", RAW_FALSE);
assertRun("(and true false)", RAW_FALSE);
assertRun("(and false true)", RAW_FALSE);
assertRun("(and true true)", RAW_TRUE);
assertRun("(and false false)", RAW_FALSE);
assertRun("(<= 1 1)", RAW_TRUE);
assertRun("(< 1 0)", RAW_FALSE);
assertRun("(> 1 0)", RAW_TRUE);
assertRun("(+ 1 0)", 1);
assertRun("(+ 2 2)", 4);
assertRun("(- 2 2)", 0);
assertRun("(/ 2 2)", 1);
assertRun("(* 2 2 2)", 8);
assertRun("(+ 1 1 (+ 1 1))", 4);

// assertRun(`
//     ; Check that comments work
//     (+ 5 5)
// `, 10);

});}

declare var module
if (!module.parent) {
    BASIC_TESTS();
}