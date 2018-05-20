import * as RequestState from './RequestState'
import { AWAITING_RESULT, RESULT_RECEIVED } from './consts'

export type CacheItem<Key, Result> = Readonly<{
  key: Key,
  requestState: RequestState.RequestState<Result>
}>

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

export function expireIfNoLongerValid<Key, Result>(cacheItem: CacheItem<Key, Result>, validityInMiliseconds: number, currentTime: number): CacheItem<Key, Result> {
  if (cacheItem.requestState.updatedAt + validityInMiliseconds < currentTime) {
    return expire(cacheItem, currentTime)
  } else {
    return cacheItem
  }
}

export function hasResult<Key, Result>(cacheItems: Array<CacheItem<Key, Result>>, keysAreEqual: (left: Key, right: Key) => boolean, key: Key, validityInMiliseconds: number, currentTime: number) {
  const cacheItemWithResult = cacheItems.find(cacheItem => {
    return keysAreEqual(cacheItem.key, key)
      && cacheItem.requestState.type === RESULT_RECEIVED
      && cacheItem.requestState.updatedAt + validityInMiliseconds > currentTime
  })

  return cacheItemWithResult !== undefined
}

export function expireForKey<Key, Result>(cacheItems: Array<CacheItem<Key, Result>>, keysAreEqual: (left: Key, right: Key) => boolean, key: Key, validityInMiliseconds: number, currentTime: number) {
  return cacheItems.map(cacheItem => {
    if (keysAreEqual(cacheItem.key, key)) {
      return expire(cacheItem, currentTime)
    } else {
      return cacheItem
    }
  })
}
