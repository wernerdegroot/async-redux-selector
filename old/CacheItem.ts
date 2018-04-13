import { RequestState, RESULT_RECEIVED } from './RequestState'

export type CacheItem<Key, Result> = Readonly<{
  key: Key,
  requestState: RequestState<Result>,
  updatedAt: number // `Date` as a `number`.
}>

export const CacheItem = {

  hasResult<Key, Result>(cacheItems: Array<CacheItem<Key, Result>>, keysAreEqual: (left: Key, right: Key) => boolean, key: Key, validityInMiliseconds: number, now: Date) {
    const cacheItemWithResult = cacheItems.find(cacheItem => {
      return keysAreEqual(cacheItem.key, key)
        && cacheItem.requestState.type === RESULT_RECEIVED
        && cacheItem.updatedAt + validityInMiliseconds > now.valueOf()
    })

    return cacheItemWithResult !== undefined
  },

  expireForKey<Key, Result>(cacheItems: Array<CacheItem<Key, Result>>, keysAreEqual: (left: Key, right: Key) => boolean, key: Key, validityInMiliseconds: number, now: Date) {
    return cacheItems.map(cacheItem => {
      if (keysAreEqual(cacheItem.key, key)) {
        return {
          key: cacheItem.key,
          requestState: RequestState.expire(cacheItem.requestState),
          updatedAt: now.valueOf()
        }
      } else {
        return cacheItem
      }
    })
  }
}