import { CacheItem } from './CacheItem'

export type CacheItems<Key, Value> = Array<CacheItem<Key, Value>>

export function truncate<Key, Value>(cacheItems: CacheItems<Key, Value>, maxNumberOfCacheItems: number): CacheItems<Key, Value> {
  const sortedCacheItems = cacheItems.sort(CacheItem.order)
  const toRemove = Math.max(0, cacheItems.length - maxNumberOfCacheItems)
  return sortedCacheItems.slice(toRemove)
}
