import { run } from "./interpreter";

declare function require(string): any;
const fs = require('fs');
const readline = require('readline-sync');

const program = fs.readFileSync('../src/repl.lisp', 'UTF-8');

run(program);
