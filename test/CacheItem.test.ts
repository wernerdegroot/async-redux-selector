import { addMilliseconds } from 'date-fns'
import { CacheItem } from '../CacheItem'
import { AwaitingFirstResult, ResultArrived } from '../AsyncResult'
import {
  bigLifetime, inputToKey, later, now, smallLifetime, someInput, someKey, someOtherRequestId, someRequestId,
  someResult
} from './data'

describe('CacheItem', () => {
  it('should not be valid after it was forced to be invalid', () => {
    const asyncResultArrived = new ResultArrived(someResult, now)
    const expectedValid = new CacheItem(someKey, asyncResultArrived, bigLifetime, false)
    const expectedInvalid = expectedValid.forceInvalid()

    expect(expectedValid.isValid(later)).toEqual(true)
    expect(expectedInvalid.isValid(later)).toEqual(false)
  })

  it('should not be valid after its lifetime is over', () => {
    const asyncResultArrived = new ResultArrived(someResult, now)
    const expectedInvalid = new CacheItem(someKey, asyncResultArrived, smallLifetime, false)
    expect(expectedInvalid.isValid(later)).toEqual(false)
  })

  it('should be valid when the result has not arrived yet', () => {
    const asyncResultAwaiting = new AwaitingFirstResult(someRequestId)
    const expectedValid = new CacheItem(someKey, asyncResultAwaiting, smallLifetime, false)
    expect(expectedValid.isValid(later)).toEqual(true)
  })

  it('should be valid when the result has not arrived yet, even if it was forced to be invalid', () => {
    const asyncResultAwaiting = new AwaitingFirstResult(someRequestId)
    const expectedValid = new CacheItem(someKey, asyncResultAwaiting, smallLifetime, true)
    expect(expectedValid.isValid(later)).toEqual(true)
  })

  it('should contain a result (and not be invalid) when a result arrived with the right requestId', () => {
    const asyncResultAwaiting = new AwaitingFirstResult(someRequestId)
    const cacheItem = new CacheItem(someKey, asyncResultAwaiting, smallLifetime, true)
    const cacheItemWithResult = cacheItem.resultArrived(someRequestId, someResult, now)

    expect(cacheItemWithResult.asyncResult).toEqual(new ResultArrived(someResult, now))
    expect(cacheItemWithResult.isValid(now)).toEqual(true)
  })

  it('should not contain a result when a result arrived with the wrong requestId', () => {
    const asyncResultAwaiting = new AwaitingFirstResult(someRequestId)
    const cacheItem = new CacheItem(someKey, asyncResultAwaiting, smallLifetime, true)
    const cacheItemWithResult = cacheItem.resultArrived(someOtherRequestId, someResult, now)

    expect(cacheItemWithResult.asyncResult).toEqual(asyncResultAwaiting)
  })
})