import {
  AsyncResult,
  AWAITING_FIRST_RESULT,
  AWAITING_NEXT_RESULT,
  AwaitingNextResult,
  RESULT_ARRIVED,
  ResultArrived
} from './AsyncResult'
import { awaitingResultAction, ResourceAction, resultArrivedAction } from './Action'
import { getAsyncResultIfValid, Cache } from './Cache'

export const ADVICE = 'ADVICE'

export type Dispatcher<Action> = (action: Action) => void
export type ThunkAction<Action, State> = (dispatch: Dispatcher<Action>, getState: () => State) => void

export interface IHasAdvice<Action, State> {
  readonly type: 'ADVICE'

  followAdvice(dispatch: (action: Action) => void): void

  followAdviceThunk(dispatch: (action: Action) => void, getState: () => State): void
}

export class DefaultHasAdvice<I, R, Action, State> {
  readonly type: 'ADVICE' = ADVICE

  constructor(
    private readonly runner: (input: I) => Promise<R>,
    private readonly cacheSelector: (state: State) => Cache<I, R>,
    private readonly inputEq: (left: I, right: I) => boolean,
    private readonly input: I,
    private readonly resourceId: string,
    private readonly requestId: string
  ) { }

  followAdvice = (dispatch: (action: ResourceAction<I, R>) => void): void => {
    dispatch(awaitingResultAction(this.resourceId, this.requestId, this.input, new Date()))
    this.runner(this.input).then(result => {
      dispatch(resultArrivedAction(this.resourceId, this.requestId, this.input, result, new Date()))
    })
  }

  followAdviceThunk = (dispatch: (action: ResourceAction<I, R>) => void, getState: () => State): void => {
    const cache = this.cacheSelector(getState())
    if (getAsyncResultIfValid(cache, this.inputEq, this.input, new Date()) === undefined) {
      this.followAdvice(dispatch)
    }
  }
}

export type AsyncResultOrAdvice<R, Action, State> = AsyncResult<R> | IHasAdvice<Action, State>

export class AsyncResultOrAdvicePipe<R, Action, State> {

  constructor(public readonly value: AsyncResultOrAdvice<R, Action, State>) {
  }

  getOrElse(alternative: R): R {
    return AsyncResultOrAdvice.getOrElse(this.value, alternative)
  }

  map<RR>(fn: (r: R) => RR): AsyncResultOrAdvicePipe<RR, Action, State> {
    return new AsyncResultOrAdvicePipe(AsyncResultOrAdvice.map(this.value, fn))
  }

  flatMap<RR>(fn: (r: R) => AsyncResultOrAdvice<RR, Action, State>): AsyncResultOrAdvicePipe<RR, Action, State> {
    return new AsyncResultOrAdvicePipe(AsyncResultOrAdvice.flatMap(this.value, fn))
  }
}

export const AsyncResultOrAdvice = {

  of<R, Action, State>(aroa: AsyncResultOrAdvice<R, Action, State>): AsyncResultOrAdvicePipe<R, Action, State> {
    return new AsyncResultOrAdvicePipe(aroa)
  },

  getOrElse<R, Action, State>(aroa: AsyncResultOrAdvice<R, Action, State>, alternative: R): R {
    if (aroa.type === AWAITING_NEXT_RESULT) {
      return aroa.previousResult
    } else if (aroa.type === RESULT_ARRIVED) {
      return aroa.result
    } else {
      return alternative
    }
  },

  map<A, B, Action, State>(aroa: AsyncResultOrAdvice<A, Action, State>, fn: (a: A) => B): AsyncResultOrAdvice<B, Action, State> {
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

  flatMap<A, B, Action, State>(aroa: AsyncResultOrAdvice<A, Action, State>, fn: (a: A) => AsyncResultOrAdvice<B, Action, State>): AsyncResultOrAdvice<B, Action, State> {
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
