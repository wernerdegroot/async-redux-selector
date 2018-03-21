import { awaitingResult, Cache, getAsyncResultIfValid } from './Cache'
import { v4 as uuid } from 'uuid'
import { AsyncResultOrAdvice, HasAdvice } from './AsyncResultOrAdvice'
import { CacheItem } from './CacheItem'
import { IAdvice } from './IAdvice'
import { AWAITING_RESULT, awaitingResultAction, ResourceAction, resultArrivedAction } from './Action'

export class Resource<I, R, Action extends ResourceAction<I, R>> {

  constructor(private readonly resourceId: string,
              private readonly runner: (input: I) => Promise<R>,
              private readonly inputEq: (left: I, right: I) => boolean,
              private readonly validityInMiliseconds: number = Infinity) {

  }

  public selector = (cache: Cache<I, R>, input: I): AsyncResultOrAdvice<R, ResourceAction<I, R>> => {
    const now = new Date()
    const possibleAsyncResult = getAsyncResultIfValid(cache, this.inputEq, input, now)
    if (possibleAsyncResult === undefined) {
      return new HasAdvice(this.getAdvice(input, now))
    } else {
      return possibleAsyncResult
    }
  }

  public reducer = (cache: Cache<I, R>, action: Action): Cache<I, R> => {
    if (action.resourceId === this.resourceId) {
      switch (action.type) {
        case AWAITING_RESULT:
          return awaitingResult(cache, this.inputEq, this.validityInMiliseconds, action.resourceId, action.input)
        default:
          return cache
      }
    } else {
      return cache
    }
  }

  private getAdvice(input: I, now: Date): IAdvice<ResourceAction<I, R>> {
    const self = this
    const requestId = uuid()
    return {
      followAdvice(dispatch: (action: ResourceAction<I, R>) => void): void {
        dispatch(awaitingResultAction(self.resourceId, requestId, input, now))
        self.runner(input).then(result => {
          dispatch(resultArrivedAction(self.resourceId, requestId, input, result))
        })
      }
    }
  }
}
