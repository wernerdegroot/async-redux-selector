import { GenericAction, isAwaitingResultAction, isResultArrivedAction, isClearCacheAction, isClearCacheItemAction } from './Action'
import { AsyncResult } from './AsyncResult'
import { AsyncResultCacheItems } from './AsyncResultCacheItems'
import { Cache } from './Cache'
import { CacheItems } from './CacheItems'

export class CacheDefinition<Input, Key, Result, State> {

  constructor(public readonly cacheId: string,
    public readonly cacheItemsSelector: (state: State) => CacheItems<Key, AsyncResult<Result>>,
    public readonly inputToKey: (input: Input) => Key,
    public readonly keysAreEqual: (left: Key, right: Key) => boolean,
    public readonly validityInMiliseconds: number,
    public readonly maxNumberOfCacheItems: number) {
  }

  public selector = (state: State): Cache<Input, Key, Result, State> =>
    new Cache(
      this,
      this.cacheItemsSelector(state)
    )

  public itemsReducer = (cacheItems: CacheItems<Key, AsyncResult<Result>> = [], action: GenericAction): CacheItems<Key, AsyncResult<Result>> => {
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
