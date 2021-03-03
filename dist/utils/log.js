"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var styles = {
    info: "color: #aaa",
    debug: "color: blue",
    error: "color: red",
};
var log = function (value, level) {
    console.log("%c SUBJECTO %c " + value, "background-color: #000; padding: 2px 0; border-radius: 3px; font-size: 9px; color: #fff", "color: " + styles[level]);
};
exports.default = log;
