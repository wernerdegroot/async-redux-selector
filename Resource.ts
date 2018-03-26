import { awaitingResult, Cache, getAsyncResultIfValid, resultArrived, truncate } from './Cache'
import { v4 as uuid } from 'uuid'
import { ADVICE, AsyncResultOrAdvice, DefaultAdvice, IAdvice } from './AsyncResultOrAdvice'
import { CacheItem } from './CacheItem' // Required to prevent compile error.
import { GenericAction, isAwaitingResultAction, isResultArrivedAction } from './Action'
import { ResourceAction } from './Action'

export class Resource<Input, Key, Result, Action extends { type: string }, State> {

  constructor(public readonly resourceId: string,
              private readonly runner: (input: Input, getState: () => State) => Promise<Result>,
              private readonly inputToKey: (input: Input) => Key,
              private readonly cacheSelector: (state: State) => Cache<Key, Result>,
              private readonly keysAreEqual: (left: Key, right: Key) => boolean,
              private readonly validityInMiliseconds: number,
              private readonly maxNumberOfCacheItems: number) {

  }

  public selector = (cache: Cache<Key, Result>, input: Input): AsyncResultOrAdvice<Result, ResourceAction<Key, Result>, State> => {
    const now = new Date()
    const possibleAsyncResult = getAsyncResultIfValid(cache, this.keysAreEqual, this.inputToKey(input), now)
    if (possibleAsyncResult === undefined) {
      return this.getAdvice(input)
    } else {
      return possibleAsyncResult
    }
  }

  public reducer = (cache: Cache<Key, Result> = [], action: GenericAction): Cache<Key, Result> => {
    if (isAwaitingResultAction<Key>(action)) {
      return action.resourceId === this.resourceId
        ? awaitingResult(cache, this.keysAreEqual, this.validityInMiliseconds, action.requestId, action.key)
        : cache
    } else if (isResultArrivedAction<Key, Result>(action)) {
      if (action.resourceId === this.resourceId) {
        return truncate(resultArrived(cache, this.keysAreEqual, action.requestId, action.key, action.result, action.currentTime), this.maxNumberOfCacheItems)
      } else {
        return cache
      }
    } else {
      return cache
    }
  }

  private getAdvice(input: Input): IAdvice<ResourceAction<Key, Result>, State> {
    const requestId = uuid()
    return new DefaultAdvice(
      this.runner,
      this.cacheSelector,
      this.inputToKey,
      this.keysAreEqual,
      input,
      this.resourceId,
      requestId
    )
  }
}
