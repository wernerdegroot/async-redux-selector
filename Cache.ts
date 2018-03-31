import { v4 as uuid } from 'uuid'

import { ResourceAction } from './Action'
import { AsyncResult } from './AsyncResult'
import { AsyncResultCacheItems } from './AsyncResultCacheItems'
import { AsyncResultOrAdvice, DefaultAdvice } from './AsyncResultOrAdvice'
import { CacheItems } from './CacheItems'

export class CacheIntermediateResult<Input, Key, Result, State> {

  constructor(private readonly cacheId: string,
              private readonly cacheItemsSelector: (state: State) => CacheItems<Key, AsyncResult<Result>>,
              private readonly keysAreEqual: (left: Key, right: Key) => boolean,
              private readonly cacheItems: CacheItems<Key, AsyncResult<Result>>,
              private readonly input: Input,
              private readonly key: Key) {

  }

  public orElse(getPromise: (getState: () => State) => Promise<Result>): AsyncResultOrAdvice<Result, ResourceAction<Key, Result>, State> {
    const now = new Date()
    const requestId = uuid()
    const possibleAsyncResult = AsyncResultCacheItems.getAsyncResultIfValid(this.cacheItems, this.keysAreEqual, this.key, now)
    if (possibleAsyncResult === undefined) {
      return new DefaultAdvice(
        getPromise,
        this.cacheItemsSelector,
        this.keysAreEqual,
        this.key,
        this.cacheId,
        requestId
      )
    } else {
      return possibleAsyncResult
    }
  }
}

export class Cache<Input, Key, Result, State> {

  constructor(private readonly cacheId: string,
              private readonly cacheItemsSelector: (state: State) => CacheItems<Key, AsyncResult<Result>>,
              private readonly inputToKey: (input: Input) => Key,
              private readonly keysAreEqual: (left: Key, right: Key) => boolean,
              private readonly cacheItems: CacheItems<Key, AsyncResult<Result>>) {
  }

  public getFor(input: Input): CacheIntermediateResult<Input, Key, Result, State> {
    const key = this.inputToKey(input)
    return new CacheIntermediateResult<Input, Key, Result, State>(
      this.cacheId,
      this.cacheItemsSelector,
      this.keysAreEqual,
      this.cacheItems,
      input,
      key
    )
  }
}