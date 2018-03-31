import { GenericAction, isAwaitingResultAction, isResultArrivedAction } from './Action'
import { AsyncResult } from './AsyncResult'
import { AsyncResultCacheItems } from './AsyncResultCacheItems'
import { Cache } from './Cache'
import { CacheItems, truncate } from './CacheItems'

export class CacheDefinition<Input, Key, Result, State> {

  constructor(public readonly cacheId: string,
              private readonly cacheItemsSelector: (state: State) => CacheItems<Key, AsyncResult<Result>>,
              private readonly inputToKey: (input: Input) => Key,
              private readonly keysAreEqual: (left: Key, right: Key) => boolean,
              private readonly validityInMiliseconds: number,
              private readonly maxNumberOfCacheItems: number) {

  }

  public selector = (state: State): Cache<Input, Key, Result, State> =>
    new Cache(
      this.cacheId,
      this.cacheItemsSelector,
      this.inputToKey,
      this.keysAreEqual,
      this.cacheItemsSelector(state)
    )

  public reducer = (cacheItems: CacheItems<Key, AsyncResult<Result>> = [], action: GenericAction): CacheItems<Key, AsyncResult<Result>> => {
    if (isAwaitingResultAction<Key>(action)) {
      return action.resourceId === this.cacheId
        ? AsyncResultCacheItems.awaitingResult(cacheItems, this.keysAreEqual, this.validityInMiliseconds, action.requestId, action.key, action.currentTime)
        : cacheItems
    } else if (isResultArrivedAction<Key, Result>(action)) {
      if (action.resourceId === this.cacheId) {
        return truncate(AsyncResultCacheItems.resultArrived(cacheItems, this.keysAreEqual, action.requestId, action.key, action.result, action.currentTime), this.maxNumberOfCacheItems)
      } else {
        return cacheItems
      }
    } else {
      return cacheItems
    }
  }
}
