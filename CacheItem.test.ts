import { addMilliseconds } from 'date-fns'
import { CacheItem } from './CacheItem'
import { AwaitingFirstResult, ResultArrived } from './AsyncResult'

type Input = {
  inputValue: string
}

const someInput: Input = {
  inputValue: 'some-input'
}

type Result = {
  resultValue: number
}

const someResult: Result = {
  resultValue: 4
}

const someId = 'some-requestId'
const someOtherId = 'some-other-requestId'

const now = new Date(2018, 3, 8, 2, 4, 1)
const smallLifetime = 2 * 60 * 1000
const bigLifetime = 6 * 60 * 1000
const later = addMilliseconds(now, (smallLifetime + bigLifetime) / 2)

describe('CacheItem', () => {
  it('should not be valid after it was forced to be invalid', () => {
    const asyncResultArrived = new ResultArrived(someResult, now)
    const expectedValid = new CacheItem(someInput, asyncResultArrived, bigLifetime, false)
    const expectedInvalid = expectedValid.forceInvalid()

    expect(expectedValid.isValid(later)).toEqual(true)
    expect(expectedInvalid.isValid(later)).toEqual(false)
  })

  it('should not be valid after its lifetime is over', () => {
    const asyncResultArrived = new ResultArrived(someResult, now)
    const expectedInvalid = new CacheItem(someInput, asyncResultArrived, smallLifetime, false)
    expect(expectedInvalid.isValid(later)).toEqual(false)
  })

  it('should be valid when the result has not arrived yet', () => {
    const asyncResultAwaiting = new AwaitingFirstResult(someId)
    const expectedValid = new CacheItem(someInput, asyncResultAwaiting, smallLifetime, false)
    expect(expectedValid.isValid(later)).toEqual(true)
  })

  it('should be valid when the result has not arrived yet, even if it was forced to be invalid', () => {
    const asyncResultAwaiting = new AwaitingFirstResult(someId)
    const expectedValid = new CacheItem(someInput, asyncResultAwaiting, smallLifetime, true)
    expect(expectedValid.isValid(later)).toEqual(true)
  })

  it('should contain a result (and not be invalid) when a result arrived with the right requestId', () => {
    const asyncResultAwaiting = new AwaitingFirstResult(someId)
    const cacheItem = new CacheItem(someInput, asyncResultAwaiting, smallLifetime, true)
    const cacheItemWithResult = cacheItem.resultArrived(someId, someResult, now)

    expect(cacheItemWithResult.asyncResult).toEqual(new ResultArrived(someResult, now))
    expect(cacheItemWithResult.isValid(now)).toEqual(true)
  })

  it('should not contain a result when a result arrived with the wrong requestId', () => {
    const asyncResultAwaiting = new AwaitingFirstResult(someId)
    const cacheItem = new CacheItem(someInput, asyncResultAwaiting, smallLifetime, true)
    const cacheItemWithResult = cacheItem.resultArrived(someOtherId, someResult, now)

    expect(cacheItemWithResult.asyncResult).toEqual(asyncResultAwaiting)
  })
})