import { awaitingResult, Cache, clear, getAsyncResultIfValid, resultArrived } from '../Cache'
import { AwaitingFirstResult, AwaitingNextResult, ResultArrived } from '../AsyncResult'
import {
  bigLifetime,
  Input,
  inputEq,
  later,
  now,
  Result,
  smallLifetime,
  someInput,
  someOtherInput,
  someOtherRequestId,
  someOtherResult,
  someRequestId,
  someResult
} from './data'

describe('Cache', () => {
  it('should initially be empty', () => {
    const cache: Cache<Input, Result> = []
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(undefined)
  })

  it('should be able to hold a pending request', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, bigLifetime, someRequestId, someInput)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AwaitingFirstResult(someRequestId))
  })

  it('should be able to hold a response', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, bigLifetime, someRequestId, someInput)
    cache = resultArrived(cache, inputEq, someRequestId, someInput, someResult, now)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new ResultArrived(someResult, now))
  })

  it('should be able to hold a response, but only until its lifetime has passed', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, smallLifetime, someRequestId, someInput)
    cache = resultArrived(cache, inputEq, someRequestId, someInput, someResult, now)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(undefined)
  })

  it('should be able to hold the previous response, when a new request was made', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, bigLifetime, someRequestId, someInput)
    cache = resultArrived(cache, inputEq, someRequestId, someInput, someResult, now)
    cache = awaitingResult(cache, inputEq, bigLifetime, someOtherRequestId, someInput)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to hold the previous response, when a new request was made, even if the lifetime of the previous response has passed', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, smallLifetime, someRequestId, someInput)
    cache = resultArrived(cache, inputEq, someRequestId, someInput, someResult, now)
    cache = awaitingResult(cache, inputEq, smallLifetime, someOtherRequestId, someInput)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be clearable', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, bigLifetime, someRequestId, someInput)
    cache = resultArrived(cache, inputEq, someRequestId, someInput, someResult, now)
    cache = clear(cache)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(undefined)
  })

  it('should be able to hold the previous response, when a new request was made, even if the cache was cleared', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, bigLifetime, someRequestId, someInput)
    cache = resultArrived(cache, inputEq, someRequestId, someInput, someResult, now)
    cache = clear(cache)
    cache = awaitingResult(cache, inputEq, bigLifetime, someOtherRequestId, someInput)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to handle race conditions', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, bigLifetime, someRequestId, someInput)
    cache = awaitingResult(cache, inputEq, bigLifetime, someOtherRequestId, someInput)
    cache = resultArrived(cache, inputEq, someRequestId, someInput, someResult, later)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))
    cache = resultArrived(cache, inputEq, someOtherRequestId, someInput, someOtherResult, later)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new ResultArrived(someOtherResult, later))
  })

  it('should be able to handle multiple requests', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, bigLifetime, someRequestId, someInput)
    cache = awaitingResult(cache, inputEq, bigLifetime, someOtherRequestId, someOtherInput)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AwaitingFirstResult(someRequestId))
    expect(getAsyncResultIfValid(cache, inputEq, someOtherInput, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))

    cache = resultArrived(cache, inputEq, someRequestId, someInput, someResult, later)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new ResultArrived(someResult, later))
    expect(getAsyncResultIfValid(cache, inputEq, someOtherInput, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))

    cache = resultArrived(cache, inputEq, someOtherRequestId, someOtherInput, someOtherResult, later)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new ResultArrived(someResult, later))
    expect(getAsyncResultIfValid(cache, inputEq, someOtherInput, later)).toEqual(new ResultArrived(someOtherResult, later))
  })
})