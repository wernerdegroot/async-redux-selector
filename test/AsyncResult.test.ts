import { AwaitingFirstResult, AwaitingNextResult, RESULT_ARRIVED, ResultArrived } from '../AsyncResult'

type Result = {
  value: string
}

const someResult: Result = {
  value: 'some-result'
}

const someOtherResult: Result = {
  value: 'some-other-result'
}

const someId = 'some-requestId'
const someOtherId = 'some-other-requestId'

const now = new Date(2018, 3, 8, 2, 4, 1)

describe('AsyncResult', () => {
  it('should only transition from AWAITING_FIRST_RESULT to RESULT_ARRIVED when the requestId is the same (to prevent race conditions)', () => {
    const awaitingFirstResult = new AwaitingFirstResult<Result>(someId)
    const transitionForSameId = awaitingFirstResult.resultArrived(someId, someResult, now)
    const transitionForOtherId = awaitingFirstResult.resultArrived(someOtherId, someResult, now)

    expect(transitionForSameId).toEqual(new ResultArrived(someResult, now))
    expect(transitionForOtherId).toEqual(awaitingFirstResult)
  })

  it('should only transition from AWAITING_NEXT_RESULT to RESULT_ARRIVED when the requestId is the same (to prevent race conditions)', () => {
    const awaitingNextResult = new AwaitingNextResult<Result>(someId, someResult)
    const transitionForSameId = awaitingNextResult.resultArrived(someId, someOtherResult, now)
    const transitionForOtherId = awaitingNextResult.resultArrived(someOtherId, someOtherResult, now)

    expect(transitionForSameId).toEqual(new ResultArrived(someOtherResult, now))
    expect(transitionForOtherId).toEqual(awaitingNextResult)
  })

  it('should not be allowed to transition from RESULT_ARRIVED', () => {
    const resultArrived = new ResultArrived(someResult, now)

    try {
      const afterTransition = resultArrived.resultArrived(someId, someOtherResult, now)
      fail()
    } catch (e) {
      expect(e.message).toEqual('Result has already arrived!')
    }
  })
})