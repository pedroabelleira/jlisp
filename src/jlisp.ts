import { run } from "./interpreter";

declare function require(string): any;
const fs = require('fs');
const readline = require('readline-sync');

declare var process;
const program: string = fs.readFileSync(process.argv[2], 'UTF-8');

if (!program || program.trim().length == 0) throw "Program not found";

run(program);
