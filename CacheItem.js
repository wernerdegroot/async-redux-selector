"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var date_fns_1 = require("date-fns");
var CacheItem = (function () {
    function CacheItem(input, asyncResult, lifeTimeInMiliseconds, forcedInvalid) {
        this.input = input;
        this.asyncResult = asyncResult;
        this.lifeTimeInMiliseconds = lifeTimeInMiliseconds;
        this.forcedInvalid = forcedInvalid;
    }
    CacheItem.prototype.forceInvalid = function () {
        return new CacheItem(this.input, this.asyncResult, this.lifeTimeInMiliseconds, true);
    };
    CacheItem.prototype.resultArrived = function (id, result, now) {
        var asyncResult = this.asyncResult.resultArrived(id, result, now);
        return new CacheItem(this.input, asyncResult, this.lifeTimeInMiliseconds, false);
    };
    CacheItem.prototype.isValid = function (now) {
        if (this.asyncResult.type === 'RESULT_ARRIVED') {
            return !this.forcedInvalid && now < date_fns_1.addMilliseconds(this.asyncResult.when, this.lifeTimeInMiliseconds);
        }
        else {
            return true;
        }
    };
    return CacheItem;
}());
exports.CacheItem = CacheItem;
