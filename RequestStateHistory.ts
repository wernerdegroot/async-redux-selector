import { RequestState, ResponseReceived, AWAITING_RESPONSE, RESPONSE_RECEIVED } from "./RequestState";

export type RequestStateHistory<Response> = Readonly<{
  current: RequestState<Response>,
  history: Array<ResponseReceived<Response>>
}>

export const RequestStateHistory = {
  firstRequest<Response>(requestId: string): RequestStateHistory<Response> {
    return {
      current: RequestState.awaitingResponse(requestId),
      history: []
    }
  },

  nextRequest<Response>(requestStateHistory: RequestStateHistory<Response>, requestId: string): RequestStateHistory<Response> {
    const current = RequestState.awaitingResponse(requestId)
    if (requestStateHistory.current.type === AWAITING_RESPONSE) {
      return {
        current,
        history: requestStateHistory.history
      }
    } else if (requestStateHistory.current.type === RESPONSE_RECEIVED) {
      return {
        current,
        history: [requestStateHistory.current, ...requestStateHistory.history]
      }
    } else {
      const exhaustive: never = requestStateHistory.current
      throw new Error(exhaustive)
    }
  },

  responseReceived<Response>(requestStateHistory: RequestStateHistory<Response>, requestId: string, response: Response, now: Date): RequestStateHistory<Response> {
    if (requestId === requestStateHistory.current.requestId) {
      const current = RequestState.responseReceived(requestId, response, now)
      if (requestStateHistory.current.type === AWAITING_RESPONSE) {
        return {
          current,
          history: requestStateHistory.history
        }
      } else if (requestStateHistory.current.type === RESPONSE_RECEIVED) {
        return {
          current,
          history: [requestStateHistory.current, ...requestStateHistory.history]
        }
      } else {
        const exhaustive: never = requestStateHistory.current
        throw new Error(exhaustive)
      }
    } else {
      return requestStateHistory
    }
  }
}