export const AWAITING_RESPONSE = 'AWAITING_RESPONSE'
export type AwaitingResponse<Response> = Readonly<{
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

export type RequestState<Response> = AwaitingResponse<Response> | ResponseReceived<Response>

export const RequestState = {

  awaitingResponse<Response>(requestId: string): AwaitingResponse<Response> {
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
  }
}
