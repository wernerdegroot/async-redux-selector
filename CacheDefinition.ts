import { awaitingResult, CacheItems, resultArrived, truncate } from './CacheItems'
import { CacheItem } from './CacheItem' // Required to prevent compile error.
import { GenericAction, isAwaitingResultAction, isResultArrivedAction } from './Action'
import { Cache } from './Cache'

export class CacheDefinition<Input, Key, Result, State> {

  constructor(public readonly cacheId: string,
              private readonly cacheItemsSelector: (state: State) => CacheItems<Key, Result>,
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

  public reducer = (cacheItems: CacheItems<Key, Result> = [], action: GenericAction): CacheItems<Key, Result> => {
    if (isAwaitingResultAction<Key>(action)) {
      return action.resourceId === this.cacheId
        ? awaitingResult(cacheItems, this.keysAreEqual, this.validityInMiliseconds, action.requestId, action.key)
        : cacheItems
    } else if (isResultArrivedAction<Key, Result>(action)) {
      if (action.resourceId === this.cacheId) {
        return truncate(resultArrived(cacheItems, this.keysAreEqual, action.requestId, action.key, action.result, action.currentTime), this.maxNumberOfCacheItems)
      } else {
        return cacheItems
      }
    } else {
      return cacheItems
    }
  }
}
