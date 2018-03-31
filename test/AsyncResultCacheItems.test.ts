import { AwaitingFirstResult, AwaitingNextResult, ResultArrived } from '../AsyncResult'
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

describe('Cache items containing `AsyncResult`-instances', () => {
  it('should not claim to hold results when empty', () => {
    const cacheItems: AsyncResultCacheItems<Key, Result> = []
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold a pending request', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingFirstResult(someRequestId))
  })

  it('should be able to hold a response', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someRequestId, someResult))
  })

  it('should ignore the result if the lifetime of the pending request has passed', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, smallLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold a response, but only until its lifetime has passed', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, smallLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold a response, even if the lifetime of the pending request has passed', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, muchLater)).toEqual(new ResultArrived(someRequestId, someResult))
  })

  it('should be able to hold the previous response, when a new request was made', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey, now)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to hold the previous response, when a new request was made, even if the lifetime of the previous response has passed', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, smallLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, smallLifetime, someOtherRequestId, someKey, later)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be clearable', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = AsyncResultCacheItems.clear(cacheItems)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(undefined)
  })

  it('should be able to hold the previous response when a new request was made, even if the cache items array was cleared', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, now)
    cacheItems = AsyncResultCacheItems.clear(cacheItems)
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey, now)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingNextResult(someOtherRequestId, someResult))
  })

  it('should be able to handle race conditions (1)', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someOtherRequestId, someKey, someOtherResult, later)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someOtherRequestId, someOtherResult))
  })

  it('should be able to handle race conditions (2)', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someOtherRequestId, someKey, someOtherResult, later)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someOtherRequestId, someOtherResult))
    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someOtherRequestId, someOtherResult))
  })

  it('should be able to handle multiple requests', () => {
    let cacheItems: AsyncResultCacheItems<Key, Result> = []
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someRequestId, someKey, now)
    cacheItems = AsyncResultCacheItems.awaitingResult(cacheItems, keysAreEqual, bigLifetime, someOtherRequestId, someOtherKey, now)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new AwaitingFirstResult(someRequestId))
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someOtherKey, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))

    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someRequestId, someKey, someResult, later)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someRequestId, someResult))
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someOtherKey, later)).toEqual(new AwaitingFirstResult(someOtherRequestId))

    cacheItems = AsyncResultCacheItems.resultArrived(cacheItems, keysAreEqual, someOtherRequestId, someOtherKey, someOtherResult, later)
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someKey, later)).toEqual(new ResultArrived(someRequestId, someResult))
    expect(AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, keysAreEqual, someOtherKey, later)).toEqual(new ResultArrived(someOtherRequestId, someOtherResult))
  })
})
