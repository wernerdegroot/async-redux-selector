import { GenericAction, isAwaitingResultAction, isResultArrivedAction, isClearCacheAction, isClearCacheItemAction } from './Action'
import { CacheItem } from './CacheItem';
import { RequestState } from './RequestState';

export class CacheDefinition<Input, Key, Response, State> {

  constructor(
    public readonly cacheId: string,
    public readonly cacheItemsSelector: (state: State) => Array<CacheItem<Key, Response>>,
    public readonly inputToKey: (input: Input) => Key,
    public readonly keysAreEqual: (left: Key, right: Key) => boolean,
    public readonly validityInMiliseconds: number,
    public readonly maxNumberOfCacheItems: number) {
  }

  public cacheItemsReducer = (cacheItems: CacheItem<Key, Response>[] = [], action: GenericAction) => {

    // Check the resource id here.

    if (isAwaitingResultAction<Key>(action)) {
      return [
        {
          key: action.key,
          requestState: RequestState.awaitingResult(action.requestId),
          updatedAt: action.currentTime.valueOf()
        },
        ...CacheItem.expireForKey(cacheItems, this.keysAreEqual, action.key, this.validityInMiliseconds, action.currentTime)
      ]
    } else if (isResultArrivedAction<Key, Response>(action)) {
      return cacheItems.map(cacheItem => ({
        key: cacheItem.key,
        requestState: RequestState.handleResult(cacheItem.requestState, action.requestId, action.result),
        updatedAt: action.currentTime.valueOf()
      }))
    } else if (isClearCacheAction(action)) {
      return cacheItems.map(cacheItem => ({
        key: cacheItem.key,
        requestState: RequestState.expire(cacheItem.requestState),
        updatedAt: action.currentTime.valueOf()
      }))
    } else if (isClearCacheItemAction<Key>(action)) {
      return CacheItem.expireForKey(cacheItems, this.keysAreEqual, action.key, this.validityInMiliseconds, action.currentTime)
    } else {
      return cacheItems
    }

    // Filter the REQUEST_CANCELLED out here. Or maybe do that in the functions for clearing the cache.
    // Do truncation here.
  }
}
