import { addMilliseconds } from 'date-fns'
import { AsyncResult } from './AsyncResult'
import { RESULT_ARRIVED } from './Action'

export class CacheItem<Key, Value> {

  constructor(public readonly key: Key,
              public readonly asyncResult: AsyncResult<Value>,
              public readonly lifeTimeInMiliseconds: number,
              public readonly forcedInvalid: boolean) {
  }

  public forceInvalid(): CacheItem<Key, Value> {
    return new CacheItem(this.key, this.asyncResult, this.lifeTimeInMiliseconds, true)
  }

  public resultArrived(id: string, result: Value, now: Date): CacheItem<Key, Value> {
    const asyncResult = AsyncResult.resultArrived(this.asyncResult, id, result, now)
    return new CacheItem<Key, Value>(this.key, asyncResult, this.lifeTimeInMiliseconds, false)
  }

  public isValid(now: Date): boolean {
    if (this.asyncResult.type === RESULT_ARRIVED) {
      return !this.forcedInvalid && now < addMilliseconds(this.asyncResult.when, this.lifeTimeInMiliseconds)
    } else {
      return true
    }
  }
}
