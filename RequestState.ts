export const NO_REQUEST = 'NO_REQUEST'
export type NoRequest = Readonly<{
  type: 'NO_REQUEST'
}>

export const AWAITING_RESPONSE = 'AWAITING_RESPONSE'
export type AwaitingResponse = Readonly<{
  type: 'AWAITING_RESPONSE',
  requestId: string,
}>

export const RESPONSE_RECEIVED = 'RESPONSE_RECEIVED'
export type ResponseReceived<Response> = Readonly<{
  type: 'RESPONSE_RECEIVED',
  requestId: string,
  response: Response,
  receivedAt: number, // A `Date`-object converted to a number.
}>

export const EXPIRED_RESPONSE = 'EXPIRED_RESPONSE'
export type ExpiredResponse = Readonly<{
  type: 'EXPIRED_RESPONSE'
}>

export type RequestState<Response> 
  = NoRequest
  | AwaitingResponse
  | ResponseReceived<Response>
  | ExpiredResponse

export const RequestState = {

  noRequest(): NoRequest {
    return {
      type: NO_REQUEST
    }
  },

  awaitingResponse(requestId: string): AwaitingResponse {
    return {
      type: AWAITING_RESPONSE,
      requestId,
    }
  },

  responseReceived<Response>(requestId: string, response: Response, receivedAt: Date): ResponseReceived<Response> {
    return {
      type: RESPONSE_RECEIVED,
      requestId,
      response,
      receivedAt: receivedAt.valueOf()
    }
  },

  expiredResponse(): ExpiredResponse {
    return {
      type: EXPIRED_RESPONSE
    }
  }
}
