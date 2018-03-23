import { awaitingResult, Cache, getAsyncResultIfValid, resultArrived } from './Cache'
import { v4 as uuid } from 'uuid'
import { ADVICE, AsyncResultOrAdvice, IHasAdvice } from './AsyncResultOrAdvice'
import { CacheItem } from './CacheItem' // Required to prevent compile error.
import { GenericAction, isAwaitingResultAction, isResultArrivedAction } from './Action'
import { awaitingResultAction, ResourceAction, resultArrivedAction } from './Action'

export class Resource<I, R, Action extends { type: string }> {

  constructor(public readonly resourceId: string,
              private readonly runner: (input: I) => Promise<R>,
              private readonly inputEq: (left: I, right: I) => boolean,
              private readonly validityInMiliseconds: number = Infinity) {

  }

  public selector = (cache: Cache<I, R>, input: I): AsyncResultOrAdvice<R, ResourceAction<I, R>> => {
    const now = new Date()
    const possibleAsyncResult = getAsyncResultIfValid(cache, this.inputEq, input, now)
    if (possibleAsyncResult === undefined) {
      return this.getAdvice(input, now)
    } else {
      return possibleAsyncResult
    }
  }

  public reducer = (cache: Cache<I, R>, action: GenericAction): Cache<I, R> => {
    if (isAwaitingResultAction<I>(action)) {
      return action.resourceId === this.resourceId
        ? awaitingResult(cache, this.inputEq, this.validityInMiliseconds, action.requestId, action.input)
        : cache
    } else if (isResultArrivedAction<I, R>(action)) {
      return action.resourceId === this.resourceId
        ? resultArrived(cache, this.inputEq, action.requestId, action.input, action.result, action.currentTime)
        : cache
    } else {
      return cache
    }
  }

  private getAdvice(input: I, now: Date): IHasAdvice<ResourceAction<I, R>> {
    const self = this
    const requestId = uuid()
    return {
      type: ADVICE,
      followAdvice(dispatch: (action: ResourceAction<I, R>) => void): void {
        dispatch(awaitingResultAction(self.resourceId, requestId, input, now))
        self.runner(input).then(result => {
          dispatch(resultArrivedAction(self.resourceId, requestId, input, result, new Date()))
        })
      }
    }
  }
}
