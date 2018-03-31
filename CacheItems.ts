import { CacheItem } from './CacheItem'

export type CacheItems<Key, Value> = Array<CacheItem<Key, Value>>

export const CacheItems = {

  getValueIfValid<Key, Value>(cacheItems: CacheItems<Key, Value>, eq: (left: Key, right: Key) => boolean, key: Key, now: Date): Value | undefined {
    const cacheItem = cacheItems.find(item => eq(item.key, key))
    if (cacheItem === undefined) {
      return undefined
    } else if (!CacheItem.isValid(cacheItem, now)) {
      return undefined
    } else {
      return cacheItem.value
    }
  },

  clear<Key, Value>(cache: CacheItems<Key, Value>): CacheItems<Key, Value> {
    return cache.map(CacheItem.forceInvalid)
  },

  clearItem<Key, Value>(cache: CacheItems<Key, Value>, eq: (left: Key, right: Key) => boolean, key: Key): CacheItems<Key, Value> {
    return cache.map(cacheItem => {
      if (eq(cacheItem.key, key)) {
        return CacheItem.forceInvalid(cacheItem)
      } else {
        return cacheItem
      }
    })
  },

  truncate<Key, Value>(cacheItems: CacheItems<Key, Value>, maxNumberOfCacheItems: number): CacheItems<Key, Value> {
    const sortedCacheItems = cacheItems.sort(CacheItem.order)
    const toRemove = Math.max(0, cacheItems.length - maxNumberOfCacheItems)
    return sortedCacheItems.slice(toRemove)
  }

}
