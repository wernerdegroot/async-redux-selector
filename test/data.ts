import { addMilliseconds } from 'date-fns'

import { AsyncResult } from '../AsyncResult'
import { CacheItems } from '../CacheItems'

export type Input = {
  key: string
}

export type Key = string

export function inputToKey(input: Input): Key {
  return input.key + "-as-key"
}

export function keysAreEqual(left: Key, right: Key): boolean {
  return left === right
}

export type Result = {
  resultValue: number
}

export function resultEq(left: Result, right: Result): boolean {
  return left.resultValue === right.resultValue
}

export const someKey = 'some-key'
export const someOtherKey = 'some-other-key'

export const someInput: Input = {
  key: someKey
}

export const someOtherInput: Input = {
  key: someOtherKey
}

export const someResult: Result = {
  resultValue: 4
}

export const someOtherResult: Result = {
  resultValue: 5
}

export type State = {
  cacheItems: CacheItems<string, AsyncResult<Result>>
}

export const someRequestId = 'some-request-id'
export const someOtherRequestId = 'some-other-request-id'

export const someCacheId = 'some-resource-id'

export const now = new Date(2018, 3, 8, 2, 4, 1)
export const smallLifetime = 2 * 60 * 1000
export const bigLifetime = 6 * 60 * 1000

const timeStepInMiliseconds = (smallLifetime + bigLifetime) / 2
export const later = addMilliseconds(now, timeStepInMiliseconds)
export const muchLater = addMilliseconds(later, timeStepInMiliseconds)
