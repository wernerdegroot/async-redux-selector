import {
  AsyncResult,
  AWAITING_FIRST_RESULT,
  AWAITING_NEXT_RESULT,
  AwaitingNextResult,
  RESULT_ARRIVED,
  ResultArrived
} from './AsyncResult'

export const ADVICE = 'ADVICE'

export abstract class HasAdvice<Action> {
  public readonly type: 'ADVICE' = ADVICE

  abstract followAdvice(dispatch: (action: Action) => void): void
}

export type AsyncResultOrAdvice<R, Action> = AsyncResult<R> | HasAdvice<Action>

export class AsyncResultOrAdvicePipe<R, Action> {

  constructor(public readonly value: AsyncResultOrAdvice<R, Action>) { }

  getOrElse(alternative: R): R {
    return AsyncResultOrAdvice.getOrElse(this.value, alternative)
  }

  map<RR>(fn: (r: R) => RR): AsyncResultOrAdvicePipe<RR, Action> {
    return new AsyncResultOrAdvicePipe(AsyncResultOrAdvice.map(this.value, fn))
  }

  flatMap<RR>(fn: (r: R) => AsyncResultOrAdvice<RR, Action>): AsyncResultOrAdvicePipe<RR, Action> {
    return new AsyncResultOrAdvicePipe(AsyncResultOrAdvice.flatMap(this.value, fn))
  }
}

export const AsyncResultOrAdvice = {

  of<R, Action>(aroa: AsyncResultOrAdvice<R, Action>): AsyncResultOrAdvicePipe<R, Action> {
    return new AsyncResultOrAdvicePipe(aroa)
  },

  getOrElse<R, Action>(aroa: AsyncResultOrAdvice<R, Action>, alternative: R): R {
    if (aroa.type === AWAITING_NEXT_RESULT) {
      return aroa.previousResult
    } else if (aroa.type === RESULT_ARRIVED) {
      return aroa.result
    } else {
      return alternative
    }
  },

  map<A, B, Action>(aroa: AsyncResultOrAdvice<A, Action>, fn: (a: A) => B): AsyncResultOrAdvice<B, Action> {
    if (aroa.type === ADVICE) {
      return aroa
    } else if (aroa.type === AWAITING_FIRST_RESULT) {
      return aroa
    } else if (aroa.type === AWAITING_NEXT_RESULT) {
      return new AwaitingNextResult(aroa.requestId, fn(aroa.previousResult))
    } else if (aroa.type === RESULT_ARRIVED) {
      return new ResultArrived(fn(aroa.result), aroa.when)
    } else {
      const exhaustive: never = aroa
      throw aroa
    }
  },

  flatMap<A, B, Action>(aroa: AsyncResultOrAdvice<A, Action>, fn: (a: A) => AsyncResultOrAdvice<B, Action>): AsyncResultOrAdvice<B, Action> {
    if (aroa.type === ADVICE) {
      return aroa
    } else if (aroa.type === AWAITING_FIRST_RESULT) {
      return aroa
    } else if (aroa.type === AWAITING_NEXT_RESULT) {
      return fn(aroa.previousResult)
    } else if (aroa.type === RESULT_ARRIVED) {
      return fn(aroa.result)
    } else {
      const exhaustive: never = aroa
      throw aroa
    }
  }
}
