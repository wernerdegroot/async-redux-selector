import {
  AsyncResult,
  AWAITING_FIRST_RESULT,
  AWAITING_NEXT_RESULT,
  AwaitingNextResult,
  RESULT_ARRIVED,
  ResultArrived
} from './AsyncResult'
import { awaitingResultAction, ResourceAction, resultArrivedAction } from './Action'
import { getAsyncResultIfValid, CacheItems } from './Cache'

export const ADVICE = 'ADVICE'

export interface IAdvice<Action, State> {
  readonly type: 'ADVICE'

  followAdvice(dispatch: (action: Action) => void, getState: () => State): Promise<void>
}

export class DefaultAdvice<Input, Key, Result, State> implements IAdvice<ResourceAction<Key, Result>, State> {
  readonly type: 'ADVICE' = ADVICE

  constructor(private readonly runner: (input: Input, getState: () => State) => Promise<Result>,
              private readonly cacheSelector: (state: State) => CacheItems<Key, Result>,
              private readonly inputToKey: (input: Input) => Key,
              private readonly keysAreEqual: (left: Key, right: Key) => boolean,
              private readonly input: Input,
              private readonly resourceId: string,
              private readonly requestId: string) {
  }

  followAdvice = (dispatch: (action: ResourceAction<Key, Result>) => void, getState: () => State): Promise<void> => {
    const key = this.inputToKey(this.input)
    const cache = this.cacheSelector(getState())
    if (getAsyncResultIfValid(cache, this.keysAreEqual, key, new Date()) === undefined) {
      dispatch(awaitingResultAction(this.resourceId, this.requestId, key, new Date()))
      return this.runner(this.input, getState).then(result => {
        dispatch(resultArrivedAction(this.resourceId, this.requestId, key, result, new Date()))
      })
    } else {
      return Promise.resolve()
    }
  }
}

export type AsyncResultOrAdvice<Result, Action, State> = AsyncResult<Result> | IAdvice<Action, State>

export class AsyncResultOrAdvicePipe<A, Action, State> {

  constructor(public readonly value: AsyncResultOrAdvice<A, Action, State>) {
  }

  getOrElse(alternative: A): A {
    return AsyncResultOrAdvice.getOrElse(this.value, alternative)
  }

  map<B>(fn: (result: A) => B): AsyncResultOrAdvicePipe<B, Action, State> {
    return new AsyncResultOrAdvicePipe(AsyncResultOrAdvice.map(this.value, fn))
  }

  flatMap<B>(fn: (result: A) => AsyncResultOrAdvice<B, Action, State>): AsyncResultOrAdvicePipe<B, Action, State> {
    return new AsyncResultOrAdvicePipe(AsyncResultOrAdvice.flatMap(this.value, fn))
  }
}

export const AsyncResultOrAdvice = {

  of<A, Action, State>(aroa: AsyncResultOrAdvice<A, Action, State>): AsyncResultOrAdvicePipe<A, Action, State> {
    return new AsyncResultOrAdvicePipe(aroa)
  },

  getOrElse<A, Action, State>(aroa: AsyncResultOrAdvice<A, Action, State>, alternative: A): A {
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
