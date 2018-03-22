"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AsyncResult_1 = require("../AsyncResult");
var someResult = {
    value: 'some-result'
};
var someOtherResult = {
    value: 'some-other-result'
};
var someId = 'some-requestId';
var someOtherId = 'some-other-requestId';
var now = new Date(2018, 3, 8, 2, 4, 1);
describe('AsyncResult', function () {
    it('should only transition from AWAITING_FIRST_RESULT to RESULT_ARRIVED when the requestId is the same (to prevent race conditions)', function () {
        var awaitingFirstResult = new AsyncResult_1.AwaitingFirstResult(someId);
        var transitionForSameId = awaitingFirstResult.resultArrived(someId, someResult, now);
        var transitionForOtherId = awaitingFirstResult.resultArrived(someOtherId, someResult, now);
        expect(transitionForSameId).toEqual(new AsyncResult_1.ResultArrived(someResult, now));
        expect(transitionForOtherId).toEqual(awaitingFirstResult);
    });
    it('should only transition from AWAITING_NEXT_RESULT to RESULT_ARRIVED when the requestId is the same (to prevent race conditions)', function () {
        var awaitingNextResult = new AsyncResult_1.AwaitingNextResult(someId, someResult);
        var transitionForSameId = awaitingNextResult.resultArrived(someId, someOtherResult, now);
        var transitionForOtherId = awaitingNextResult.resultArrived(someOtherId, someOtherResult, now);
        expect(transitionForSameId).toEqual(new AsyncResult_1.ResultArrived(someOtherResult, now));
        expect(transitionForOtherId).toEqual(awaitingNextResult);
    });
    it('should not be allowed to transition from RESULT_ARRIVED', function () {
        var resultArrived = new AsyncResult_1.ResultArrived(someResult, now);
        try {
            var afterTransition = resultArrived.resultArrived(someId, someOtherResult, now);
            fail();
        }
        catch (e) {
            expect(e.message).toEqual('Result has already arrived!');
        }
    });
});
