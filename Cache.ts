import { CacheItem } from './CacheItem'
import { AsyncResult, AwaitingFirstResult, AwaitingNextResult } from './AsyncResult'

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

export function resultArrived<I, R>(cache: Cache<I, R>, eq: (left: I, right: I) => boolean, id: string, input: I, result: R, now: Date): Cache<I, R> {
  const items = cache.map(item => {
    if (eq(item.input, input)) {
      return item.resultArrived(id, result, now)
    } else {
      return item
    }
  })
  return items
}
