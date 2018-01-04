import { INamedFunction, IEnvironment, expandMacros, evalItem } from "./interpreter";
import { Item, Types, NIL, TRUE, FALSE, QUASIQUOTE, createFunction, createString, createNumber, createList, createSymbol, UNQUOTE, UNQUOTE_AT, StringType, SymbolType, ListType, FunctionType } from "./parser";
import { RAW_NIL, RAW_TRUE, RAW_FALSE} from "./tokenizer";

declare function require(string): any;
const readline = require('readline-sync');

export function itemToString(item: Item, prettyPrint = false): string {
    if (!item) return "";

    switch (item.type) {
        case Types.BOOLEAN: return item.cond? RAW_TRUE: RAW_FALSE;
        case Types.STRING: return `"${item.str}"`;
        case Types.NUMBER: return `${item.num}`;
        case Types.NIL: return RAW_NIL;
        case Types.FUNCTION: 
            if (item.id) {
                return `#<Function '${item.id}'>`;
            } else {
                return '#<Function (native)>';
            }
        case Types.SYMBOL: return item.name;
        case Types.LIST:
            return item.items.reduce((acc, next, index) => {
                if (index != 0) {
                    acc = acc + ' ';
                }
                return acc + itemToString(next);
            }, '(') + ')';
    }
}

function stripOuterQuotes(s: string) {
    s = s.trim();
    if (s.charAt(0) == '"') s = s.substring(1, s.length - 1);
    if (s.charAt(s.length - 1) == '"') s = s.substring(0, s.length - 2);
    return s;
}

export function itemsToString(items: Item[], prettyPrint = false): string {
    if (!items) return "";
    return items.reduce((acc, next, index) => acc + (index != 0? '\n': '') + itemToString(next), "");

}

export function createNamedFunction(name: string, call: (items: Item[], env: IEnvironment) => Item): INamedFunction {
    return {
        name: name,
        function: createFunction(call)
    };
}

export const PrintFunction: INamedFunction = createNamedFunction('print', (args: Item[]): Item => {
    if (args.length == 1) {
        console.log(stripOuterQuotes(itemToString(args[0])));
    } else {
        console.log(stripOuterQuotes(itemsToString(args)));
    }
    return NIL;
});

export const ReadFunction: INamedFunction = createNamedFunction('read', (args: Item[]): Item => {
    if (args.length >= 1) {
        return createString(readline.question(stripOuterQuotes(itemToString(args[0])))); 
    } else {
        return createString(readline.question("")); 
    }
});

export const MapFunction: INamedFunction = createNamedFunction('map', (args: Item[], env: IEnvironment): Item => {
    if (!args || args.length < 2 || args[0].type != Types.FUNCTION || args[1].type != Types.LIST) {
        throw "[map] function takes 2 arguments: a function and a list";
    } 
    let func = (<FunctionType> args[0]).call;
    let ret = (<ListType>args[1]).items.map(el => func([el], env));
    return createList([...ret]); 
});

export const ReduceFunction: INamedFunction = createNamedFunction('reduce', (args: Item[], env: IEnvironment): Item => {
    if (!args || args.length < 2 || args[0].type != Types.FUNCTION || args[1].type != Types.LIST) {
        throw "[reduce] function takes 2 required arguments: a function and a list and one optional argument: an initial value";
    } 
    let reducer = (<FunctionType> args[0]).call;
    let list = (<ListType> args[1]).items;
    let initial = args[2]? args[2]: NIL;
    let ret = list.reduce((acc, next) => reducer([acc, next], env), args[2]);
    return ret; 
});

export const ConcatFunction: INamedFunction = createNamedFunction('concat', (args: Item[]): Item => {
    if (!args || args.length < 1) throw "[concat] function takes at least 1 argument";
    if (!args.reduce((acc, next) => acc && next.type == Types.STRING, true)) {
        throw "[concat] function needs to be called with arguments of type string";
    }
    return createString(args.reduce((acc, next) => acc + next['str'], ""));
});

export const CarFunction: INamedFunction = createNamedFunction('car', (args: Item[]): Item => {
    if (!args || args[0].type != Types.LIST) {
        throw "[car] function takes 1 list argument";
    }
    return args[0]["items"][0];
});

export const CdrFunction: INamedFunction = createNamedFunction('cdr', (args: Item[]): Item => {
    let arg = args[0];
    if (!arg || args.length > 1 || arg.type != Types.LIST) {
        throw "[cdr] function takes 1 list argument";
    }
    let [foo, ...ret] = arg.items;

    return createList(ret);
});

export const ConsFunction: INamedFunction = createNamedFunction('cons', (args: Item[]): Item => {
    if (!args) {
        throw "[cons] function takes 2 arguments, of which the second must be a list";
    }
    let [first, ...ret] = args;
    return createList([first, ...ret]);
});

export const ListFunction: INamedFunction = createNamedFunction('list', (args: Item[]): Item => {
    return createList(args);
});

