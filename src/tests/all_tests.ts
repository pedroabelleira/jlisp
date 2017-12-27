import { runSuite } from "./testing";
import { TOKENIZER_TESTS } from "./tokenizer_tests";
import { PARSER_TESTS } from "./parser_tests";
import { BASIC_TESTS } from "./basic_tests";
import { FUNCTION_TESTS } from "./function_tests";
import { MACRO_TESTS } from "./macro_tests";


runSuite(() => {
    TOKENIZER_TESTS(),
    PARSER_TESTS(),
    BASIC_TESTS();
    FUNCTION_TESTS();
    MACRO_TESTS();
});