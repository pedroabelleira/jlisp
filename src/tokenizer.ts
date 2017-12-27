export enum RawTokens { OPEN_PARENS, CLOSE_PARENS, VARIABLE, STRING, NUMBER, BOOLEAN, NIL, COMMENT }

export interface BaseRawToken { type: RawTokens, val?: string, line?: number }
export interface RawSymbolToken extends BaseRawToken { type: RawTokens.VARIABLE, val: string }
export interface RawNumberToken extends BaseRawToken { type: RawTokens.NUMBER, val: string }
export interface RawStringToken extends BaseRawToken { type: RawTokens.STRING, val: string }
export interface RawOpenParensToken extends BaseRawToken { type: RawTokens.OPEN_PARENS; }
export interface RawCloseParensToken extends BaseRawToken { type: RawTokens.CLOSE_PARENS; }
export interface RawBooleanToken extends BaseRawToken { type: RawTokens.BOOLEAN; val: string }
export interface RawNilToken extends BaseRawToken { type: RawTokens.NIL; val: string }
export type RawToken = RawSymbolToken | RawNumberToken | RawStringToken | RawOpenParensToken | RawCloseParensToken | RawBooleanToken | RawNilToken;
export const RAW_TRUE = 'true';
export const RAW_FALSE = 'false';
export const RAW_NIL = 'nil';

// We keep the line number in this variable to trace back errors to the original source line
let line: number;

/**
 * Divides the input string in tokens and classifies them in types
 *  
 * @param input program text 
 */
export function tokenize(input: string): RawToken[] {
    line = 1;
    let tokens: RawToken[] = [];

    let chars: string[] = input.split('');

    while(chars.length > 0) {
        const c = chars.shift();

        if (isBlank(c)) continue;

        if (isComment(c)) {
            skipComment(c, chars);
            continue;
        }
        
        if (isOpenParens(c)) {
            pushToken(tokens, {type: RawTokens.OPEN_PARENS}); 
            continue;
        }

        if (isCloseParens(c)) {
            pushToken(tokens, {type: RawTokens.CLOSE_PARENS}); 
            continue;
        }

        if (isNumber(c)) {
            pushToken(tokens,readNumber(c, chars)); 
            continue;
        }

        if (isString(c)) {
            pushToken(tokens, readString(c, chars));
            continue;
        }

        pushToken(tokens, readSymbol(c, chars));
    }

    return tokens;
}

function pushToken(tokens: RawToken[], token: RawToken) {
    token["line"] = line;
    tokens.push(token);
}

function isComment(c: string) {
    return c == ';';
}

function isString(c: string) {
    return c == '"';
}

function isNumber(car: string) {
    return "0123456789.".indexOf(car[0]) >= 0;
}

function isBlank(car: string) {
    if (car == '\n') line++; 
    return car == ' ' || car == '\t' || car == '\n';
}

function isOpenParens(car: string) {
    return car == '(';
}

function isCloseParens(car: string) {
    return car == ')';
}

function readNumber(ic: string, chars: string[]): RawToken {
    while (true) {
        let c = chars.shift();
        if (!isNumber(c)) {
            if (c) { // It could be the last one...
                chars.unshift(c);
            }
            return {type: RawTokens.NUMBER, val: ic, line: line};
        } else {
            ic = ic + c;
        }
    }
}

function skipComment(ic: string, chars: string[]){
    while (true) { // Ignore everything until new line
        let c = chars.shift();
        if (!c || c == '\n') {
            line++;
            break;
        }
    }
}

function readString(ic: string, chars: string[]): RawToken {
    ic = '';
    while (true) {
        let c = chars.shift();
        if (!c) {
            throw("Error in readString: Unmatched '\"'");
        }
        if (c == '"') {
            return {type: RawTokens.STRING, val: ic, line: line};
        } else {
            ic = ic + c;
        }
    }
}

function readSymbol(ic: string, chars: string[]): RawToken {
    while(true) {
        let c = chars.shift();

        if (isBlank(c) || isOpenParens(c) || isCloseParens(c)) {
            chars.unshift(c);
            if (ic == RAW_TRUE) {return {type: RawTokens.BOOLEAN, val: RAW_TRUE}}
            if (ic == RAW_FALSE) {return {type: RawTokens.BOOLEAN, val: RAW_FALSE}}
            if (ic == RAW_NIL) {return {type: RawTokens.NIL, val: RAW_NIL}}
            return {type: RawTokens.VARIABLE, val: ic, line: line};
        }

        ic = ic + c;
    }
}

export function tokenToString(token: RawToken) {
    switch(token.type) {
        case RawTokens.STRING: 
        case RawTokens.NUMBER: 
        case RawTokens.VARIABLE:
            return token.val;
        case RawTokens.OPEN_PARENS: return "(";
        case RawTokens.CLOSE_PARENS: return ")";
    }
    return "FIXME";
}