export const IsEmptyFunction: INamedFunction = createNamedFunction('empty?', (args: Item[], env: IEnvironment): Item => {
    if (!args) return NIL;
    let arg = args[0];

    if (!arg || args.length > 1 || (arg.type != Types.STRING && arg.type != Types.LIST)) {
        throw "[empty?] function takes 1 list or string argument";
    }

    if (arg.type == Types.STRING) {
        return arg.str == ""? TRUE: FALSE;
    }
    if (arg.type == Types.LIST) {
        return arg.items && arg.items.length > 0? FALSE: TRUE;
    }

});

export const LenFunction: INamedFunction = createNamedFunction('len', (args: Item[], env: IEnvironment): Item => {
    if (!args) return NIL;
    let arg = args[0];

    if (!arg || args.length > 1 || (arg.type != Types.STRING && arg.type != Types.LIST)) {
        throw "[len] function takes 1 list or string argument";
    }

    if (arg.type == Types.STRING) {
        return createNumber(arg.str.length);
    }
    if (arg.type == Types.LIST) {
        return createNumber(arg.items.length);
    }

});

export const DocFunction: INamedFunction = createNamedFunction('doc', (args: Item[], env: IEnvironment): Item => {
    if (!args) return NIL;
    let arg = args[0];

    if (!arg || args.length > 1 || arg.type != Types.FUNCTION) {
        throw "[doc] function takes 1 function argument";
    }

    return createString(arg.description? arg.description: "No documentation for '" + arg.id + "'");
});

export const QuasiQuoteFunction: INamedFunction = createNamedFunction(QUASIQUOTE, (args: Item[], env: IEnvironment): Item => {
    if (!args || args.length == 0 || args.length > 1) {
        throw "'quasiquote' takes exactly 1 argument";
    }
    // console.log(`${QUASIQUOTE}: before applying macro, item = (quasiquote ${itemsToString(args)})`);
    let ret = quasiquoteItem(args[0], env);
    // console.log(`${QUASIQUOTE}: after applying macro1, item = ${itemToString(ret)}`);
    ret = evalItem(ret, env);
    // console.log(`${QUASIQUOTE}: after applying macro2, item = ${itemToString(ret)}`);
    return ret;
});

function quasiquoteItem(item: Item, env: IEnvironment): Item {
    switch (item.type) {
        case Types.LIST:
            let first = item.items[0];
            if (first.type == Types.SYMBOL && first.name == UNQUOTE) {
                return item.items[1];
            } else if (first.type == Types.SYMBOL && first.name == UNQUOTE_AT) {
                throw `[${QUASIQUOTE}] unquote-at not implemented yet`;
            } else {
                return createList([
                    createSymbol("list"),
                    ...item.items.map(it => quasiquoteItem(it, env))
                ]);
            }
        case Types.SYMBOL:
        case Types.NUMBER:
        case Types.BOOLEAN:
        case Types.NIL:
            return createList([
                createSymbol("quote"),
                item
            ]);
    }
}

export const LISP_FUNCTIONS = 
`
    (defn = (a b)
        (native "a === b" a b))

    (defn < (a b)
        (native "a < b" a b))

    (defn not (a)
        (if a false true))

    (defn or (a b)
        (if a true (if b true false)))

    (defn and (a b)
        (if a (if b true false) false))

    (defn <= (a b)
        (or (< a b) (= a b)))

    (defn > (a b)
        (not (<= a b)))

    (defn >= (a b)
        (or (> a b) (= a b)))

    (defn != (a b)
        (not (= a b)))

    (defn string? (s)
        (native "typeof(s) === 'string'" s))

    (defn number? (s)
        (native "typeof(s) === 'number'" s))

    (defn str->list (s) 
        (begin
            (if (not (string? s)) (throw "[str->list] argument must be a string"))
            (native "s? s.split(''): ''" s)))

    (defn strlen (s)
        (begin
            (if (not (string? s)) (throw "[strlen] takes 1 string argument"))
            (len (str->list s))))

    (defn + (& args)
        (reduce (lambda (acc next) (native "acc + next" acc next)) args 0))

    (defn - (a b)
        (native "a - b" a b))

    (defn * (& args)
        (reduce (lambda (acc next) (native "acc * next" acc next)) args 1))

    (defn / (a b)
        (native "a / b" a b))

    (defn str (& args)
        (reduce (lambda (acc next) (native "String(acc) + String(next)" acc next)) args ""))

    (def concat str) 

    ;;(defn car (first & rest) first)
    ;;(defn cdr (first & rest) rest)
    ;;(defn list (& args) args) // FIXME: it seems that destructuring doesn't work for lists of length 0
`;

export const NATIVE_FUNCTIONS = [
    ConcatFunction, PrintFunction, ReadFunction, 
    CdrFunction, CarFunction, ConsFunction, ListFunction,
    IsEmptyFunction, LenFunction, QuasiQuoteFunction,
    MapFunction, ReduceFunction, DocFunction
];
