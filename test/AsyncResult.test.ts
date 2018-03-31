import { AsyncResult, AwaitingResult, ResultArrived } from '../AsyncResult'
import { Result, someOtherRequestId, someOtherResult, someRequestId, someResult } from './data'

describe('AsyncResult', () => {
  it('should only transition from AWAITING_RESULT without a previous result to RESULT_ARRIVED when the requestId is the same (to prevent race conditions)', () => {
    const awaitingFirstResult = AsyncResult.awaitingFirstResult(someRequestId)
    const transitionForSameId = AsyncResult.withResultArrived(awaitingFirstResult, someRequestId, someResult)
    const transitionForOtherId = AsyncResult.withResultArrived(awaitingFirstResult, someOtherRequestId, someResult)

    expect(transitionForSameId).toEqual(AsyncResult.resultArrived(someRequestId, someResult))
    expect(transitionForOtherId).toEqual(awaitingFirstResult)
  })

  it('should only transition from AWAITING_RESULT with a previous result to RESULT_ARRIVED when the requestId is the same (to prevent race conditions)', () => {
    const awaitingNextResult = AsyncResult.awaitingNextResult<Result>(someRequestId, someResult)
    const transitionForSameId = AsyncResult.withResultArrived(awaitingNextResult, someRequestId, someOtherResult)
    const transitionForOtherId = AsyncResult.withResultArrived(awaitingNextResult, someOtherRequestId, someOtherResult)

    expect(transitionForSameId).toEqual(AsyncResult.resultArrived(someRequestId, someOtherResult))
    expect(transitionForOtherId).toEqual(awaitingNextResult)
  })

  it('should not be allowed to transition from RESULT_ARRIVED', () => {
    const resultArrived = AsyncResult.resultArrived(someRequestId, someResult)

    try {
      const afterTransition = AsyncResult.withResultArrived(resultArrived, someRequestId, someOtherResult)
      fail()
    } catch (e) {
      expect(e.message).toEqual('Result has already arrived!')
    }
  })

  it('should ignore arriving results for other requests', () => {
    const resultArrived = AsyncResult.resultArrived(someRequestId, someResult)

    const afterTransition = AsyncResult.withResultArrived(resultArrived, someOtherRequestId, someOtherResult)
    expect(afterTransition).toEqual(resultArrived)
  })
})