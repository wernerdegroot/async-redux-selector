import { awaitingResult, CacheItems, clear, getAsyncResultIfValid, resultArrived, truncate } from '../CacheItems'
import { CacheItem } from '../CacheItem'
import { AwaitingFirstResult, AwaitingNextResult, ResultArrived, AsyncResult } from '../AsyncResult'
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
  someResult,
  muchLater
} from './data'
import { max, addSeconds } from 'date-fns';

describe('Cache items', () => {
  it('should not claim to hold results when empty', () => {
    const cacheItems: CacheItems<Key, AsyncResult<Result>> = []
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold a pending request', () => {
    let cacheItems: CacheItems<Key, AsyncResult<Result>> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingFirstResult(someRequestId))
  })

  it('should be able to hold a response', () => {
    let cacheItems: CacheItems<Key, AsyncResult<Result>> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someResult))
  })

  it('should be able to hold a response, but only until its lifetime has passed', () => {
    let cacheItems: CacheItems<Key, AsyncResult<Result>> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, smallLifetime, someRequestId, someKey, now)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold the previous response, when a new request was made', () => {
    let cacheItems: CacheItems<Key, AsyncResult<Result>> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey, now)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to hold the previous response, when a new request was made, even if the lifetime of the previous response has passed', () => {
    let cacheItems: CacheItems<Key, AsyncResult<Result>> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey, now)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be clearable', () => {
    let cacheItems: CacheItems<Key, AsyncResult<Result>> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = clear(cacheItems)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold the previous response when a new request was made, even if the cache items array was cleared', () => {
    let cacheItems: CacheItems<Key, AsyncResult<Result>> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = clear(cacheItems)
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey, now)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to handle race conditions', () => {
    let cacheItems: CacheItems<Key, AsyncResult<Result>> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey, now)
    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))
    cacheItems = resultArrived(cacheItems, keysAreEqual, someOtherRequestId, someKey, someOtherResult, later)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someOtherResult))
  })

  it('should be able to handle multiple requests', () => {
    let cacheItems: CacheItems<Key, AsyncResult<Result>> = []
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someOtherKey, now)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingFirstResult(someRequestId))
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someOtherKey, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))

    cacheItems = resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someResult))
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someOtherKey, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))

    cacheItems = resultArrived(cacheItems, keysAreEqual, someOtherRequestId, someOtherKey, someOtherResult, later)
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someResult))
    expect(getAsyncResultIfValid(cacheItems, keysAreEqual, someOtherKey, later)).toEqual(new ResultArrived(someOtherResult))
  })

  it('should only contain the maximum number of items', () => {

    const timeStepInMiliseconds = 10 * 1000
    const time1 = now
    const time2 = addSeconds(time1, timeStepInMiliseconds)
    const time3 = addSeconds(time2, timeStepInMiliseconds)
    const time4 = addSeconds(time3, timeStepInMiliseconds)

    const cacheItem1: CacheItem<number, string> = {
      key: 1,
      value: 'one',
      validityInMiliseconds: bigLifetime,
      forcedInvalid: false,
      updated: now
    }
    
    const cacheItem2: CacheItem<number, string> = {
      key: 2,
      value: 'two',
      validityInMiliseconds: bigLifetime,
      forcedInvalid: false,
      updated: later 
    }

    const cacheItem3: CacheItem<number, string> = {
      key: 3,
      value: 'three',
      validityInMiliseconds: bigLifetime,
      forcedInvalid: false,
      updated: muchLater 
    }

    const cacheItems = [cacheItem2, cacheItem1, cacheItem3]
    const truncatedCacheItems = truncate(cacheItems, 2)
    expect(truncatedCacheItems).toEqual([cacheItem2, cacheItem3])
  })
})