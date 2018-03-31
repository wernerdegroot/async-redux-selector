import { GenericAction, isAwaitingResultAction, isResultArrivedAction, isClearCacheAction, isClearCacheItemAction } from './Action'
import { AsyncResult } from './AsyncResult'
import { AsyncResultCacheItems } from './AsyncResultCacheItems'
import { Cache } from './Cache'
import { CacheItems } from './CacheItems'

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
    if (isAwaitingResultAction<Key>(action) && action.resourceId === this.cacheId) {
      return AsyncResultCacheItems.awaitingResult(cacheItems, this.keysAreEqual, this.validityInMiliseconds, action.requestId, action.key, action.currentTime)
    } else if (isResultArrivedAction<Key, Result>(action) && action.resourceId === this.cacheId) {
      return CacheItems.truncate(AsyncResultCacheItems.resultArrived(cacheItems, this.keysAreEqual, action.requestId, action.key, action.result, action.currentTime), this.maxNumberOfCacheItems)
    } else if (isClearCacheAction(action) && action.resourceId === this.cacheId) {
      return CacheItems.clear(cacheItems)
    } else if (isClearCacheItemAction<Key>(action) && action.resourceId === this.cacheId) {
      return CacheItems.clearItem(cacheItems, this.keysAreEqual, action.key)
    } else {
      return cacheItems
    }
  }
}
