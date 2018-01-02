import { Item, Types, FunctionType, parse, NIL, createList } from "./parser";
import { LISP_FUNCTIONS, NATIVE_FUNCTIONS, itemToString, itemsToString } from "./functions";
import { NATIVE_MACROS, LISP_MACROS } from "./macros";
import { debug } from "./debug";

export function run(program: string): string {
    let macros = parse(LISP_MACROS);
    let functions = parse(LISP_FUNCTIONS); 
    let parsedProgram = [...macros, ...functions, ...parse(program)]
    
    return runParsed(parsedProgram);
}

export function runWithoutIncludes(program: string): string {
    return runParsed(parse(program));
}

function runParsed(program: Item[]): string {
    let env:IEnvironment = new Environment(); 

    // console.log(`[Program] Call to expand macros: \nBefore expansion: \n\n${itemsToString(program)}\n\n`);
    program = program.map(it => expandMacros(it, env)).filter(it => it && it != NIL); // First we expand macros
    // console.log(`[Program] Call to expand macros: \nAfter expansion: \n\n${itemsToString(program)}\n\n`);
    return program.reduce((acc, next) => itemToString (evalItem(next, env)), "");
}

let evalLevel = 0;
export function evalItem(item: Item, env: IEnvironment): Item {
    expandLevel++;
    let sItem = itemToString(item);
    let trace = false;

    let ret: any;

    if (!item) return NIL; 

    switch (item.type) {
        case Types.NUMBER: 
        case Types.STRING: 
        case Types.FUNCTION: 
        case Types.BOOLEAN: 
        case Types.NIL:
            ret = item;
            break;
        case Types.SYMBOL:
            let variable = evalItem(env.findVariable(item.name), env);
            if (!variable || variable.type == Types.NIL) throw `Interpreter error: symbol '${item.name}' not found (line ${item.line})`;
            ret = variable;
            break;
        case Types.LIST:
            trace = true;
            // console.log("Evaluating list. List items: " + itemToString(item) + "\n");
            let [macro, ...foo] = item.items;
            if (macro.type == Types.SYMBOL) {
                if (env.findMacro(macro.name)) {
                    return item; // If there is a macro, then we are in an expanding phase and we leave 
                                 // macros as they are. Hopefully somebody will expand them later...
                                 // In particular, this prevents us into entring 'quote'd expressions
                }
            }
            let [func, ...args] = item.items.map(it => evalItem(it, env));

            if (func.type != Types.FUNCTION) {
                throw "Interpreter error in line " + func.line + ". Item is not a function (" + func.type + ")";
            }
            
            ret = func.call(args, env);
            break;
    }
    // trace && console.log(`[${expandLevel}] Call to evalItem: \n\tbefore evaluation: '${sItem}'`);
    // trace &&console.log(`\tafter evaluation: '${itemToString(ret)}'`);
    expandLevel--;  
    return ret;
}

let expandLevel = 0;
export function expandMacros(item: Item, env: IEnvironment): Item {
    // return _expandMacros(item, env);
    expandLevel++;
    let sItem = itemToString(item);
    try {
        // console.log(`[${expandLevel}] Call to expand macros: \n\tbefore expansion: '${sItem}'`);
        let ret = _expandMacros(item, env);
        // console.log(`\tafter expansion: '${itemToString(ret)}'\n`);
        expandLevel--;
        return ret;
    } catch (ex) {
        // console.log(`\texception in expansion: ${ex}\n`);
        expandLevel--;
        throw ex;
    }
}

export function _expandMacros(item: Item, env: IEnvironment): Item {
    if (!item) {return NIL} // shouldn't happen, but hey...

    let ret: Item;

    let macro: IMacro;
    switch (item.type) {
        case Types.NUMBER: case Types.STRING: case Types.SYMBOL: case Types.FUNCTION: case Types.BOOLEAN: case Types.NIL:
            return item;
        case Types.LIST:
            if (!item || !item.items || item.items.length == 0) return NIL;
            item.items = item.items.filter(t => t && t.type != Types.NIL);
            let [macro, ...args] = item.items;
            if (!macro) return NIL; // Empty list 
            if (macro.type != Types.SYMBOL) {
                item.items = item.items.map(it => expandMacros(it, env));
                return item; // We only need to expand symbols, so we are done
            }
            let foundMacro = env.findMacro(macro.name);
            if (!foundMacro) { // It wasn't a macro
                item.items = item.items.map(it => expandMacros(it, env));
                return item;
            }
            // console.log("Macro found: " + macro.name);
            item = foundMacro.expand(args, env);
            return item;
    }
}

export interface INamedFunction {
    name: string,
    function: FunctionType;
}

export interface IMacro {
    name: string;
    expand: (tokens: Item[], env: IEnvironment) => Item;
}

export interface IEnvironment {
    addMacro(m: IMacro): void; 
    findMacro(name: string): IMacro;
    addVariable(name: string, item: Item): void;
    setVariable(name: string, item: Item): void;
    findVariable(name: string): Item;
    createNestedEnvironment(): IEnvironment;
}


class Environment implements IEnvironment {
    private ownSymbols: {} = {};
    private macros: {} = {};

    constructor(private parent?: IEnvironment) { 
        if (!parent) {
            NATIVE_FUNCTIONS.forEach(f => this.addVariable(f.name, f.function));
            NATIVE_MACROS.forEach(m => this.addMacro(new m()));
        }
    }

    addMacro(m: IMacro): void {
        if (this.parent) {
            this.parent.addMacro(m);
            return;
        }
        this.macros[m.name] = m;
    }

    findMacro(name: string): IMacro {
        if (this.parent) {
            return this.parent.findMacro(name);
        }
        return this.macros[name];
    }

    addVariable(name: string, item: Item): void {
        this.ownSymbols[name] = item;
    }

    setVariable(name: string, item: Item): void {
        let variable: Item = this.ownSymbols[name];
        if (variable || !this.parent || !this.parent.findVariable(name)) {
            this.ownSymbols[name] = item;
            return;
        }
        this.parent.setVariable(name, item);
    }

    findVariable(name: string): Item {
        let ret: Item = this.ownSymbols[name];
        if (!ret && this.parent) {
            ret = this.parent.findVariable(name);
        }
        return ret ;
    }

    createNestedEnvironment(): IEnvironment {
        return new Environment(this); 
    }
}