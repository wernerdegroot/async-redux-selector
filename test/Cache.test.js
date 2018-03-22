"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var date_fns_1 = require("date-fns");
var Cache_1 = require("../Cache");
var AsyncResult_1 = require("../AsyncResult");
function inputEq(left, right) {
    return left.inputValue === right.inputValue;
}
var someInput = {
    inputValue: 'some-input'
};
var someOtherInput = {
    inputValue: 'some-other-input'
};
var someResult = {
    resultValue: 4
};
var someId = 'some-requestId';
var someOtherId = 'some-other-requestId';
var now = new Date(2018, 3, 8, 2, 4, 1);
var smallLifetime = 2 * 60 * 1000;
var bigLifetime = 6 * 60 * 1000;
var later = date_fns_1.addMilliseconds(now, (smallLifetime + bigLifetime) / 2);
describe('Cache', function () {
    it('should initially be empty', function () {
        var cache = [];
        expect(Cache_1.getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(undefined);
    });
    it('should be able to hold a pending request', function () {
        var cache = [];
        cache = Cache_1.awaitingResult(cache, inputEq, bigLifetime, someId, someInput);
        expect(Cache_1.getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AsyncResult_1.AwaitingFirstResult(someId));
    });
    it('should be able to hold a response', function () {
        var cache = [];
        cache = Cache_1.awaitingResult(cache, inputEq, bigLifetime, someId, someInput);
        cache = Cache_1.resultArrived(cache, inputEq, someId, someInput, someResult, now);
        expect(Cache_1.getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AsyncResult_1.ResultArrived(someResult, now));
    });
    it('should be able to hold a response, but only until its lifetime has passed', function () {
        var cache = [];
        cache = Cache_1.awaitingResult(cache, inputEq, smallLifetime, someId, someInput);
        cache = Cache_1.resultArrived(cache, inputEq, someId, someInput, someResult, now);
        expect(Cache_1.getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(undefined);
    });
    it('should be able to hold the previous response, when a new request was made', function () {
        var cache = [];
        cache = Cache_1.awaitingResult(cache, inputEq, bigLifetime, someId, someInput);
        cache = Cache_1.resultArrived(cache, inputEq, someId, someInput, someResult, now);
        cache = Cache_1.awaitingResult(cache, inputEq, bigLifetime, someOtherId, someInput);
        expect(Cache_1.getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AsyncResult_1.AwaitingNextResult(someOtherId, someResult));
    });
    it('should be able to hold the previous response, when a new request was made, even if the lifetime of the previous response has passed', function () {
        var cache = [];
        cache = Cache_1.awaitingResult(cache, inputEq, smallLifetime, someId, someInput);
        cache = Cache_1.resultArrived(cache, inputEq, someId, someInput, someResult, now);
        cache = Cache_1.awaitingResult(cache, inputEq, smallLifetime, someOtherId, someInput);
        expect(Cache_1.getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AsyncResult_1.AwaitingNextResult(someOtherId, someResult));
    });
    it('should be clearable', function () {
        var cache = [];
        cache = Cache_1.awaitingResult(cache, inputEq, bigLifetime, someId, someInput);
        cache = Cache_1.resultArrived(cache, inputEq, someId, someInput, someResult, now);
        cache = Cache_1.clear(cache);
        expect(Cache_1.getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(undefined);
    });
    it('should be able to hold the previous response, when a new request was made, even if the cache was cleared', function () {
        var cache = [];
        cache = Cache_1.awaitingResult(cache, inputEq, bigLifetime, someId, someInput);
        cache = Cache_1.resultArrived(cache, inputEq, someId, someInput, someResult, now);
        cache = Cache_1.clear(cache);
        cache = Cache_1.awaitingResult(cache, inputEq, bigLifetime, someOtherId, someInput);
        expect(Cache_1.getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AsyncResult_1.AwaitingNextResult(someOtherId, someResult));
    });
});
