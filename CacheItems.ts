import { CacheItem } from './CacheItem'
import { AsyncResult, AwaitingFirstResult, AwaitingNextResult, RESULT_ARRIVED, ResultArrived } from './AsyncResult'

export type CacheItems<Key, Value> = Array<CacheItem<Key, Value>>

export function clear<Key, Value>(cache: CacheItems<Key, Value>): CacheItems<Key, Value> {
  return cache.map(item => item.forceInvalid())
}

export function getAsyncResultIfValid<Key, Value>(cacheItems: CacheItems<Key, Value>, eq: (left: Key, right: Key) => boolean, key: Key, now: Date): AsyncResult<Value> | undefined {
  const cacheItem = cacheItems.find(item => eq(item.key, key))
  if (cacheItem === undefined) {
    return undefined
  } else if (!cacheItem.isValid(now)) {
    return undefined
  } else {
    return cacheItem.asyncResult
  }
}

export function awaitingResult<Key, Value>(cacheItems: CacheItems<Key, Value>, eq: (left: Key, right: Key) => boolean, lifeTimeInMiliseconds: number, requestId: string, key: Key): CacheItems<Key, Value> {
  const otherItems = cacheItems.filter(item => !eq(item.key, key))
  const previousCacheItem = cacheItems.find(item => eq(item.key, key))
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

export function resultArrived<Key, Value>(cacheItems: CacheItems<Key, Value>, eq: (left: Key, right: Key) => boolean, requestId: string, key: Key, result: Value, now: Date): CacheItems<Key, Value> {
  const items = cacheItems.map(item => {
    if (eq(item.key, key)) {
      return item.resultArrived(requestId, result, now)
    } else {
      return item
    }
  })
  return items
}

export function truncate<Key, Value>(cacheItems: CacheItems<Key, Value>, maxNumberOfCacheItems: number): CacheItems<Key, Value> {
  const sortedCacheItems = cacheItems.sort((left, right) => {
    if (left.asyncResult.type === RESULT_ARRIVED && right.asyncResult.type === RESULT_ARRIVED) {
      return right.asyncResult.when.valueOf() - left.asyncResult.when.valueOf()
    } if (left.asyncResult.type !== RESULT_ARRIVED) {
      return -1
    } else {
      return 1
    }
  })

  const resultArriveds = cacheItems.filter(ci => ci.asyncResult.type === RESULT_ARRIVED).length
  const toRemove = Math.max(0, resultArriveds - maxNumberOfCacheItems)
  const toKeep = cacheItems.length - toRemove
  return sortedCacheItems.slice(0, toKeep)
}
