import { addMilliseconds } from 'date-fns'
import { awaitingResult, Cache, clear, getAsyncResultIfValid, resultArrived } from '../Cache'
import { AwaitingFirstResult, AwaitingNextResult, ResultArrived } from '../AsyncResult'

type Input = {
  inputValue: string
}

function inputEq(left: Input, right: Input): boolean {
  return left.inputValue === right.inputValue
}

const someInput: Input = {
  inputValue: 'some-input'
}

const someOtherInput: Input = {
  inputValue: 'some-other-input'
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

describe('Cache', () => {
  it('should initially be empty', () => {
    const cache: Cache<Input, Result> = []
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(undefined)
  })

  it('should be able to hold a pending request', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, bigLifetime, someId, someInput)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AwaitingFirstResult(someId))
  })

  it('should be able to hold a response', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, bigLifetime, someId, someInput)
    cache = resultArrived(cache, inputEq, someId, someInput, someResult, now)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new ResultArrived(someResult, now))
  })

  it('should be able to hold a response, but only until its lifetime has passed', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, smallLifetime, someId, someInput)
    cache = resultArrived(cache, inputEq, someId, someInput, someResult, now)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(undefined)
  })

  it('should be able to hold the previous response, when a new request was made', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, bigLifetime, someId, someInput)
    cache = resultArrived(cache, inputEq, someId, someInput, someResult, now)
    cache = awaitingResult(cache, inputEq, bigLifetime, someOtherId, someInput)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AwaitingNextResult(someOtherId, someResult))
  })

  it('should be able to hold the previous response, when a new request was made, even if the lifetime of the previous response has passed', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, smallLifetime, someId, someInput)
    cache = resultArrived(cache, inputEq, someId, someInput, someResult, now)
    cache = awaitingResult(cache, inputEq, smallLifetime, someOtherId, someInput)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AwaitingNextResult(someOtherId, someResult))
  })

  it('should be clearable', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, bigLifetime, someId, someInput)
    cache = resultArrived(cache, inputEq, someId, someInput, someResult, now)
    cache = clear(cache)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(undefined)
  })

  it('should be able to hold the previous response, when a new request was made, even if the cache was cleared', () => {
    let cache: Cache<Input, Result> = []
    cache = awaitingResult(cache, inputEq, bigLifetime, someId, someInput)
    cache = resultArrived(cache, inputEq, someId, someInput, someResult, now)
    cache = clear(cache)
    cache = awaitingResult(cache, inputEq, bigLifetime, someOtherId, someInput)
    expect(getAsyncResultIfValid(cache, inputEq, someInput, later)).toEqual(new AwaitingNextResult(someOtherId, someResult))
  })
})