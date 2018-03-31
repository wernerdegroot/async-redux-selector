export const AWAITING_RESULT = 'AWAITING_RESULT'
export const RESULT_ARRIVED = 'RESULT_ARRIVED'

export type AwaitingResult<R> = Readonly<{
  type: 'AWAITING_RESULT',
  requestId: string,
  previousResult?: R
}>

export type ResultArrived<R> = Readonly<{
  type: 'RESULT_ARRIVED',
  requestId: string,
  result: R
}>

export type AsyncResult<Result> = AwaitingResult<Result> | ResultArrived<Result>

export const AsyncResult = {

  awaitingFirstResult<R>(requestId: string): AwaitingResult<R> {
    return {
      type: AWAITING_RESULT,
      requestId
    }
  },

  awaitingNextResult<R>(requestId: string, previousResult: R): AwaitingResult<R> {
    return {
      type: AWAITING_RESULT,
      requestId,
      previousResult
    }
  },

  resultArrived<R>(requestId: string, result: R): ResultArrived<R> {
    return {
      type: RESULT_ARRIVED,
      requestId,
      result
    }
  },

  withResultArrived<Result>(asyncResult: AsyncResult<Result>, id: string, result: Result): AsyncResult<Result> {
    if (asyncResult.type === AWAITING_RESULT) {
      if (asyncResult.requestId === id) {
        return AsyncResult.resultArrived(asyncResult.requestId, result)
      } else {
        return asyncResult
      }
    } else if (asyncResult.type === RESULT_ARRIVED) {
      if (asyncResult.requestId === id) {
        throw new Error('Result has already arrived!')
      } else {
        return asyncResult
      }
    } else {
      const exhaustive: never = asyncResult
      throw asyncResult
    }
  }
}

