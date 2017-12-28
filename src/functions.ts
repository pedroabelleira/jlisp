import { INamedFunction, IEnvironment } from "./interpreter";
import { Item, Types, NIL, TRUE, FALSE, createFunction, createString, createNumber, createList } from "./parser";
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
                return '#Function<' + item.id + '>';
            } else {
                return '#Function<native>';
            }
        case Types.VARIABLE: return item.name;
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

export const ConcatFunction: INamedFunction = createNamedFunction('concat', (args: Item[]): Item => {
    if (!args || args.length < 1) throw "[concat] function takes at least 1 argument";
    if (!args.reduce((acc, next) => acc && next.type == Types.STRING, true)) {
        throw "[concat] function needs to be called with arguments of type string";
    }
    return createString(args.reduce((acc, next) => acc + next['str'], ""));
});

export const StrLenFunction: INamedFunction = createNamedFunction('strlen', (args: Item[]): Item => {
    if (!args || args.length != 1 || args[0].type != Types.STRING) throw "[strlen] function takes 1 string argument";
    return createNumber(String(args[0]["str"]).length);
});

export const EqualsFunction: INamedFunction = createNamedFunction('=', (args: Item[]): Item => {
    if (!args || args.length != 2) {
        throw "[=] function takes 2 arguments"
    }
    let a = args[0];
    let b = args[1];
    return itemToString(a) === itemToString(b)? TRUE: FALSE;
});

export const PlusFunction: INamedFunction = createNamedFunction('+', (args: Item[]): Item => {
    if (!args || args.length < 2) {
        throw "[+] function takes 2 or more number arguments";
    }
    if (!args.reduce((acc, next) => acc && next.type == Types.NUMBER, true)) throw "[+] function takes only number arguments";
    return createNumber(args.reduce((acc, next) => acc + Number(next["num"]), 0));
});

export const StarFunction: INamedFunction = createNamedFunction('*', (args: Item[]): Item => {
    if (!args || args.length < 2) {
        throw "[*] function takes 2 or more number arguments";
    }
    if (!args.reduce((acc, next) => acc && next.type == Types.NUMBER, true)) throw "[*] function takes only number arguments";
    return createNumber(args.reduce((acc, next) => acc * Number(next["num"]), 1));
});

export const MinusFunction: INamedFunction = createNamedFunction('-', (args: Item[]): Item => {
    if (!args || args.length != 2) {
        throw "[-] function takes 2 number arguments";
    }
    if (!args.reduce((acc, next) => acc && next.type == Types.NUMBER, true)) throw "[-] function takes only number arguments";
    return createNumber(args[0]["num"] - args[1]["num"]);
});

export const SlashFunction: INamedFunction = createNamedFunction('/', (args: Item[]): Item => {
    if (!args || args.length != 2) {
        throw "[/] function takes 2 number arguments";
    }
    if (!args.reduce((acc, next) => acc && next.type == Types.NUMBER, true)) throw "[/] function takes only number arguments";
    return createNumber(args[0]["num"] / args[1]["num"]);
});

export const MinorThanFunction: INamedFunction = createNamedFunction('<', (args: Item[]): Item => {
    if (!args || args.length != 2) {
        throw "[<] function takes 2 number arguments";
    }
    if (!args.reduce((acc, next) => acc && next.type == Types.NUMBER, true)) throw "[<] function takes only number arguments";
    return (args[0]["num"] < args[1]["num"])? TRUE: FALSE;
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

export const StrToListFunction: INamedFunction = createNamedFunction('str->list', (args: Item[], env: IEnvironment): Item => {
    if (!args) return NIL;
    let arg = args[0];

    if (!arg || args.length > 1 || arg.type != Types.STRING) {
        throw "[str->list] function takes 1 string argument";
    }

    let chars = arg.str.split("");

    return createList(chars.map(s => createString(s)));
});

export const LISP_FUNCTIONS = 
`
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

;;    (defn len (lis) ;; FIXME: Why this function does not work??
;;        (if (empty? lis) 
;;            0
;;            (+ 1 (len (cdr lis)))))

    (defn strlen (s)
       (len (str->list s)))
`;

export const NATIVE_FUNCTIONS = [
    ConcatFunction, PrintFunction, ReadFunction, StrLenFunction, EqualsFunction, 
    PlusFunction, MinusFunction, StarFunction, SlashFunction,
    MinorThanFunction, CdrFunction, CarFunction, ConsFunction, ListFunction,
    StrToListFunction, IsEmptyFunction, LenFunction
];
