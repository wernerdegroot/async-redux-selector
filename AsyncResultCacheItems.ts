import {
  AsyncResult,
  AWAITING_RESULT,
  AwaitingResult,
  RESULT_ARRIVED,
  ResultArrived
} from './AsyncResult'
import { CacheItem } from './CacheItem'
import { CacheItems } from './CacheItems'

export type AsyncResultCacheItems<Key, Result> = CacheItems<Key, AsyncResult<Result>>

export const AsyncResultCacheItems = {

  clear<Key, Value>(cache: CacheItems<Key, Value>): CacheItems<Key, Value> {
    return cache.map(CacheItem.forceInvalid)
  },

  getAsyncResultIfValid<Key, Result>(cacheItems: CacheItems<Key, AsyncResult<Result>>, eq: (left: Key, right: Key) => boolean, key: Key, now: Date): AsyncResult<Result> | undefined {
    const cacheItem = cacheItems.find(item => eq(item.key, key))
    if (cacheItem === undefined) {
      return undefined
    } else if (!CacheItem.isValid(cacheItem, now)) {
      return undefined
    } else {
      return cacheItem.value
    }
  },

  awaitingResult<Key, Result>(cacheItems: CacheItems<Key, AsyncResult<Result>>, eq: (left: Key, right: Key) => boolean, validityInMiliseconds: number, requestId: string, key: Key, now: Date): CacheItems<Key, AsyncResult<Result>> {
    const otherItems = cacheItems.filter(item => !eq(item.key, key))
    const previousCacheItem = cacheItems.find(item => eq(item.key, key))
    let asyncResult: AsyncResult<Result>
    if (previousCacheItem === undefined) {
      asyncResult = AsyncResult.awaitingFirstResult(requestId)
    } else if (previousCacheItem.value.type === RESULT_ARRIVED) {
      asyncResult = AsyncResult.awaitingNextResult(requestId, previousCacheItem.value.result)
    } else if (previousCacheItem.value.type === AWAITING_RESULT) {
      asyncResult = AsyncResult.awaitingNextResult(requestId, previousCacheItem.value.previousResult)
    } else {
      const exhaustive: never = previousCacheItem.value
      throw exhaustive
    }
    const newCacheItem: CacheItem<Key, AsyncResult<Result>> = { key, value: asyncResult, validityInMiliseconds, forcedInvalid: false, updated: now }
    const items = [...otherItems, newCacheItem]
    return items
  },

  resultArrived<Key, Result>(cacheItems: CacheItems<Key, AsyncResult<Result>>, eq: (left: Key, right: Key) => boolean, requestId: string, key: Key, result: Result, now: Date): CacheItems<Key, AsyncResult<Result>> {
    return cacheItems.map(cacheItem => {
      if (eq(cacheItem.key, key) && CacheItem.isValid(cacheItem, now)) {
        return CacheItem.update(
          cacheItem,
          asyncResult => AsyncResult.withResultArrived(asyncResult, requestId, result),
          now
        )
      } else {
        return cacheItem
      }
    })
  }
}