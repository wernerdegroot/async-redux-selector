import { CacheItem } from './CacheItem'
import { AsyncResult, AwaitingFirstResult, AwaitingNextResult, RESULT_ARRIVED, ResultArrived } from './AsyncResult'

export type Cache<Key, Value> = Array<CacheItem<Key, Value>>

export function clear<Key, Value>(cache: Cache<Key, Value>): Cache<Key, Value> {
  return cache.map(item => item.forceInvalid())
}

export function getAsyncResultIfValid<Key, Value>(cache: Cache<Key, Value>, eq: (left: Key, right: Key) => boolean, key: Key, now: Date): AsyncResult<Value> | undefined {
  const cacheItem = cache.find(item => eq(item.key, key))
  if (cacheItem === undefined) {
    return undefined
  } else if (!cacheItem.isValid(now)) {
    return undefined
  } else {
    return cacheItem.asyncResult
  }
}

export function awaitingResult<Key, Value>(cache: Cache<Key, Value>, eq: (left: Key, right: Key) => boolean, lifeTimeInMiliseconds: number, requestId: string, key: Key): Cache<Key, Value> {
  const otherItems = cache.filter(item => !eq(item.key, key))
  const previousCacheItem = cache.find(item => eq(item.key, key))
  let asyncResult: AsyncResult<Value>
  if (previousCacheItem === undefined) {
    asyncResult = new AwaitingFirstResult(requestId)
  } else if (previousCacheItem.asyncResult.type === 'RESULT_ARRIVED') {
    asyncResult = new AwaitingNextResult(requestId, previousCacheItem.asyncResult.result)
  } else if (previousCacheItem.asyncResult.type === 'AWAITING_NEXT_RESULT') {
    asyncResult = new AwaitingNextResult(requestId, previousCacheItem.asyncResult.previousResult)
  } else if (previousCacheItem.asyncResult.type === 'AWAITING_FIRST_RESULT') {
    asyncResult = new AwaitingFirstResult(requestId)
  } else {
    const exhaustive: never = previousCacheItem.asyncResult
    throw exhaustive
  }
  const newCacheItem = new CacheItem(key, asyncResult, lifeTimeInMiliseconds, false)
  const items = [...otherItems, newCacheItem]
  return items
}

export function resultArrived<Key, Value>(cache: Cache<Key, Value>, eq: (left: Key, right: Key) => boolean, requestId: string, key: Key, result: Value, now: Date): Cache<Key, Value> {
  const items = cache.map(item => {
    if (eq(item.key, key)) {
      return item.resultArrived(requestId, result, now)
    } else {
      return item
    }
  })
  return items
}

export function truncate<Key, Value>(cache: Cache<Key, Value>, maxNumberOfCacheItems: number): Cache<Key, Value> {
  const sortedCache = cache.sort((left, right) => {
    if (left.asyncResult.type === RESULT_ARRIVED && right.asyncResult.type === RESULT_ARRIVED) {
      return right.asyncResult.when.valueOf() - left.asyncResult.when.valueOf()
    } if (left.asyncResult.type !== RESULT_ARRIVED) {
      return -1
    } else {
      return 1
    }
  })

  const resultArriveds = cache.filter(ci => ci.asyncResult.type === RESULT_ARRIVED).length
  const toRemove = Math.max(0, resultArriveds - maxNumberOfCacheItems)
  const toKeep = cache.length - toRemove
  return sortedCache.slice(0, toKeep)
}
