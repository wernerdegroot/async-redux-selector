import { awaitingResult, Cache, getAsyncResultIfValid, resultArrived, truncate } from './Cache'
import { v4 as uuid } from 'uuid'
import { ADVICE, AsyncResultOrAdvice, DefaultHasAdvice, IHasAdvice } from './AsyncResultOrAdvice'
import { CacheItem } from './CacheItem' // Required to prevent compile error.
import { GenericAction, isAwaitingResultAction, isResultArrivedAction } from './Action'
import { ResourceAction } from './Action'

export class Resource<I, R, Action extends { type: string }, State> {

  constructor(public readonly resourceId: string,
              private readonly runner: (input: I) => Promise<R>,
              private readonly cacheSelector: (state: State) => Cache<I, R>,
              private readonly inputEq: (left: I, right: I) => boolean,
              private readonly validityInMiliseconds: number,
              private readonly maxNumberOfCacheItems: number) {

  }

  public selector = (cache: Cache<I, R>, input: I): AsyncResultOrAdvice<R, ResourceAction<I, R>, State> => {
    const now = new Date()
    const possibleAsyncResult = getAsyncResultIfValid(cache, this.inputEq, input, now)
    if (possibleAsyncResult === undefined) {
      return this.getAdvice(input)
    } else {
      return possibleAsyncResult
    }
  }

  public reducer = (cache: Cache<I, R> = [], action: GenericAction): Cache<I, R> => {
    if (isAwaitingResultAction<I>(action)) {
      return action.resourceId === this.resourceId
        ? awaitingResult(cache, this.inputEq, this.validityInMiliseconds, action.requestId, action.input)
        : cache
    } else if (isResultArrivedAction<I, R>(action)) {
      if (action.resourceId === this.resourceId) {
        return truncate(resultArrived(cache, this.inputEq, action.requestId, action.input, action.result, action.currentTime), this.maxNumberOfCacheItems)
      } else {
        return cache
      }
    } else {
      return cache
    }
  }

  private getAdvice(input: I): IHasAdvice<ResourceAction<I, R>, State> {
    const requestId = uuid()
    return new DefaultHasAdvice(
      this.runner,
      this.cacheSelector,
      this.inputEq,
      input,
      this.resourceId,
      requestId
    )
  }
}
