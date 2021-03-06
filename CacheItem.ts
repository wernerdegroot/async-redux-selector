import { addMilliseconds } from 'date-fns'

export type CacheItem<Key, Value> = Readonly<{
  key: Key,
  value: Value,
  updated: number, // Date.valueOf()
  validityInMiliseconds: number,
  forcedInvalid: boolean
}>

export const CacheItem = {

  order<Key, Value>(left: CacheItem<Key, Value>, right: CacheItem<Key, Value>): number {
    return left.updated - right.updated
  },

  forceInvalid<Key, Value>(cacheItem: CacheItem<Key, Value>): CacheItem<Key, Value> {
    return {
      ...cacheItem,
      forcedInvalid: true
    }
  },

  update<Key, A, B>(cacheItem: CacheItem<Key, A>, fn: (a: A) => B, now: Date): CacheItem<Key, B> {
    return {
      ...cacheItem,
      value: fn(cacheItem.value),
      updated: now.valueOf()
    }
  },

  isValid(cacheItem: CacheItem<any, any>, now: Date): boolean {
      return !cacheItem.forcedInvalid && now < addMilliseconds(cacheItem.updated, cacheItem.validityInMiliseconds)
  }
}