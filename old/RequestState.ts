import { AWAITING_RESULT, REQUEST_CANCELLED, RESULT_EXPIRED, RESULT_RECEIVED } from './consts'

export type AwaitingResult = Readonly<{
  type: 'AWAITING_RESULT',
  requestId: string
}>

export type RequestCancelled = Readonly<{
  type: 'REQUEST_CANCELLED',
}>

export type ResultReceived<Response> = Readonly<{
  type: 'RESULT_RECEIVED',
  result: Response
}>

export type ResultExpired<Response> = Readonly<{
  type: 'RESULT_EXPIRED',
  result: Response
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

  resultReceived<Result>(result: Result): ResultReceived<Result> {
    return {
      type: RESULT_RECEIVED,
      result
    }
  },

  resultExpired<Result>(result: Result): ResultExpired<Result> {
    return {
      type: RESULT_EXPIRED,
      result
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
      return RequestState.resultExpired(requestState.result)
    } else if (requestState.type === AWAITING_RESULT) {
      return RequestState.requestCancelled()
    } else {
      return requestState
    }
  }
}
