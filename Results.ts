import { RESULT_EXPIRED, RESULT_RECEIVED } from './consts'
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
  const cacheItemsForKey = cacheItems
    .filter(cacheItem => keysAreEqual(cacheItem.key, key))
    .sort(CacheItem.ordering)

  const results = cacheItemsForKey.reduce((acc: Result[], curr: CacheItem.CacheItem<Key, Result>): Result[] => {
    if (curr.requestState.type === RESULT_RECEIVED || curr.requestState.type === RESULT_EXPIRED) {
      return [...acc, curr.requestState.result]
    } else {
      return acc
    }
  }, [])

  return results
}
