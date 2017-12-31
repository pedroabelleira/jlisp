import { Item, Types, VariableType, parse, TRUE, FALSE, NIL, createFunction, createSymbol, createList, FunctionType, createString, ListType, UNQUOTE, UNQUOTE_AT, QUOTE, QUASIQUOTE, StringType, createNumber } from "./parser";
import { IMacro, IEnvironment, evalItem, INamedFunction, expandMacros } from "./interpreter";
import { debug } from "./debug";
import { itemToString, createNamedFunction, itemsToString } from "./functions";


export class NativeMacro implements IMacro {
    name = 'native';
    expand = (args: Item[], env: IEnvironment): Item => {
        if (!args || !args[0] || args[0].type != Types.STRING) {
            throw "[native] macro takes 1 string argument";
        }

        let command =  (<StringType>args[0]).str;

        return createList([ createFunction((args: Item[], env: IEnvironment): Item => {
            let ret = eval(command);
            switch (typeof(ret)) {
                case 'boolean':
                    if (ret) {return TRUE;} else {return FALSE;}
                case 'string':
                    return createString(ret);
                case 'number':
                    return createNumber(ret);
                default:
                    if (ret["slice"] && ret["map"] && ret["unshift"]) { // Probably a list
                        return createList([...ret]);
                    }
                    if (ret["type"] && ret["type"]) {
                        return ret;
                    }
                    throw "[native] code returned an invalid value";
            }
        })]);

    }
}

export class BeginMacro implements IMacro {
    name = 'begin';
    expand = (args: Item[], env: IEnvironment): Item => {
        args = args.map(a => expandMacros(a, env));

        return createList([ createFunction((items: Item[], env: IEnvironment): Item => {
            return NIL; // No need to do anything, since args are evaluated before calling this function
        }), ...args]);
    }
}

export class IfMacro implements IMacro {
    private static NUM_IFS = 0;
    name = 'if';
    expand = (args: Item[], env: IEnvironment): Item => {
        if (!args || args.length < 2 || args.length > 3) throw `[if] macro takes 2 or 3 arguments, first of which must evaluate to a boolean`;
        let [cond, trueBranch, elseBranch] = args;
        let sItem = itemsToString([trueBranch, elseBranch]);
        trueBranch = expandMacros(trueBranch, env);
        elseBranch = expandMacros(elseBranch, env);

        return createList([ createFunction((args: Item[], env: IEnvironment): Item => {
            let ret;
            if (args[0] == TRUE) {
                ret = evalItem(trueBranch, env);
            } else {
                if (!elseBranch || elseBranch == NIL) return NIL;
                ret = evalItem(elseBranch, env);
            }
            return ret;
        }, cond.line, `<native if[${IfMacro.NUM_IFS++}]>`), cond]);
    }
}

export class TryMacro implements IMacro {
    name = 'try';
    expand = (args: Item[], env: IEnvironment): Item => {
        if (!args || args.length < 1 || args.length > 2) throw `[try] macro takes 1 or 2 arguments`;
        let [body, except ] = args;
        body = expandMacros(body, env);
        except = expandMacros(except, env);

        return createList([ createFunction((args: Item[], env: IEnvironment): Item => {
            try {
                return evalItem(body, env);
            } catch (ex) {
                return evalItem(except, env);
            }
        })]);
    }
}

export class ThrowMacro implements IMacro {
    name = 'throw';
    expand = (args: Item[], env: IEnvironment): Item => {
        if (!args || args.length != 1) throw `[throw] macro takes 1 arguments`;
        let msg: Item = args[0];

        return createList([ createFunction((args: Item[], env: IEnvironment): Item => {
            let smsg = itemToString(evalItem(msg, env));
            throw smsg;
        })]);
    }
}
export class DefineMacro implements IMacro {
    constructor(public name: string = 'define') { }

    expand = (args: Item[], env: IEnvironment): Item => {
        let name = args[0];
        let value = args[1];

        if (!name && name.type != Types.SYMBOL) {
            throw `[define] macro takes two arguments, the first of which must be a variable name (line = ${name.line}`;
        } 
        value = expandMacros(value, env);
        return createList([ createFunction((args: Item[], env: IEnvironment) => {
            env.addVariable(name["name"], args[0]);
            return args[0];
        }), value]);
    }
}

export class DefnMacro implements IMacro {
    constructor(public name: string = 'defn') { }

