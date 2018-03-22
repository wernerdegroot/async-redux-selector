"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CacheItem_1 = require("./CacheItem");
var AsyncResult_1 = require("./AsyncResult");
function clear(cache) {
    return cache.map(function (item) { return item.forceInvalid(); });
}
exports.clear = clear;
function getAsyncResultIfValid(cache, eq, input, now) {
    var cacheItem = cache.find(function (item) { return eq(item.input, input); });
    if (cacheItem === undefined) {
        return undefined;
    }
    else if (!cacheItem.isValid(now)) {
        return undefined;
    }
    else {
        return cacheItem.asyncResult;
    }
}
exports.getAsyncResultIfValid = getAsyncResultIfValid;
function awaitingResult(cache, eq, lifeTimeInMiliseconds, requestId, input) {
    var otherItems = cache.filter(function (item) { return !eq(item.input, input); });
    var previousCacheItem = cache.find(function (item) { return eq(item.input, input); });
    var asyncResult;
    if (previousCacheItem === undefined) {
        asyncResult = new AsyncResult_1.AwaitingFirstResult(requestId);
    }
    else if (previousCacheItem.asyncResult.type === 'RESULT_ARRIVED') {
        asyncResult = new AsyncResult_1.AwaitingNextResult(requestId, previousCacheItem.asyncResult.result);
    }
    else if (previousCacheItem.asyncResult.type === 'AWAITING_NEXT_RESULT') {
        asyncResult = new AsyncResult_1.AwaitingNextResult(requestId, previousCacheItem.asyncResult.previousResult);
    }
    else if (previousCacheItem.asyncResult.type === 'AWAITING_FIRST_RESULT') {
        asyncResult = new AsyncResult_1.AwaitingFirstResult(requestId);
    }
    else {
        var exhaustive = previousCacheItem.asyncResult;
        throw exhaustive;
    }
    var newCacheItem = new CacheItem_1.CacheItem(input, asyncResult, lifeTimeInMiliseconds, false);
    var items = otherItems.concat([newCacheItem]);
    return items;
}
exports.awaitingResult = awaitingResult;
function resultArrived(cache, eq, id, input, result, now) {
    var items = cache.map(function (item) {
        if (eq(item.input, input)) {
            return item.resultArrived(id, result, now);
        }
        else {
            return item;
        }
    });
    return items;
}
exports.resultArrived = resultArrived;
