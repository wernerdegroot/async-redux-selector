"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Cache_1 = require("./Cache");
var uuid_1 = require("uuid");
var AsyncResultOrAdvice_1 = require("./AsyncResultOrAdvice");
var Action_1 = require("./Action");
var Resource = (function () {
    function Resource(resourceId, runner, inputEq, validityInMiliseconds) {
        if (validityInMiliseconds === void 0) { validityInMiliseconds = Infinity; }
        var _this = this;
        this.resourceId = resourceId;
        this.runner = runner;
        this.inputEq = inputEq;
        this.validityInMiliseconds = validityInMiliseconds;
        this.selector = function (cache, input) {
            var now = new Date();
            var possibleAsyncResult = Cache_1.getAsyncResultIfValid(cache, _this.inputEq, input, now);
            if (possibleAsyncResult === undefined) {
                return new AsyncResultOrAdvice_1.HasAdvice(_this.getAdvice(input, now));
            }
            else {
                return possibleAsyncResult;
            }
        };
        this.reducer = function (cache, action) {
            switch (action.type) {
                case Action_1.AWAITING_RESULT:
                    return action.resourceId === _this.resourceId
                        ? Cache_1.awaitingResult(cache, _this.inputEq, _this.validityInMiliseconds, action.resourceId, action.input)
                        : cache;
                default:
                    return cache;
            }
        };
    }
    Resource.prototype.getAdvice = function (input, now) {
        var self = this;
        var requestId = uuid_1.v4();
        return {
            followAdvice: function (dispatch) {
                dispatch(Action_1.awaitingResultAction(self.resourceId, requestId, input, now));
                self.runner(input).then(function (result) {
                    dispatch(Action_1.resultArrivedAction(self.resourceId, requestId, input, result));
                });
            }
        };
    };
    return Resource;
}());
exports.Resource = Resource;