    expand = (args: Item[], env: IEnvironment): Item => {
        let line = args[0].line;
        let items = [];

        items.push(createSymbol('define', line));
        items.push(createSymbol((<VariableType>args[0]).name, line));
        items.push(createList([
            createSymbol('lambda'),
            args[1],
            args[2]
        ]));

        let ret = expandMacros(createList(items), env);
        return ret;
    }
}

export class EvalMacro implements IMacro {
    name = 'eval';
    expand = (args: Item[], env: IEnvironment):Item => {
        let arg = args[0];
        if (!arg) throw "'eval' requires 1 argument";
        arg = expandMacros(arg, env);
        return createList([createFunction((args: Item[], env: IEnvironment): Item => {
            return evalItem(args[0], env);
        }), arg]);
    }
}

export class LambdaMacro implements IMacro {
    constructor(public name: string = 'lambda') {}

    private static LAMBDAS: number = 0;

    public expand(args: Item[], env: IEnvironment): Item {
        return this.buildLambdaItem(args, env);
    }

    /**
     * Returns a function that, when evaluated, will apply the function defined by this lambda to its arguments
     * @param args 
     */
    private buildLambdaItem(args: Item[], env: IEnvironment): Item {
        if (!args || args.length == 0) return undefined; // FIXME: check exactly 2 arguments, etc.
        let params = args[0];
        let body = args[1];

        body = expandMacros(body, env);

        if (!params || params.type != Types.LIST) {
            throw "[lambda] Function macro error: first argument must be a list of parameters";
        }

        if (params.items.filter(t => !!t).filter(t => t.type != Types.SYMBOL).length != 0) {
            throw "[lambda] Function macro error: function parameters must be variable names: ";  
        }

        return this.buildFunction(<VariableType[]> params.items, body, env);
    }

    private buildFunction (params: VariableType[], body: Item, _env: IEnvironment): FunctionType {
        return createFunction ((args: Item[], env: IEnvironment): Item => {
            let numParms = params?params.length: 0;
            let numArgs = args?args.length: 0;
            if (numParms > numArgs) {
                throw `[lambda] Insufficient number of arguments to the function: ${numArgs} received, at least ${numParms} expected`
            }
            let newEnv = env.createNestedEnvironment();

            if (params && params.length > 0) {
                params.forEach((par, index) => {
                    newEnv.addVariable(par.name, args? args[index]: NIL);
                });
            }
            return evalItem(body, newEnv);
        }, body.line, "" + LambdaMacro.LAMBDAS++);
    }
}

export class DefMacroMacro implements IMacro {
    name = 'defmacro';
    expand = (args: Item[], env: IEnvironment): Item => {
        if (!args || args.length > 3 || args.length < 2 || !args[0]) throw "[defmacro] expects 3 arguments";
        let [name, params, body] = args;

        if (args.length == 2) return this.aliasMacro(args[0], args[1], env);

        if (name.type != Types.SYMBOL) throw `[defmacro] first argument must be a variable (line = ${name.line})`;
        if (params.type != Types.LIST) throw `[defmacro] second argument must be a list of symbols (line = ${params.line}`;
        if (!params.items.reduce((acc, next) => acc && next.type == Types.SYMBOL, true)) {
            throw `[defmacro]: second argument must be a list of variables (line = ${params.line}`;
        }
        if (body.type != Types.LIST) throw `[defmacro] body must be a list (line = ${params.line})`

        let pars: VariableType[] = <VariableType[]> params.items;
        
        env.addMacro({
            name: name.name,
            expand: (_args: Item[], env: IEnvironment) => {
                let newEnv = env.createNestedEnvironment();

                if (pars && pars.length > 0) {
                    pars.forEach((par, index) => {
                        let value: Item = _args? _args[index]: NIL;
                        value = createList([createSymbol(QuoteMacro.QUOTE_MACRO_NAME), value]);
                        newEnv.addVariable(par.name, value); // We quote to protect from evaluation
                    });
                }
                // console.log(`[defmacro] generated macro expand phase: [1], body = '${itemToString(body)}'`);
                body = evalItem(body, newEnv); // Evaluate the body to produce the macro
                // console.log(`[defmacro] generated macro expand phase: [2], body = '${itemToString(body)}'`);
                body = expandMacros(body, env); // Expand the macros on the resulting macro 
                // console.log(`[defmacro] generated macro expand phase: [3], body = '${itemToString(body)}'`);
                body = expandMacros(body, env); // And fially, apply the macro itself 
                // console.log(`[defmacro] generated macro expand phase: [4], body = '${itemToString(body)}'`);

                return body;
            }
        });

        return NIL;
    }

