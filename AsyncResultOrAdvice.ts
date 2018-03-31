import { awaitingResultAction, ResourceAction, resultArrivedAction } from './Action'
import {
  AsyncResult,
  AWAITING_RESULT,
  AwaitingResult,
  RESULT_ARRIVED,
  ResultArrived,
} from './AsyncResult'
import { AsyncResultCacheItems } from './AsyncResultCacheItems'
import { CacheItems } from './CacheItems'

export const ADVICE = 'ADVICE'

export interface IAdvice<Action, State> {
  readonly type: 'ADVICE'

  followAdvice(dispatch: (action: Action) => void, getState: () => State): Promise<void>
}

export class DefaultAdvice<Input, Key, Result, State> implements IAdvice<ResourceAction<Key, Result>, State> {
  readonly type: 'ADVICE' = ADVICE

  constructor(private readonly getPromise: (getState: () => State) => Promise<Result>,
              private readonly cacheItemsSelector: (state: State) => CacheItems<Key, AsyncResult<Result>>,
              private readonly keysAreEqual: (left: Key, right: Key) => boolean,
              private readonly key: Key,
              private readonly cacheId: string,
              private readonly requestId: string) {
  }

  followAdvice = (dispatch: (action: ResourceAction<Key, Result>) => void, getState: () => State): Promise<void> => {
    const cacheItems = this.cacheItemsSelector(getState())
    if (AsyncResultCacheItems.getAsyncResultIfValid(cacheItems, this.keysAreEqual, this.key, new Date()) === undefined) {
      dispatch(awaitingResultAction(this.cacheId, this.requestId, this.key, new Date()))
      return this.getPromise(getState).then(result => {
        dispatch(resultArrivedAction(this.cacheId, this.requestId, this.key, result, new Date()))
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
    if (aroa.type === AWAITING_RESULT && aroa.previousResult !== undefined) {
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
    } else if (aroa.type === AWAITING_RESULT) {
      if (aroa.previousResult === undefined) {
        return AsyncResult.awaitingFirstResult(aroa.requestId)
      } else {
        return AsyncResult.awaitingNextResult(aroa.requestId, fn(aroa.previousResult)) 
      }
    } else if (aroa.type === RESULT_ARRIVED) {
      return AsyncResult.resultArrived(aroa.requestId, fn(aroa.result))
    } else {
      const exhaustive: never = aroa
      throw aroa
    }
  },

  flatMap<A, B, Action, State>(aroa: AsyncResultOrAdvice<A, Action, State>, fn: (a: A) => AsyncResultOrAdvice<B, Action, State>): AsyncResultOrAdvice<B, Action, State> {
    if (aroa.type === ADVICE) {
      return aroa
    } else if (aroa.type === AWAITING_RESULT) {
      if (aroa.previousResult === undefined) {
        return AsyncResult.awaitingFirstResult(aroa.requestId)
      } else {
        return fn(aroa.previousResult)
      }
    } else if (aroa.type === RESULT_ARRIVED) {
      return fn(aroa.result)
    } else {
      const exhaustive: never = aroa
      throw aroa
    }
  }
}
