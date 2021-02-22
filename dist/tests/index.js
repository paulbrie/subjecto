"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var testSubject = new index_1.Subject('');
test('initial value', function () {
    expect(testSubject.value === '');
});
