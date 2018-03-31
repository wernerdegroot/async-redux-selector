export const AWAITING_FIRST_RESULT = 'AWAITING_FIRST_RESULT'
export const AWAITING_NEXT_RESULT = 'AWAITING_NEXT_RESULT'
export const RESULT_ARRIVED = 'RESULT_ARRIVED'

export class AwaitingFirstResult {

  public readonly type: 'AWAITING_FIRST_RESULT' = AWAITING_FIRST_RESULT

  constructor(public readonly requestId: string) {
  }
}

export class AwaitingNextResult<R> {

  public readonly type: 'AWAITING_NEXT_RESULT' = AWAITING_NEXT_RESULT

  constructor(public readonly requestId: string, public readonly previousResult: R) {
  }
}

export class ResultArrived<R> {

  public readonly type: 'RESULT_ARRIVED' = RESULT_ARRIVED

  constructor(public readonly result: R) {
  }
}

export type AsyncResult<Result> = AwaitingFirstResult | AwaitingNextResult<Result> | ResultArrived<Result>

export const AsyncResult = {
  resultArrived<Result>(asyncResult: AsyncResult<Result>, id: string, result: Result): AsyncResult<Result> {
    if (asyncResult.type === AWAITING_FIRST_RESULT || asyncResult.type === AWAITING_NEXT_RESULT) {
      if (asyncResult.requestId === id) {
        return new ResultArrived(result)
      } else {
        return asyncResult
      }
    } else if (asyncResult.type === RESULT_ARRIVED) {
      throw new Error('Result has already arrived!')
    } else {
      const exhaustive: never = asyncResult
      throw asyncResult
    }
  }
}

