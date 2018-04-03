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
    if (isAwaitingResultAction<Key>(action)) {
      const cacheItem = {
        key: action.key,
        requestState: RequestState.awaitingResponse(action.requestId),
        updatedAt: action.currentTime.valueOf()
      }
      return [
        cacheItem,
        ...cacheItems
      ]
    } else if (isResultArrivedAction<Key, Response>(action)) {
      return cacheItems.map(cacheItem => ({
        key: cacheItem.key,
        requestState: RequestState.handleResponse(cacheItem.requestState, action.requestId, action.result),
        updatedAt: action.currentTime.valueOf()
      }))
    } else if (isClearCacheAction(action)) {
      return cacheItems.map(cacheItem => ({
        key: cacheItem.key,
        requestState: RequestState.expire(cacheItem.requestState),
        updatedAt: action.currentTime.valueOf()
      }))
    } else if (isClearCacheItemAction<Key>(action)) {
      return cacheItems.map(cacheItem => {
        if (this.keysAreEqual(cacheItem.key, action.key)) {
          return {
            key: cacheItem.key,
            requestState: RequestState.expire(cacheItem.requestState),
            updatedAt: action.currentTime.valueOf()
          }
        } else {
          return cacheItem
        }
      })
    } else {
      return cacheItems
    }
  }
}
