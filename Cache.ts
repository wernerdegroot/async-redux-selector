import { CacheItem } from './CacheItem'
import { AsyncResult, AwaitingFirstResult, AwaitingNextResult, RESULT_ARRIVED, ResultArrived } from './AsyncResult'

export type Cache<I, R> = Array<CacheItem<I, R>>

export function clear<I, R>(cache: Cache<I, R>): Cache<I, R> {
  return cache.map(item => item.forceInvalid())
}

export function getAsyncResultIfValid<I, R>(cache: Cache<I, R>, eq: (left: I, right: I) => boolean, input: I, now: Date): AsyncResult<R> | undefined {
  const cacheItem = cache.find(item => eq(item.input, input))
  if (cacheItem === undefined) {
    return undefined
  } else if (!cacheItem.isValid(now)) {
    return undefined
  } else {
    return cacheItem.asyncResult
  }
}

export function awaitingResult<I, R>(cache: Cache<I, R>, eq: (left: I, right: I) => boolean, lifeTimeInMiliseconds: number, requestId: string, input: I): Cache<I, R> {
  const otherItems = cache.filter(item => !eq(item.input, input))
  const previousCacheItem = cache.find(item => eq(item.input, input))
  let asyncResult: AsyncResult<R>
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
  const newCacheItem = new CacheItem(input, asyncResult, lifeTimeInMiliseconds, false)
  const items = [...otherItems, newCacheItem]
  return items
}

export function resultArrived<I, R>(cache: Cache<I, R>, eq: (left: I, right: I) => boolean, requestId: string, input: I, result: R, now: Date): Cache<I, R> {
  const items = cache.map(item => {
    if (eq(item.input, input)) {
      return item.resultArrived(requestId, result, now)
    } else {
      return item
    }
  })
  return items
}

export function truncate<I, R>(cache: Cache<I, R>, maxNumberOfCacheItems: number): Cache<I, R> {
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
