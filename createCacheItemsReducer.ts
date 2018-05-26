import * as CacheItem from './CacheItem'
import * as Action from './Action'
import * as RequestState from './RequestState'
import { REQUEST_CANCELLED } from './consts'

export const createCacheItemsReducer = <Key, Result>(resourceId: string, keysAreEqual: (left: Key, right: Key) => boolean, maxCacheSize: number) => (cacheItems: Array<CacheItem.CacheItem<Key, Result>> = [], action: Action.Action<Key, Result>): Array<CacheItem.CacheItem<Key, Result>> => {

  function handleAction(cacheItems: Array<CacheItem.CacheItem<Key, Result>>): Array<CacheItem.CacheItem<Key, Result>> {
    if (Action.isAction(action) && action.resourceId !== resourceId) {
      return cacheItems
    }

    if (Action.isAwaitingResultAction<Key>(action)) {
      return [
        {
          key: action.key,
          requestState: RequestState.awaitingResult(action.requestId, action.currentTime),
        },
        ...CacheItem.expireForKey(cacheItems, keysAreEqual, action.key, action.currentTime)
      ]
    } else if (Action.isResultReceivedAction<Key, Result>(action)) {
      return cacheItems.map(cacheItem => CacheItem.handleResult(cacheItem, action.key, action.requestId, action.result, action.currentTime, keysAreEqual))
    } else if (Action.isClearCacheAction(action)) {
      return cacheItems.map(cacheItem => CacheItem.expire(cacheItem, action.currentTime))
    } else if (Action.isClearCacheItemAction<Key>(action)) {
      return CacheItem.expireForKey(cacheItems, keysAreEqual, action.key, action.currentTime)
    } else {
      // This clause should never be reached. It's better to be safe than sorry, so we'll handle this case anyway.
      return cacheItems
    }
  }

  function filterCancelledRequests(cacheItems: Array<CacheItem.CacheItem<Key, Result>>): Array<CacheItem.CacheItem<Key, Result>> {
    return cacheItems.filter(cacheItem => cacheItem.requestState.type !== REQUEST_CANCELLED)
  }

  function limitCacheItems(cacheItems: Array<CacheItem.CacheItem<Key, Result>>): Array<CacheItem.CacheItem<Key, Result>> {
    return cacheItems.sort((left, right) => RequestState.ordering(left.requestState, right.requestState)).slice(0, maxCacheSize)
  }

  return [
    handleAction,
    filterCancelledRequests,
    limitCacheItems
  ].reduce((x, f) => f(x), cacheItems)
}