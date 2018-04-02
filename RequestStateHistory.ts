import { RequestState, ResponseReceived, AWAITING_RESPONSE, RESPONSE_RECEIVED } from "./RequestState";

export type RequestStateHistory<Response> = Readonly<{
  current: RequestState<Response>,
  previousResponses: Array<ResponseReceived<Response>>
}>

export const RequestStateHistory = {
  noRequest<Response>(): RequestStateHistory<Response> {
    return {
      current: RequestState.noRequest(),
      previousResponses: []
    }
  },

  awaitingResponse<Response>(requestStateHistory: RequestStateHistory<Response>, requestId: string): RequestStateHistory<Response> {
    return {
      current: RequestState.awaitingResponse(requestId),
      previousResponses: RequestStateHistory.allResponses(requestStateHistory)
    }
  },

  responseReceived<Response>(requestStateHistory: RequestStateHistory<Response>, requestId: string, response: Response, now: Date): RequestStateHistory<Response> {
    if (requestStateHistory.current.type === AWAITING_RESPONSE && requestStateHistory.current.requestId === requestId) {
      return {
        current: RequestState.responseReceived(requestId, response, now),
        previousResponses: requestStateHistory.previousResponses
      }
    } else {
      return requestStateHistory
    }
  },

  responseExpired<Response>(requestStateHistory: RequestStateHistory<Response>): RequestStateHistory<Response> {
    return {
      current: RequestState.expiredResponse(),
      previousResponses: RequestStateHistory.allResponses(requestStateHistory)
    }
  },

  allResponses<Response>(requestStateHistory: RequestStateHistory<Response>) {
    if (requestStateHistory.current.type === RESPONSE_RECEIVED) {
      return [requestStateHistory.current, ...requestStateHistory.previousResponses]
    } else {
      return requestStateHistory.previousResponses
    }
  }
}