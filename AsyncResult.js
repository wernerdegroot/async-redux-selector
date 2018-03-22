"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWAITING_FIRST_RESULT = 'AWAITING_FIRST_RESULT';
exports.AWAITING_NEXT_RESULT = 'AWAITING_NEXT_RESULT';
exports.RESULT_ARRIVED = 'RESULT_ARRIVED';
var AwaitingFirstResult = (function () {
    function AwaitingFirstResult(requestId) {
        this.requestId = requestId;
        this.type = exports.AWAITING_FIRST_RESULT;
    }
    AwaitingFirstResult.prototype.resultArrived = function (id, r, now) {
        if (this.requestId === id) {
            return new ResultArrived(r, now);
        }
        else {
            return this;
        }
    };
    return AwaitingFirstResult;
}());
exports.AwaitingFirstResult = AwaitingFirstResult;
var AwaitingNextResult = (function () {
    function AwaitingNextResult(requestId, previousResult) {
        this.requestId = requestId;
        this.previousResult = previousResult;
        this.type = exports.AWAITING_NEXT_RESULT;
    }
    AwaitingNextResult.prototype.resultArrived = function (id, r, now) {
        if (this.requestId === id) {
            return new ResultArrived(r, now);
        }
        else {
            return this;
        }
    };
    return AwaitingNextResult;
}());
exports.AwaitingNextResult = AwaitingNextResult;
var ResultArrived = (function () {
    function ResultArrived(result, when) {
        this.result = result;
        this.when = when;
        this.type = exports.RESULT_ARRIVED;
    }
    ResultArrived.prototype.resultArrived = function (id, r, now) {
        throw new Error('Result has already arrived!');
    };
    return ResultArrived;
}());
exports.ResultArrived = ResultArrived;
