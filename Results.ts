import { AWAITING_RESULT, REQUEST_CANCELLED, RESULT_EXPIRED, RESULT_RECEIVED } from './consts'
import * as CacheItem from './CacheItem'

export function mostRecent<Key, Result, Alternative>(cacheItems: CacheItem.CacheItem<Key, Result>[], key: Key, keysAreEqual: (left: Key, right: Key) => boolean, alternative: Alternative): Result | Alternative {
  const results = allAvailable(cacheItems, key, keysAreEqual)

  if (results.length > 0) {
    return results[0]
  } else {
    return alternative
  }
}

export function allAvailable<Key, Result>(cacheItems: CacheItem.CacheItem<Key, Result>[], key: Key, keysAreEqual: (left: Key, right: Key) => boolean): Result[] {
  const cacheItemsForKey = CacheItem.forKey(cacheItems, key, keysAreEqual)

  const results = cacheItemsForKey.reduce((acc: Result[], curr: CacheItem.CacheItem<Key, Result>): Result[] => {
    if (curr.requestState.type === RESULT_RECEIVED || curr.requestState.type === RESULT_EXPIRED) {
      return [...acc, curr.requestState.result]
    } else {
      return acc
    }
  }, [])

  return results
}

export function actions<Key, Action>(cacheItems: CacheItem.CacheItem<Key, any>[], key: Key, keysAreEqual: (left: Key, right: Key) => boolean, action: Action): Action[] {
  const cacheItemsForKey = CacheItem.forKey(cacheItems, key, keysAreEqual)

  if (cacheItemsForKey.length === 0) {
    return [action]
  } else {
    const requestState = cacheItemsForKey[0].requestState
    if (requestState.type === AWAITING_RESULT || requestState.type === RESULT_RECEIVED) {
      return []
    } else if (requestState.type === RESULT_EXPIRED || requestState.type === REQUEST_CANCELLED) {
      return [action]
    } else {
      const exhaustive: never = requestState
      throw new Error(exhaustive)
    }
  }
}
