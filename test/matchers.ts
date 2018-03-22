import { GenericAction, isAwaitingResultAction, isResultArrivedAction } from '../Action'
import { Input, inputEq, Result, resultEq } from './data'

export type IMatcher<A> = (a: A) => true | string

export function assert<A>(a: A): { toMatch(matcher: IMatcher<A>): void } {
  return {
    toMatch(matcher: IMatcher<A>): void {
      const result = matcher(a)
      if (result !== true) {
        fail(result)
      }
    }
  }
}

export const matchesAll = <A>(matchers: Array<IMatcher<A>>): IMatcher<A[]> => (as: A[]) => {
  if (matchers.length !== as.length) {
    return `Expected ${matchers.length} but got ${as.length} elements`
  } else {
    for (let i = 0; i < matchers.length; ++i) {
      const matcher = matchers[i]
      const a = as[i]

      const result = matcher(a)
      if (result !== true) {
        return `Match error at index ${i}: ${result}`
      }
    }
  }

  return true
}

export const matchAwaitingResult = (input: Input): IMatcher<GenericAction> => (action: GenericAction) => {
  if (isAwaitingResultAction<Input>(action)) {
    if (inputEq(action.input, input)) {
      return true
    } else {
      return `Input ${JSON.stringify(action.input)} not equal to ${JSON.stringify(input)}`
    }
  } else {
    return `Not 'AWAITING_RESULT_ACTION'`
  }
}

export const matchResultArrived = (input: Input, result: Result): IMatcher<GenericAction> => (action: GenericAction) => {
  if (isResultArrivedAction<Input, Result>(action)) {
    if (!inputEq(action.input, input)) {
      return `Input ${JSON.stringify(action.input)} not equal to ${JSON.stringify(input)}`
    } else if (!resultEq(action.result, result)) {
      return `Result ${JSON.stringify(action.result)} not equal to ${JSON.stringify(result)}`
    } else {
      return true
    }
  } else {
    return `Not 'AWAITING_RESULT_ACTION'`
  }
}
