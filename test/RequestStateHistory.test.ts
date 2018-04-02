import { RequestStateHistory } from '../RequestStateHistory'
import { later, now, muchMuchLater, muchLater } from './data'
import { RequestState } from '../RequestState'

describe('RequestStateHistory', () => {
  it('should only accept a response of the request id is the same (to prevent race conditions)', () => {
    let requestStateHistory: RequestStateHistory<string> = RequestStateHistory.firstRequest('1')
    requestStateHistory = RequestStateHistory.responseReceived(requestStateHistory, '1', 'one', now)
    requestStateHistory = RequestStateHistory.nextRequest(requestStateHistory, '2')
    requestStateHistory = RequestStateHistory.nextRequest(requestStateHistory, '3')
    expect(requestStateHistory).toEqual({
      current: RequestState.awaitingResponse('3'),
      history: [
        RequestState.responseReceived('1', 'one', now)
      ]
    })

    requestStateHistory = RequestStateHistory.responseReceived(requestStateHistory, '3', 'three', later)
    expect(requestStateHistory).toEqual({
      current: RequestState.responseReceived('3', 'three', later),
      history: [
        RequestState.responseReceived('1', 'one', now)
      ]
    })

    requestStateHistory = RequestStateHistory.responseReceived(requestStateHistory, '2', 'two', muchLater)
    expect(requestStateHistory).toEqual({
      current: RequestState.responseReceived('3', 'three', later),
      history: [
        RequestState.responseReceived('1', 'one', now)
      ]
    })
  })
})