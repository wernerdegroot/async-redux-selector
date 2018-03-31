import { v4 as uuid } from 'uuid'

import { ResourceAction } from './Action'
import { AsyncResult } from './AsyncResult'
import { AsyncResultCacheItems } from './AsyncResultCacheItems'
import { AsyncResultOrAdvice, DefaultAdvice } from './AsyncResultOrAdvice'
import { CacheItems } from './CacheItems'
import { CacheDefinition } from './CacheDefinition';

export class Cache<Input, Key, Result, State> {

  constructor(private readonly cacheDefinition: CacheDefinition<Input, Key, Result, State>,
    private readonly cacheItems: CacheItems<Key, AsyncResult<Result>>) {
  }

  public getFor(input: Input): { orElse(getPromise: (getState: () => State) => Promise<Result>): AsyncResultOrAdvice<Result, ResourceAction<Key, Result>, State> } {
    const key = this.cacheDefinition.inputToKey(input)

    const orElse = (getPromise: (getState: () => State) => Promise<Result>): AsyncResultOrAdvice<Result, ResourceAction<Key, Result>, State> => {
      const now = new Date()
      const requestId = uuid()
      const possibleAsyncResult = CacheItems.getValueIfValid(this.cacheItems, this.cacheDefinition.keysAreEqual, key, now)
      if (possibleAsyncResult === undefined) {
        return new DefaultAdvice(
          getPromise,
          this.cacheDefinition,
          key,
          requestId
        )
      } else {
        return possibleAsyncResult
      }
    }

    return { orElse }
  }
}