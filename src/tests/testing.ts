import { run, runWithoutIncludes } from "../interpreter";
import { TRUE, FALSE, NIL } from "../parser";
import { debug } from "../debug";

let testsRun = 0;
let testsOK = 0;
let testsFail = 0;
let IN_SUITE = false;

export function runSuite(suite: () => void) {
    let outerSuite = !IN_SUITE;
    let start;

    if (outerSuite) {
        console.log('');
        console.log('Running tests...');
        start = new Date().getTime();
        IN_SUITE = true;
    }

    suite();

    if (outerSuite) {
        let end = new Date().getTime();
        IN_SUITE = true;
        console.log(`Tests run: ${testsRun}. OK: ${testsOK}. Fail: ${testsFail} (${end - start} milliseconds)`);
        console.log('');
        IN_SUITE = false;
    }
}

export function assertRun(program: string, result: any, runWithIncludes = true) {
    debug("Starting test: -----------------\n" + program + '\n--------------------------------\n');
    testsRun++;
    let ret;
    try {
        if (runWithIncludes) {
            ret = run(program);
        } else {
            ret = runWithoutIncludes(program);
        }
    } catch (ex) {
        testsFail++;
        console.log("Exception running program " + program);
        console.log("Exception message: " + ex + '\n\n');
        return;
    }
    if (ret != result) {
        testsFail++;
        console.log("Error running program " + program);
        console.log(`Expected: ${result}. Got '${JSON.stringify(ret)}' instead\n\n`);
        return;
    }
    debug("\nFinishing test--------------------\n\n");
    testsOK++;
}

export function assertRunError(program: string, errorMsg: string) {
    debug("Starting test: -----------------\n" + program + '\n--------------------------------\n');
    testsRun++;
    try {
        run(program);
    } catch (ex) {
        if (("" + ex).indexOf(errorMsg) >= 0) {
            testsOK++;
            debug("\nFinishing test--------------------\n\n");
        } else {
            console.log("Error running program " + program);
            console.log("Expected exception containing '" + errorMsg + "', but exception was '" + ex + "'\n\n");
            testsFail++;
        }
        return;
    }
    console.log("Error running program " + program);
    console.log("Expected exception containing '" + errorMsg + "', but no exception was thrown");
    testsFail++;
}

function assert(condition: boolean, msg?: string) {
    if (condition) return;
    throw "Assertion failed: " + msg;
}

export function assertEquals(test: () => any, result: any, name: string = "(anon test)") {
    debug("Starting test: -----------------\n" + name + '\n--------------------------------\n');
    testsRun++;
    let ret;
    try {
        ret = test();
    } catch (ex) {
        testsFail++;
        console.log("Exception running test" + name);
        console.log("Exception message: " + ex + '\n\n');
        return;
    }
    if (ret != result) {
        testsFail++;
        console.log("Error running program " + name) ;
        console.log(`Expected: ${result}. Got '${JSON.stringify(ret)}' instead\n\n`);
        return;
    }
    debug("\nFinishing test--------------------\n\n");
    testsOK++;
}

export function assertError(body: () => any, errorMsg: string, name: string) {
    debug("Starting test: -----------------\n" + name + '\n--------------------------------\n');
    testsRun++;
    try {
        body();
    } catch (ex) {
        if (ex.indexOf(errorMsg) < 0) {
            console.log("Error running test " + name) ;
            console.log(`Expected: ${errorMsg}. Got '${ex}' instead\n\n`);
            testsFail++;
            return;
        }
    }
    testsOK++;
    debug("\nFinishing test--------------------\n\n");
}