export const AWAITING_RESULT = 'AWAITING_RESULT'
export type AwaitingResult = Readonly<{
  type: 'AWAITING_RESULT',
  requestId: string
}>

export const REQUEST_CANCELLED = 'REQUEST_CANCELLED'
export type RequestCancelled = Readonly<{
  type: 'REQUEST_CANCELLED',
}>

export const RESULT_RECEIVED = 'RESULT_RECEIVED'
export type ResultReceived<Response> = Readonly<{
  type: 'RESULT_RECEIVED',
  response: Response
}>

export const RESULT_EXPIRED = 'RESULT_EXPIRED'
export type ResultExpired<Response> = Readonly<{
  type: 'RESULT_EXPIRED',
  response: Response
}>

export type RequestState<Result>
  = AwaitingResult
  | RequestCancelled
  | ResultReceived<Result>
  | ResultExpired<Result>

export const RequestState = {

  awaitingResult(requestId: string): AwaitingResult {
    return {
      type: AWAITING_RESULT,
      requestId,
    }
  },

  requestCancelled(): RequestCancelled {
    return {
      type: REQUEST_CANCELLED
    }
  },

  resultReceived<Response>(response: Response): ResultReceived<Response> {
    return {
      type: RESULT_RECEIVED,
      response
    }
  },

  resultExpired<Response>(response: Response): ResultExpired<Response> {
    return {
      type: RESULT_EXPIRED,
      response
    }
  },

  handleResult<Result>(requestState: RequestState<Result>, requestId: string, result: Result): RequestState<Result> {
    if (requestState.type === AWAITING_RESULT && requestState.requestId === requestId) {
      return RequestState.resultReceived(result)
    } else {
      return requestState
    }
  },

  expire<Response>(requestState: RequestState<Response>): RequestState<Response> {
    if (requestState.type === RESULT_RECEIVED) {
      return RequestState.resultExpired(requestState.response)
    } else if (requestState.type === AWAITING_RESULT) {
      return RequestState.requestCancelled()
    } else {
      return requestState
    }
  }
}
