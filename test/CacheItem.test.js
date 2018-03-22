"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var date_fns_1 = require("date-fns");
var CacheItem_1 = require("../CacheItem");
var AsyncResult_1 = require("../AsyncResult");
var someInput = {
    inputValue: 'some-input'
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
describe('CacheItem', function () {
    it('should not be valid after it was forced to be invalid', function () {
        var asyncResultArrived = new AsyncResult_1.ResultArrived(someResult, now);
        var expectedValid = new CacheItem_1.CacheItem(someInput, asyncResultArrived, bigLifetime, false);
        var expectedInvalid = expectedValid.forceInvalid();
        expect(expectedValid.isValid(later)).toEqual(true);
        expect(expectedInvalid.isValid(later)).toEqual(false);
    });
    it('should not be valid after its lifetime is over', function () {
        var asyncResultArrived = new AsyncResult_1.ResultArrived(someResult, now);
        var expectedInvalid = new CacheItem_1.CacheItem(someInput, asyncResultArrived, smallLifetime, false);
        expect(expectedInvalid.isValid(later)).toEqual(false);
    });
    it('should be valid when the result has not arrived yet', function () {
        var asyncResultAwaiting = new AsyncResult_1.AwaitingFirstResult(someId);
        var expectedValid = new CacheItem_1.CacheItem(someInput, asyncResultAwaiting, smallLifetime, false);
        expect(expectedValid.isValid(later)).toEqual(true);
    });
    it('should be valid when the result has not arrived yet, even if it was forced to be invalid', function () {
        var asyncResultAwaiting = new AsyncResult_1.AwaitingFirstResult(someId);
        var expectedValid = new CacheItem_1.CacheItem(someInput, asyncResultAwaiting, smallLifetime, true);
        expect(expectedValid.isValid(later)).toEqual(true);
    });
    it('should contain a result (and not be invalid) when a result arrived with the right requestId', function () {
        var asyncResultAwaiting = new AsyncResult_1.AwaitingFirstResult(someId);
        var cacheItem = new CacheItem_1.CacheItem(someInput, asyncResultAwaiting, smallLifetime, true);
        var cacheItemWithResult = cacheItem.resultArrived(someId, someResult, now);
        expect(cacheItemWithResult.asyncResult).toEqual(new AsyncResult_1.ResultArrived(someResult, now));
        expect(cacheItemWithResult.isValid(now)).toEqual(true);
    });
    it('should not contain a result when a result arrived with the wrong requestId', function () {
        var asyncResultAwaiting = new AsyncResult_1.AwaitingFirstResult(someId);
        var cacheItem = new CacheItem_1.CacheItem(someInput, asyncResultAwaiting, smallLifetime, true);
        var cacheItemWithResult = cacheItem.resultArrived(someOtherId, someResult, now);
        expect(cacheItemWithResult.asyncResult).toEqual(asyncResultAwaiting);
    });
});
