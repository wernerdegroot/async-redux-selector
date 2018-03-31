import { AsyncResult, AwaitingFirstResult, AwaitingNextResult, RESULT_ARRIVED, ResultArrived } from '../AsyncResult'
import { someRequestId, someOtherRequestId, someResult, Result, someOtherResult } from './data'

describe('AsyncResult', () => {
  it('should only transition from AWAITING_FIRST_RESULT to RESULT_ARRIVED when the requestId is the same (to prevent race conditions)', () => {
    const awaitingFirstResult = new AwaitingFirstResult(someRequestId)
    const transitionForSameId = AsyncResult.resultArrived(awaitingFirstResult, someRequestId, someResult)
    const transitionForOtherId = AsyncResult.resultArrived(awaitingFirstResult, someOtherRequestId, someResult)

    expect(transitionForSameId).toEqual(new ResultArrived(someResult))
    expect(transitionForOtherId).toEqual(awaitingFirstResult)
  })

  it('should only transition from AWAITING_NEXT_RESULT to RESULT_ARRIVED when the requestId is the same (to prevent race conditions)', () => {
    const awaitingNextResult = new AwaitingNextResult<Result>(someRequestId, someResult)
    const transitionForSameId = AsyncResult.resultArrived(awaitingNextResult, someRequestId, someOtherResult)
    const transitionForOtherId = AsyncResult.resultArrived(awaitingNextResult, someOtherRequestId, someOtherResult)

    expect(transitionForSameId).toEqual(new ResultArrived(someOtherResult))
    expect(transitionForOtherId).toEqual(awaitingNextResult)
  })

  it('should not be allowed to transition from RESULT_ARRIVED', () => {
    const resultArrived = new ResultArrived(someResult)

    try {
      const afterTransition = AsyncResult.resultArrived(resultArrived, someRequestId, someOtherResult)
      fail()
    } catch (e) {
      expect(e.message).toEqual('Result has already arrived!')
    }
  })
})