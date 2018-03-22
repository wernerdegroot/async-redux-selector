"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWAITING_RESULT = 'AWAITING_RESULT';
function awaitingResultAction(resourceId, requestId, input, currentTime) {
    return {
        type: exports.AWAITING_RESULT,
        resourceId: resourceId,
        requestId: requestId,
        input: input,
        currentTime: currentTime
    };
}
exports.awaitingResultAction = awaitingResultAction;
function isAwaitingResultAction(action) {
    return action.type === exports.AWAITING_RESULT;
}
exports.isAwaitingResultAction = isAwaitingResultAction;
exports.RESULT_ARRIVED = 'RESULT_ARRIVED';
function resultArrivedAction(resourceId, requestId, input, result) {
    return {
        type: exports.RESULT_ARRIVED,
        resourceId: resourceId,
        requestId: requestId,
        input: input,
        result: result
    };
}
exports.resultArrivedAction = resultArrivedAction;
