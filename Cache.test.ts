import { addMilliseconds } from 'date-fns'
import { Cache } from './Cache'
import { AwaitingFirstResult, AwaitingNextResult, ResultArrived } from './AsyncResult'

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

const someId = 'some-id'
const someOtherId = 'some-other-id'

const now = new Date(2018, 3, 8, 2, 4, 1)
const smallLifetime = 2 * 60 * 1000
const bigLifetime = 6 * 60 * 1000
const later = addMilliseconds(now, (smallLifetime + bigLifetime) / 2)

describe('Cache', () => {
  it('should initially be empty', () => {
    const cache = new Cache<Input, Result>([], inputEq, bigLifetime)
    expect(cache.getAsyncResult(someInput, later)).toEqual(undefined)
  })

  it('should be able to hold a pending request', () => {
    const cache = new Cache<Input, Result>([], inputEq, bigLifetime)
      .awaitingResult(someId, someInput)
    expect(cache.getAsyncResult(someInput, later)).toEqual(new AwaitingFirstResult(someId))
  })

  it('should be able to hold a response', () => {
    const cache = new Cache<Input, Result>([], inputEq, bigLifetime)
      .awaitingResult(someId, someInput)
      .resultArrived(someId, someInput, someResult, now)
    expect(cache.getAsyncResult(someInput, later)).toEqual(new ResultArrived(someId, someResult, now))
  })

  it('should be able to hold a response, but only until its lifetime has passed', () => {
    const cache = new Cache<Input, Result>([], inputEq, smallLifetime)
      .awaitingResult(someId, someInput)
      .resultArrived(someId, someInput, someResult, now)
    expect(cache.getAsyncResult(someInput, later)).toEqual(undefined)
  })

  it('should be able to hold the previous response, when a new request was made', () => {
    const cache = new Cache<Input, Result>([], inputEq, bigLifetime)
      .awaitingResult(someId, someInput)
      .resultArrived(someId, someInput, someResult, now)
      .awaitingResult(someOtherId, someInput)
    expect(cache.getAsyncResult(someInput, later)).toEqual(new AwaitingNextResult(someOtherId, someResult))
  })

  it('should be able to hold the previous response, when a new request was made, even if the lifetime of the previous response has passed', () => {
    const cache = new Cache<Input, Result>([], inputEq, smallLifetime)
      .awaitingResult(someId, someInput)
      .resultArrived(someId, someInput, someResult, now)
      .awaitingResult(someOtherId, someInput)
    expect(cache.getAsyncResult(someInput, later)).toEqual(new AwaitingNextResult(someOtherId, someResult))
  })
})