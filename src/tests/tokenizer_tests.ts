import { run, runWithoutIncludes } from "../interpreter";
import { assertEquals, runSuite } from "./testing";
import { debug } from "../debug";
import { tokenize, tokenToString } from "../tokenizer";



export const TOKENIZER_TESTS: () => void = () => { runSuite(() => {

assertEquals(() => tokenize("(= 1 1)").length, 5);
assertEquals(() => tokenToString(tokenize("(= 1 1)")[3]), 1);
assertEquals(() => tokenToString(tokenize("(= 1 1)")[1]), '=');
assertEquals(() => tokenize("'(= 1 1)").length, 6);
assertEquals(() => tokenize("(= '1 1)").length, 6);
assertEquals(() => tokenize("(= `1 1)").length, 6);
assertEquals(() => tokenize("(= `1 ,1)").length, 7);
assertEquals(() => tokenize("(= `1 ,@1)").length, 7);

});}

declare var module
if (!module.parent) {
    TOKENIZER_TESTS();
}