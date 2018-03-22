import { addMilliseconds } from 'date-fns'

export type Input = {
  inputValue: string
}

export function inputEq(left: Input, right: Input): boolean {
  return left.inputValue === right.inputValue
}

export type Result = {
  resultValue: number
}

export function resultEq(left: Result, right: Result): boolean {
  return left.resultValue === right.resultValue
}

export const someInput: Input = {
  inputValue: 'some-input'
}

export const someOtherInput: Input = {
  inputValue: 'some-other-input'
}

export const someResult: Result = {
  resultValue: 4
}

export const someRequestId = 'some-request-id'
export const someOtherRequestId = 'some-other-request-id'

export const someResourceId = 'some-resource-id'

export const now = new Date(2018, 3, 8, 2, 4, 1)
export const smallLifetime = 2 * 60 * 1000
export const bigLifetime = 6 * 60 * 1000
export const later = addMilliseconds(now, (smallLifetime + bigLifetime) / 2)
