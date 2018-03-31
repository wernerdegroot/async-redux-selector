import { CacheItem } from './CacheItem'
import { AsyncResult, AwaitingFirstResult, AwaitingNextResult, RESULT_ARRIVED, ResultArrived, AWAITING_NEXT_RESULT, AWAITING_FIRST_RESULT } from './AsyncResult'

export type CacheItems<Key, Value> = Array<CacheItem<Key, Value>>

export function clear<Key, Value>(cache: CacheItems<Key, Value>): CacheItems<Key, Value> {
  return cache.map(CacheItem.forceInvalid)
}

export function getAsyncResultIfValid<Key, Result>(cacheItems: CacheItems<Key, AsyncResult<Result>>, eq: (left: Key, right: Key) => boolean, key: Key, now: Date): AsyncResult<Result> | undefined {
  const cacheItem = cacheItems.find(item => eq(item.key, key))
  if (cacheItem === undefined) {
    return undefined
  } else if (!CacheItem.isValid(cacheItem, now)) {
    return undefined
  } else {
    return cacheItem.value
  }
}

export function awaitingResult<Key, Result>(cacheItems: CacheItems<Key, AsyncResult<Result>>, eq: (left: Key, right: Key) => boolean, validityInMiliseconds: number, requestId: string, key: Key, now: Date): CacheItems<Key, AsyncResult<Result>> {
  const otherItems = cacheItems.filter(item => !eq(item.key, key))
  const previousCacheItem = cacheItems.find(item => eq(item.key, key))
  let asyncResult: AsyncResult<Result>
  if (previousCacheItem === undefined) {
    asyncResult = new AwaitingFirstResult(requestId)
  } else if (previousCacheItem.value.type === RESULT_ARRIVED) {
    asyncResult = new AwaitingNextResult(requestId, previousCacheItem.value.result)
  } else if (previousCacheItem.value.type === AWAITING_NEXT_RESULT) {
    asyncResult = new AwaitingNextResult(requestId, previousCacheItem.value.previousResult)
  } else if (previousCacheItem.value.type === AWAITING_FIRST_RESULT) {
    asyncResult = new AwaitingFirstResult(requestId)
  } else {
    const exhaustive: never = previousCacheItem.value
    throw exhaustive
  }
  const newCacheItem: CacheItem<Key, AsyncResult<Result>> = { key, value: asyncResult, validityInMiliseconds, forcedInvalid: false, updated: now }
  const items = [...otherItems, newCacheItem]
  return items
}

export function resultArrived<Key, Result>(cacheItems: CacheItems<Key, AsyncResult<Result>>, eq: (left: Key, right: Key) => boolean, requestId: string, key: Key, result: Result, now: Date): CacheItems<Key, AsyncResult<Result>> {
  return cacheItems.map(cacheItem => {
    if (eq(cacheItem.key, key)) {
      return CacheItem.update(
        cacheItem,
        asyncResult => AsyncResult.resultArrived(asyncResult, requestId, result),
        now
      )
    } else {
      return cacheItem
    }
  })
}

export function truncate<Key, Value>(cacheItems: CacheItems<Key, Value>, maxNumberOfCacheItems: number): CacheItems<Key, Value> {
  const sortedCacheItems = cacheItems.sort(CacheItem.order)
  const toRemove = Math.max(0, cacheItems.length - maxNumberOfCacheItems)
  return sortedCacheItems.slice(toRemove)
}
