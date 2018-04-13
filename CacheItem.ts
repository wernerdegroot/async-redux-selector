import { RequestState, RESULT_RECEIVED } from './RequestState'

export type CacheItem<Key, Response> = Readonly<{
  key: Key,
  requestState: RequestState<Response>,
  updatedAt: number // `Date` as a `number`.
}>

export const CacheItem = {

  hasResponse<Key, Response>(cacheItems: Array<CacheItem<Key, Response>>, keysAreEqual: (left: Key, right: Key) => boolean, key: Key, validityInMiliseconds: number, now: Date) {
    const cacheItemWithResponse = cacheItems.find(cacheItem => {
      return keysAreEqual(cacheItem.key, key)
        && cacheItem.requestState.type === RESULT_RECEIVED
        && cacheItem.updatedAt + validityInMiliseconds > now.valueOf()
    })

    return cacheItemWithResponse !== undefined
  },

  expireForKey<Key, Response>(cacheItems: Array<CacheItem<Key, Response>>, keysAreEqual: (left: Key, right: Key) => boolean, key: Key, validityInMiliseconds: number, now: Date) {
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