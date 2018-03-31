export const AWAITING_FIRST_RESULT = 'AWAITING_FIRST_RESULT'
export const AWAITING_NEXT_RESULT = 'AWAITING_NEXT_RESULT'
export const RESULT_ARRIVED = 'RESULT_ARRIVED'

export type AwaitingFirstResult = Readonly<{
  type: 'AWAITING_FIRST_RESULT',
  requestId: string
}>

export type AwaitingNextResult<R> = Readonly<{
  type: 'AWAITING_NEXT_RESULT',
  requestId: string,
  previousResult: R
}>

export type ResultArrived<R> = Readonly<{
  type: 'RESULT_ARRIVED',
  requestId: string,
  result: R
}>

export type AsyncResult<Result> = AwaitingFirstResult | AwaitingNextResult<Result> | ResultArrived<Result>

export const AsyncResult = {

  awaitingFirstResult(requestId: string): AwaitingFirstResult {
    return {
      type: AWAITING_FIRST_RESULT,
      requestId
    }
  },

  awaitingNextResult<R>(requestId: string, previousResult: R): AwaitingNextResult<R> {
    return {
      type: AWAITING_NEXT_RESULT,
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
    if (asyncResult.type === AWAITING_FIRST_RESULT || asyncResult.type === AWAITING_NEXT_RESULT) {
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

