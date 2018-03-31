import { AsyncResult, AwaitingFirstResult, AwaitingNextResult, ResultArrived } from '../AsyncResult'
import { Result, someOtherRequestId, someOtherResult, someRequestId, someResult } from './data'

describe('AsyncResult', () => {
  it('should only transition from AWAITING_FIRST_RESULT to RESULT_ARRIVED when the requestId is the same (to prevent race conditions)', () => {
    const awaitingFirstResult = new AwaitingFirstResult(someRequestId)
    const transitionForSameId = AsyncResult.resultArrived(awaitingFirstResult, someRequestId, someResult)
    const transitionForOtherId = AsyncResult.resultArrived(awaitingFirstResult, someOtherRequestId, someResult)

    expect(transitionForSameId).toEqual(new ResultArrived(someRequestId, someResult))
    expect(transitionForOtherId).toEqual(awaitingFirstResult)
  })

  it('should only transition from AWAITING_NEXT_RESULT to RESULT_ARRIVED when the requestId is the same (to prevent race conditions)', () => {
    const awaitingNextResult = new AwaitingNextResult<Result>(someRequestId, someResult)
    const transitionForSameId = AsyncResult.resultArrived(awaitingNextResult, someRequestId, someOtherResult)
    const transitionForOtherId = AsyncResult.resultArrived(awaitingNextResult, someOtherRequestId, someOtherResult)

    expect(transitionForSameId).toEqual(new ResultArrived(someRequestId, someOtherResult))
    expect(transitionForOtherId).toEqual(awaitingNextResult)
  })

  it('should not be allowed to transition from RESULT_ARRIVED', () => {
    const resultArrived = new ResultArrived(someRequestId, someResult)

    try {
      const afterTransition = AsyncResult.resultArrived(resultArrived, someRequestId, someOtherResult)
      fail()
    } catch (e) {
      expect(e.message).toEqual('Result has already arrived!')
    }
  })

  it('should ignore arriving results for other requests', () => {
    const resultArrived = new ResultArrived(someRequestId, someResult)

    const afterTransition = AsyncResult.resultArrived(resultArrived, someOtherRequestId, someOtherResult)
    expect(afterTransition).toEqual(resultArrived)
  })
})