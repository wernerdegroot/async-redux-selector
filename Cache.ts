import { CacheItem } from './CacheItem'
import { AsyncResult, AwaitingFirstResult, AwaitingNextResult } from './AsyncResult'

export class Cache<I, R> {

  constructor(private readonly items: Array<CacheItem<I, R>>,
              private readonly eq: (left: I, right: I) => boolean,
              public readonly lifeTimeInMiliseconds: number) {

  }

  public clear(): Cache<I, R> {
    const items = this.items.map(item => item.forceInvalid())
    return new Cache(items, this.eq, this.lifeTimeInMiliseconds)
  }

  public getAsyncResult(input: I, now: Date): AsyncResult<R> | undefined {
    const cacheItem = this.items.find(item => this.eq(item.input, input))
    if (cacheItem === undefined) {
      return undefined
    } else if (!cacheItem.isValid(now)) {
      return undefined
    } else {
      return cacheItem.asyncResult
    }
  }

  public awaitingResult(id: string, input: I): Cache<I, R> {
    const otherItems = this.items.filter(item => !this.eq(item.input, input))
    const previousCacheItem = this.items.find(item => this.eq(item.input, input))
    let asyncResult: AsyncResult<R>
    if (previousCacheItem === undefined) {
      asyncResult = new AwaitingFirstResult(id)
    } else if (previousCacheItem.asyncResult.type === 'RESULT_ARRIVED') {
      asyncResult = new AwaitingNextResult(id, previousCacheItem.asyncResult.result)
    } else if (previousCacheItem.asyncResult.type === 'AWAITING_NEXT_RESULT') {
      asyncResult = new AwaitingNextResult(id, previousCacheItem.asyncResult.previousResult)
    } else if (previousCacheItem.asyncResult.type === 'AWAITING_FIRST_RESULT') {
      asyncResult = new AwaitingFirstResult(id)
    } else {
      const exhaustive: never = previousCacheItem.asyncResult
      throw exhaustive
    }
    const newCacheItem = new CacheItem(input, asyncResult, this.lifeTimeInMiliseconds, false)
    const items = [...otherItems, newCacheItem]
    return new Cache(items, this.eq, this.lifeTimeInMiliseconds)
  }

  public resultArrived(id: string, input: I, result: R, now: Date): Cache<I, R> {
    const items = this.items.map(item => {
      if (this.eq(item.input, input)) {
        return item.resultArrived(id, result, now)
      } else {
        return item
      }
    })
    return new Cache(items, this.eq, this.lifeTimeInMiliseconds)
  }
}
