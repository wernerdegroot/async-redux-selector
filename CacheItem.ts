import { addMilliseconds } from 'date-fns'
import { AsyncResult } from './AsyncResult'

export class CacheItem<I, R> {

  constructor(public readonly input: I,
              public readonly asyncResult: AsyncResult<R>,
              public readonly lifeTimeInMiliseconds: number,
              public readonly forcedInvalid: boolean) {
  }

  public forceInvalid(): CacheItem<I, R> {
    return new CacheItem(this.input, this.asyncResult, this.lifeTimeInMiliseconds, true)
  }

  public resultArrived(id: string, result: R, now: Date): CacheItem<I, R> {
    const asyncResult = this.asyncResult.resultArrived(id, result, now)
    return new CacheItem<I, R>(this.input, asyncResult, this.lifeTimeInMiliseconds, false)
  }

  public isValid(now: Date): boolean {
    if (this.asyncResult.type === 'RESULT_ARRIVED') {
      return !this.forcedInvalid && now < addMilliseconds(this.asyncResult.when, this.lifeTimeInMiliseconds)
    } else {
      return true
    }
  }
}
