import { AwaitingResult, ResultArrived, AsyncResult } from '../AsyncResult'
import { AsyncResultCacheItems } from '../AsyncResultCacheItems'
import {
  bigLifetime,
  Key,
  keysAreEqual,
  later,
  muchLater,
  now,
  Result,
  smallLifetime,
  someKey,
  someOtherKey,
  someOtherRequestId,
  someOtherResult,
  someRequestId,
  someResult,
} from './data'
import { CacheItems } from '../CacheItems';

describe('Cache items containing `AsyncResult`-instances', () => {
  it('should not claim to hold results when empty', () => {
    const cacheItems: AsyncResultCacheItems<Key, Result> = []
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold a pending request', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(AsyncResult.awaitingFirstResult(someRequestId))
  })

  it('should be able to hold a response', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(AsyncResult.resultArrived(someRequestId, someResult))
  })

  it('should ignore the result if the lifetime of the pending request has passed', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, smallLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold a response, but only until its lifetime has passed', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, smallLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold a response, even if the lifetime of the pending request has passed', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, muchLater)).toEqual(AsyncResult.resultArrived(someRequestId, someResult))
  })

  it('should be able to hold the previous response, when a new request was made', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey, now)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(AsyncResult.awaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to hold the previous response, when a new request was made, even if the lifetime of the previous response has passed', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, smallLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, smallLifetime, someOtherRequestId, someKey, later)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(AsyncResult.awaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to hold the previous response when a new request was made, even if the cache items array was cleared', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = CacheItems.clear(cacheItems)
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey, now)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(AsyncResult.awaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to handle race conditions (1)', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(AsyncResult.awaitingFirstResult(someOtherRequestId))
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someOtherRequestId, someKey, someOtherResult, later)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(AsyncResult.resultArrived(someOtherRequestId, someOtherResult))
  })

  it('should be able to handle race conditions (2)', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someOtherRequestId, someKey, someOtherResult, later)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(AsyncResult.resultArrived(someOtherRequestId, someOtherResult))
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(AsyncResult.resultArrived(someOtherRequestId, someOtherResult))
  })

  it('should be able to handle multiple requests', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someOtherKey, now)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(AsyncResult.awaitingFirstResult(someRequestId))
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someOtherKey, later)).toEqual(AsyncResult.awaitingFirstResult(someOtherRequestId))

    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(AsyncResult.resultArrived(someRequestId, someResult))
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someOtherKey, later)).toEqual(AsyncResult.awaitingFirstResult(someOtherRequestId))

    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someOtherRequestId, someOtherKey, someOtherResult, later)
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(AsyncResult.resultArrived(someRequestId, someResult))
    expect(CacheItems.getValueIfValid(cacheItems, keysAreEqual, someOtherKey, later)).toEqual(AsyncResult.resultArrived(someOtherRequestId, someOtherResult))
  })
})
