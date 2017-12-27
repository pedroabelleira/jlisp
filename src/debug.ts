import { Types, Item } from "./parser";

function nspaces(n: number, insertNewLines: boolean): string {
    if (!insertNewLines) return "";

    let i = 0;
    let ret = "\n";
    while (i++ <= n) {
        ret += " ";
    }
    return ret;
}

let logLevel = 0;
export function debug(msg: string, level: number = 1) {
    if (level <= logLevel) {
        console.log(msg);
    }
}
export function setLogLevel(ll: number) {
    logLevel = ll;
}
setLogLevel(0);
