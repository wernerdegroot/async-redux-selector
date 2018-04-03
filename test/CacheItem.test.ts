import { RequestStateHistory } from '../CacheItem'
import { later, now, muchMuchLater, muchLater } from './data'
import { RequestState } from '../RequestState'

describe('RequestStateHistory', () => {
  it('should only accept a response of the request id is the same (to prevent race conditions)', () => {
    let requestStateHistory = RequestStateHistory.noRequest<string>()
    requestStateHistory = RequestStateHistory.awaitingResponse(requestStateHistory, '1')
    requestStateHistory = RequestStateHistory.responseReceived(requestStateHistory, '1', 'one', now)
    requestStateHistory = RequestStateHistory.awaitingResponse(requestStateHistory, '2')
    requestStateHistory = RequestStateHistory.awaitingResponse(requestStateHistory, '3')
    expect(requestStateHistory).toEqual({
      current: RequestState.awaitingResponse('3'),
      previousResponses: [
        RequestState.responseReceived('1', 'one', now)
      ]
    })

    requestStateHistory = RequestStateHistory.responseReceived(requestStateHistory, '3', 'three', later)
    expect(requestStateHistory).toEqual({
      current: RequestState.responseReceived('3', 'three', later),
      previousResponses: [
        RequestState.responseReceived('1', 'one', now)
      ]
    })

    requestStateHistory = RequestStateHistory.responseReceived(requestStateHistory, '2', 'two', muchLater)
    expect(requestStateHistory).toEqual({
      current: RequestState.responseReceived('3', 'three', later),
      previousResponses: [
        RequestState.responseReceived('1', 'one', now)
      ]
    })
  })
})