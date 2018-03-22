"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Action_1 = require("../Action");
var data_1 = require("./data");
function assert(a) {
    return {
        toMatch: function (matcher) {
            var result = matcher(a);
            if (result !== true) {
                fail(result);
            }
        }
    };
}
exports.assert = assert;
exports.matchesAll = function (matchers) { return function (as) {
    if (matchers.length !== as.length) {
        return "Expected " + matchers.length + " but got " + as.length + " elements";
    }
    else {
        for (var i = 0; i < matchers.length; ++i) {
            var matcher = matchers[i];
            var a = as[i];
            var result = matcher(a);
            if (result !== true) {
                return "Match error at index " + i + ": " + result;
            }
        }
    }
    return true;
}; };
exports.isAwaitingResult = function (input) { return function (action) {
    if (Action_1.isAwaitingResultAction(action)) {
        if (data_1.inputEq(action.input, input)) {
            return true;
        }
        else {
            return "Input " + JSON.stringify(action.input) + " not equal to " + JSON.stringify(input);
        }
    }
    else {
        return "Not 'AWAITING_RESULT_ACTION'";
    }
}; };
