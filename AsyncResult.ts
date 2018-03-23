export const AWAITING_FIRST_RESULT = 'AWAITING_FIRST_RESULT'
export const AWAITING_NEXT_RESULT = 'AWAITING_NEXT_RESULT'
export const RESULT_ARRIVED = 'RESULT_ARRIVED'

export class AwaitingFirstResult<R> {

  public readonly type: 'AWAITING_FIRST_RESULT' = AWAITING_FIRST_RESULT

  constructor(public readonly requestId: string) { }

  public resultArrived(id: string, r: R, now: Date): AsyncResult<R> {
    if (this.requestId === id) {
      return new ResultArrived(r, now)
    } else {
      return this
    }
  }
}

export class AwaitingNextResult<R> {

  public readonly type: 'AWAITING_NEXT_RESULT' = AWAITING_NEXT_RESULT

  constructor(public readonly requestId: string, public readonly previousResult: R) { }

  public resultArrived(id: string, r: R, now: Date): AsyncResult<R> {
    if (this.requestId === id) {
      return new ResultArrived(r, now)
    } else {
      return this
    }
  }
}

export class ResultArrived<R> {

  public readonly type: 'RESULT_ARRIVED' = RESULT_ARRIVED

  constructor(public readonly result: R, public readonly when: Date) { }

  public resultArrived(id: string, r: R, now: Date): AsyncResult<R> {
    throw new Error('Result has already arrived!')
  }
}

export type AsyncResult<R> = AwaitingFirstResult<R> | AwaitingNextResult<R> | ResultArrived<R>
