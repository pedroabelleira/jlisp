import { 
    tokenize, RawToken, RawSymbolToken, RawNumberToken, RawStringToken, 
    RawOpenParensToken, RawCloseParensToken, RawTokens, RAW_NIL, RAW_TRUE, RAW_FALSE
} from "./tokenizer";
import { IEnvironment } from "./interpreter";

export enum Types { 
    NUMBER = 'NUMBER', 
    BOOLEAN = 'BOOLEAN', 
    STRING = 'STRING', 
    SYMBOL = 'SYMBOL', 
    FUNCTION = 'FUNCTION', 
    LIST = 'LIST', 
    NIL = 'NIL' 
}
interface BaseToken { type: Types, line?: number }
export interface VariableType extends BaseToken { type: Types.SYMBOL, name: string }
export interface NumberType extends BaseToken { type: Types.NUMBER, num: number }
export interface StringType extends BaseToken { type: Types.STRING, str: string }
export interface BooleanType extends BaseToken { type: Types.BOOLEAN, cond: boolean }
export interface ListType extends BaseToken { type: Types.LIST, items: Item[] }
export interface NilType extends BaseToken { type: Types.NIL }
export interface FunctionType extends BaseToken { 
    type: Types.FUNCTION, 
    call: (args: Item[], env: IEnvironment) => Item, 
    id?: string, 
    description?: string
}

export type Atom = VariableType | NumberType | StringType | BooleanType | FunctionType | NilType;
export type Item = Atom | ListType;
// export type List = Item[];

export function createString(str: string, line:number = 0): StringType {return { type: Types.STRING, str: str, line: line }}
export function createNumber(num: number, line:number = 0): NumberType {return { type: Types.NUMBER, num: num, line: line }}
export function createVariable(name: string, line:number = 0): VariableType {return { type: Types.SYMBOL, name: name, line: line }}
export function createFunction(call: (args: Item[], env: IEnvironment) => Item, line = 0, id?: string, description?: string): FunctionType {
    return { type: Types.FUNCTION, call: call, line: line, id: id, description: description }
};
export function createList(items: Item[], line = 0): ListType {return { type: Types.LIST, items: items, line: line }}
export const TRUE: BooleanType = {type: Types.BOOLEAN, cond: true};
export const FALSE: BooleanType = {type: Types.BOOLEAN, cond: false};
export const NIL: NilType = {type: Types.NIL}

/**
 * Parses a program and returns the syntax tree
 * @param program Text of the program
 */
export function parse(program: string): Item[] {
    return parseTokenList(tokenize(program));
}

/**
 * Parses a list of tokens and constructs and return the syntax tree
 * The syntax tree is a list of atoms corresponding to the instructions in first level parenthesis.
 * @param tokens List of tokens representing the text of the program
 */
export function parseTokenList(tokens: RawToken[]): Item[] {
    let items: Item[] = [];

    let t = tokens.shift();

    while (tokens.length > 0) {
        items.push(parseToken(t, tokens));
        t = tokens.shift();
    }

    return items;
}

function parseToken(initialToken: RawToken, rest: RawToken[]): ListType {
    if (!initialToken || initialToken.type != RawTokens.OPEN_PARENS) {
        throw "Parse error: expression must start with an open parenthesis";
    }

    let t: RawToken;
    let items: Item[] = [];

    t = rest.shift();
    while(t && t.type != RawTokens.CLOSE_PARENS) {
        if (t.type == RawTokens.OPEN_PARENS) {
            items.push(parseToken(t, rest)); 
        } else {
            items.push(mapRawTokenToItem(t));
        }
        t = rest.shift();
    } 
    return createList(items);
}

function mapRawTokenToItem(rt: RawToken): Item {
    switch (rt.type) {
        case RawTokens.NUMBER: return createNumber(Number(rt.val)); // FIXME: handle incorrect formats
        case RawTokens.STRING: return createString(rt.val, rt.line);
        case RawTokens.VARIABLE: return createVariable(rt.val, rt.line);
        case RawTokens.BOOLEAN: return rt.val == RAW_TRUE? TRUE: FALSE;
        case RawTokens.NIL: return NIL; 
    }
}
