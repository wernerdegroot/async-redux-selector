import * as RequestState from './RequestState'
import { AWAITING_RESULT, RESULT_RECEIVED } from './consts'

export type CacheItem<Key, Result> = Readonly<{
  key: Key,
  requestState: RequestState.RequestState<Result>
}>

export function ordering(left: CacheItem<any, any>, right: CacheItem<any, any>): number {
  return RequestState.ordering(left.requestState, right.requestState)
}

export function handleResult<Key, Result>(cacheItem: CacheItem<Key, Result>, key: Key, requestId: string, result: Result, currentTime: number, keysAreEqual: (left: Key, right: Key) => boolean): CacheItem<Key, Result> {
  if (keysAreEqual(cacheItem.key, key) && cacheItem.requestState.type === AWAITING_RESULT && cacheItem.requestState.requestId === requestId) {
    return {
      key: cacheItem.key,
      requestState: RequestState.resultReceived(result, currentTime)
    }
  } else {
    return cacheItem
  }
}

export function expire<Key, Result>(cacheItem: CacheItem<Key, Result>, currentTime: number): CacheItem<Key, Result> {
  if (cacheItem.requestState.type === RESULT_RECEIVED) {
    return {
      key: cacheItem.key,
      requestState: RequestState.resultExpired(cacheItem.requestState.result, currentTime)
    }
  } else if (cacheItem.requestState.type === AWAITING_RESULT) {
    return {
      key: cacheItem.key,
      requestState: RequestState.requestCancelled(currentTime)
    }
  } else {
    return cacheItem
  }
}

export function expireForKey<Key, Result>(cacheItems: Array<CacheItem<Key, Result>>, keysAreEqual: (left: Key, right: Key) => boolean, key: Key, currentTime: number) {
  return cacheItems.map(cacheItem => {
    if (keysAreEqual(cacheItem.key, key)) {
      return expire(cacheItem, currentTime)
    } else {
      return cacheItem
    }
  })
}

export function forKey<Key, Result>(cacheItems: CacheItem<Key, Result>[], key: Key, keysAreEqual: (left: Key, right: Key) => boolean): CacheItem<Key, Result>[] {
  return cacheItems
    .filter(cacheItem => keysAreEqual(cacheItem.key, key))
    .sort(ordering)
}
