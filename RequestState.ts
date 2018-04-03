export const AWAITING_RESPONSE = 'AWAITING_RESPONSE'
export type AwaitingResponse = Readonly<{
  type: 'AWAITING_RESPONSE',
  requestId: string,
}>

export const REQUEST_CANCELLED = 'REQUEST_CANCELLED'
export type RequestCancelled = Readonly<{
  type: 'REQUEST_CANCELLED',
}>

export const RESPONSE_RECEIVED = 'RESPONSE_RECEIVED'
export type ResponseReceived<Response> = Readonly<{
  type: 'RESPONSE_RECEIVED',
  response: Response
}>

export const RESPONSE_EXPIRED = 'RESPONSE_EXPIRED'
export type ResponseExpired<Response> = Readonly<{
  type: 'RESPONSE_EXPIRED',
  response: Response
}>

export type RequestState<Response> 
  = AwaitingResponse
  | RequestCancelled
  | ResponseReceived<Response>
  | ResponseExpired<Response>

export const RequestState = {

  awaitingResponse(requestId: string): AwaitingResponse {
    return {
      type: AWAITING_RESPONSE,
      requestId,
    }
  },

  requestCancelled(): RequestCancelled {
    return {
      type: REQUEST_CANCELLED
    }
  },

  responseReceived<Response>(response: Response): ResponseReceived<Response> {
    return {
      type: RESPONSE_RECEIVED,
      response
    }
  },

  responseExpired<Response>(response: Response): ResponseExpired<Response> {
    return {
      type: RESPONSE_EXPIRED,
      response
    }
  },

  handleResponse<Response>(requestState: RequestState<Response>, requestId: string, response: Response): RequestState<Response> {
    if (requestState.type === AWAITING_RESPONSE && requestState.requestId === requestId) {
      return RequestState.responseReceived(response)
    } else {
      return requestState
    }
  },

  expire<Response>(requestState: RequestState<Response>): RequestState<Response> {
    if (requestState.type === RESPONSE_RECEIVED) {
      return RequestState.responseExpired(requestState.response)
    } else if (requestState.type === AWAITING_RESPONSE) {
      return RequestState.requestCancelled()
    } else {
      return requestState
    }
  }
}
