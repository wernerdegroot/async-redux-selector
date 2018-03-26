import { awaitingResult, Cache, clear, getAsyncResultIfValid, resultArrived, truncate } from '../Cache'
import { AwaitingFirstResult, AwaitingNextResult, ResultArrived } from '../AsyncResult'
import {
  bigLifetime,
  Key,
  keysAreEqual,
  later,
  now,
  Result,
  smallLifetime,
  someKey,
  someOtherKey,
  someOtherRequestId,
  someOtherResult,
  someRequestId,
  someResult
} from './data'
import { max, addSeconds } from 'date-fns';

describe('Cache', () => {
  it('should initially be empty', () => {
    const cache: Cache<Key, Result> = []
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold a pending request', () => {
    let cache: Cache<Key, Result> = []
    cache = awaitingResult(cache, keysAreEqual, bigLifetime, someRequestId, someKey)
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(new AwaitingFirstResult(someRequestId))
  })

  it('should be able to hold a response', () => {
    let cache: Cache<Key, Result> = []
    cache = awaitingResult(cache, keysAreEqual, bigLifetime, someRequestId, someKey)
    cache = resultArrived(cache, keysAreEqual, someRequestId, someKey, someResult, now)
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someResult, now))
  })

  it('should be able to hold a response, but only until its lifetime has passed', () => {
    let cache: Cache<Key, Result> = []
    cache = awaitingResult(cache, keysAreEqual, smallLifetime, someRequestId, someKey)
    cache = resultArrived(cache, keysAreEqual, someRequestId, someKey, someResult, now)
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold the previous response, when a new request was made', () => {
    let cache: Cache<Key, Result> = []
    cache = awaitingResult(cache, keysAreEqual, bigLifetime, someRequestId, someKey)
    cache = resultArrived(cache, keysAreEqual, someRequestId, someKey, someResult, now)
    cache = awaitingResult(cache, keysAreEqual, bigLifetime, someOtherRequestId, someKey)
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to hold the previous response, when a new request was made, even if the lifetime of the previous response has passed', () => {
    let cache: Cache<Key, Result> = []
    cache = awaitingResult(cache, keysAreEqual, smallLifetime, someRequestId, someKey)
    cache = resultArrived(cache, keysAreEqual, someRequestId, someKey, someResult, now)
    cache = awaitingResult(cache, keysAreEqual, smallLifetime, someOtherRequestId, someKey)
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be clearable', () => {
    let cache: Cache<Key, Result> = []
    cache = awaitingResult(cache, keysAreEqual, bigLifetime, someRequestId, someKey)
    cache = resultArrived(cache, keysAreEqual, someRequestId, someKey, someResult, now)
    cache = clear(cache)
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold the previous response, when a new request was made, even if the cache was cleared', () => {
    let cache: Cache<Key, Result> = []
    cache = awaitingResult(cache, keysAreEqual, bigLifetime, someRequestId, someKey)
    cache = resultArrived(cache, keysAreEqual, someRequestId, someKey, someResult, now)
    cache = clear(cache)
    cache = awaitingResult(cache, keysAreEqual, bigLifetime, someOtherRequestId, someKey)
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to handle race conditions', () => {
    let cache: Cache<Key, Result> = []
    cache = awaitingResult(cache, keysAreEqual, bigLifetime, someRequestId, someKey)
    cache = awaitingResult(cache, keysAreEqual, bigLifetime, someOtherRequestId, someKey)
    cache = resultArrived(cache, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))
    cache = resultArrived(cache, keysAreEqual, someOtherRequestId, someKey, someOtherResult, later)
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someOtherResult, later))
  })

  it('should be able to handle multiple requests', () => {
    let cache: Cache<Key, Result> = []
    cache = awaitingResult(cache, keysAreEqual, bigLifetime, someRequestId, someKey)
    cache = awaitingResult(cache, keysAreEqual, bigLifetime, someOtherRequestId, someOtherKey)
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(new AwaitingFirstResult(someRequestId))
    expect(getAsyncResultIfValid(cache, keysAreEqual, someOtherKey, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))

    cache = resultArrived(cache, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someResult, later))
    expect(getAsyncResultIfValid(cache, keysAreEqual, someOtherKey, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))

    cache = resultArrived(cache, keysAreEqual, someOtherRequestId, someOtherKey, someOtherResult, later)
    expect(getAsyncResultIfValid(cache, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someResult, later))
    expect(getAsyncResultIfValid(cache, keysAreEqual, someOtherKey, later)).toEqual(new ResultArrived(someOtherResult, later))
  })

  it('should only contain the maximum number of items', () => {
    let cache: Cache<Input, Result> = []
    const maxNumberOfItems = 4
    for (let i = 0; i < maxNumberOfItems; ++i) {
      const input: Input = { inputValue: 'input-' + i }
      const result: Result = { resultValue: i }
      const requestId = 'request-' + i
      const time = addSeconds(later, i)
      cache = awaitingResult(cache, inputEq, bigLifetime, requestId, input)
      cache = resultArrived(cache, inputEq, requestId, input, result, time)
    }

    expect(cache.length).toEqual(maxNumberOfItems)

    cache = awaitingResult(cache, inputEq, bigLifetime, someRequestId, someInput)
    cache = truncate(cache, maxNumberOfItems)
    expect(cache.length).toEqual(maxNumberOfItems + 1)

    const timeSomeResultArrived = addSeconds(later, maxNumberOfItems + 1)
    cache = resultArrived(cache, inputEq, someRequestId, someInput, someResult, timeSomeResultArrived)
    cache = truncate(cache, maxNumberOfItems)
    expect(cache.length).toEqual(maxNumberOfItems)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new ResultArrived(someResult, timeSomeResultArrived))
  })
})