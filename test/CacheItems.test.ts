import { awaitingResult, CacheItems, clear, getAsyncResultIfValid, resultArrived, truncate } from '../CacheItems'
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

describe('Cache items', () => {
  it('should not claim to hold results when empty', () => {
    const cacheItems: CacheItems<Key, Result> = []
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold a pending request', () => {
    let cacheItems: CacheItems<Key, Result> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingFirstResult(someRequestId))
  })

  it('should be able to hold a response', () => {
    let cacheItems: CacheItems<Key, Result> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someResult, now))
  })

  it('should be able to hold a response, but only until its lifetime has passed', () => {
    let cacheItems: CacheItems<Key, Result> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, smallLifetime, someRequestId, someKey)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold the previous response, when a new request was made', () => {
    let cacheItems: CacheItems<Key, Result> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to hold the previous response, when a new request was made, even if the lifetime of the previous response has passed', () => {
    let cacheItems: CacheItems<Key, Result> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, smallLifetime, someRequestId, someKey)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = awaitingResult(cacheItems, keysAreEqual, smallLifetime, someOtherRequestId, someKey)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be clearable', () => {
    let cacheItems: CacheItems<Key, Result> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = clear(cacheItems)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold the previous response when a new request was made, even if the cache items array was cleared', () => {
    let cacheItems: CacheItems<Key, Result> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = clear(cacheItems)
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to handle race conditions', () => {
    let cacheItems: CacheItems<Key, Result> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey)
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))
    cacheItems = resultArrived(cacheItems, keysAreEqual, someOtherRequestId, someKey, someOtherResult, later)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someOtherResult, later))
  })

  it('should be able to handle multiple requests', () => {
    let cacheItems: CacheItems<Key, Result> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey)
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someOtherKey)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingFirstResult(someRequestId))
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someOtherKey, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))

    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someResult, later))
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someOtherKey, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))

    cacheItems = resultArrived(cacheItems, keysAreEqual, someOtherRequestId, someOtherKey, someOtherResult, later)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someResult, later))
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someOtherKey, later)).toEqual(new ResultArrived(someOtherResult, later))
  })

  it('should only contain the maximum number of items', () => {
    let cacheItems: CacheItems<Key, Result> = []
    const maxNumberOfItems = 4
    for (let i = 0; i < maxNumberOfItems; ++i) {
      const key: Key = 'key-' + i
      const result: Result = { resultValue: i }
      const requestId = 'request-' + i
      const time = addSeconds(later, i)
      cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, requestId, key)
      cacheItems = resultArrived(cacheItems, keysAreEqual, requestId, key, result, time)
    }

    expect(cacheItems.length).toEqual(maxNumberOfItems)

    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey)
    cacheItems = truncate(cacheItems, maxNumberOfItems)
    expect(cacheItems.length).toEqual(maxNumberOfItems + 1)

    const timeSomeResultArrived = addSeconds(later, maxNumberOfItems + 1)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, timeSomeResultArrived)
    cacheItems = truncate(cacheItems, maxNumberOfItems)
    expect(cacheItems.length).toEqual(maxNumberOfItems)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someResult, timeSomeResultArrived))
  })
})