    aliasMacro (alias: Item, existingMacro: Item, env: IEnvironment): Item {
        if (!alias && alias .type != Types.SYMBOL) {
            throw `[defmacro] with two arguments, the first of which must be a variable name (line = ${alias.line}`;
        } 

        let nameMacro = (<VariableType>existingMacro).name;
        let macro = env.findMacro(nameMacro);
        if (!macro) {
            throw `defmacro: macro not found (${nameMacro})`
        }

        env.addMacro ({
            name: (<VariableType>alias).name,
            expand: (_args: Item[], env: IEnvironment) => {
                return macro.expand(_args, env);
            }
        });
        return NIL;
    }
}

const BREAKVAR = "<< BREAK >>";
export class WhileMacro implements IMacro {
    name = 'while';
    expand = (args: Item[], env: IEnvironment): Item => {

        let [cond, ...body] = args;
        body = body.map(b => expandMacros(b, env));
        let ret = createList([createFunction((args: Item[], env: IEnvironment): Item => {
            env = env.createNestedEnvironment();
            env.addVariable(BREAKVAR, FALSE);

            while (evalItem(cond, env) == TRUE) {
                body.filter(exp => exp && exp != NIL).forEach(exp => {
                    evalItem(exp, env);
                    if (env.findVariable(BREAKVAR) == TRUE) {
                        return NIL;
                    }
                });
            }
            return NIL;
        }), ]);

        return ret;
    }
}

export class BreakMacro implements IMacro {
    name = 'break';
    expand = (args: Item[], env: IEnvironment): Item => {
        return createList([
            createFunction((args: Item[], env: IEnvironment): Item => {
                env.addVariable(BREAKVAR, TRUE);
                return NIL;
            }),
            // cond
        ]);
    }
}

export class SetBangMacro implements IMacro {
    name = 'set!';
    expand = (args: Item[], env: IEnvironment): Item => {
        if (!args || args.length != 2) throw "[set!] macro takes two arguments";

        let [variable, value] = args;
        if (variable.type != Types.SYMBOL) throw "[set!] macro: first argument must be a variable";
        value = expandMacros(value, env);

        return createList([
            createFunction((args: Item[], env: IEnvironment): Item => {
                try {
                    env.setVariable(variable["name"], args[0]);
                } catch (ex) {
                    throw `[set!] error setting variable: ${ex}`;
                }
                return NIL;
            }),
            value
        ]);
    }
}

export class QuoteMacro implements IMacro {
    static QUOTE_MACRO_NAME = 'quote';

    name = QuoteMacro.QUOTE_MACRO_NAME;
    expand = (args: Item[], env: IEnvironment): Item => {
        if (!args || args.length == 0 || args.length > 1) {
            throw "'quote' takes exactly 1 argument";
        }

        return args[0];
    }
}

export class UnquoteMacro implements IMacro {
    name = 'unquote';
    expand = (args: Item[], env: IEnvironment): Item => {
        throw "[unquote] Unbalanced quotes: 'unquote' found without corrsponding ' or `";
    }
}

export class ReadStringMacro implements IMacro {
    name = 'read-string';
    expand = (args: Item[], env: IEnvironment) => {
        let arg = args[0];
        if (!arg) throw "'read-string' requires 1 string argument";
        arg = expandMacros(arg, env);

        return createList([ createFunction((items: Item[], env: IEnvironment) => {
            arg = items[0];
            switch (arg.type) {
                case Types.NIL:
                    return NIL;
                case Types.LIST:
                case Types.NUMBER:
                case Types.BOOLEAN:
                case Types.SYMBOL:
                    arg = evalItem(arg, env);
                    if (!arg || arg.type != Types.STRING) return arg;
                    // Intented passthrough
                case Types.STRING:
                    try {
                        let pgr = parse(arg.str)[0];
                        let ret = expandMacros(pgr, env);
                        return ret;
                    } catch (ex) {
                        return createString("Exception parsing expression: " + ex);
                    }
            }}),
            arg
        ]); 
    }
}

export const NATIVE_MACROS = [
    DefineMacro, IfMacro, EvalMacro, LambdaMacro, DefnMacro, BeginMacro,
    WhileMacro, BreakMacro, SetBangMacro, QuoteMacro, UnquoteMacro,
    ReadStringMacro, DefMacroMacro, NativeMacro, TryMacro, ThrowMacro
];

export const LISP_MACROS = 
`   (defmacro def define)
    (defmacro fn lambda)

    (defmacro defun (name vars body)
        (list (quote define) name 
            (list (quote lambda)
                vars 
                body
            )
        )
    )
`;