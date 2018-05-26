import { AWAITING_RESULT, REQUEST_CANCELLED, RESULT_EXPIRED, RESULT_RECEIVED } from './consts'

export type AwaitingResult = Readonly<{
  type: 'AWAITING_RESULT',
  requestId: string,
  updatedAt: number // `Date` as a `number`.
}>

export type RequestCancelled = Readonly<{
  type: 'REQUEST_CANCELLED',
  updatedAt: number // `Date` as a `number`.
}>

export type ResultReceived<Result> = Readonly<{
  type: 'RESULT_RECEIVED',
  result: Result,
  updatedAt: number // `Date` as a `number`.
}>

export type ResultExpired<Result> = Readonly<{
  type: 'RESULT_EXPIRED',
  result: Result,
  updatedAt: number // `Date` as a `number`.
}>

export type RequestState<Result>
  = AwaitingResult
  | RequestCancelled
  | ResultReceived<Result>
  | ResultExpired<Result>

// Used to order `RequestState<...>`-instances.
const typeIndex: Record<RequestState<any>['type'], number> = {
  [AWAITING_RESULT]: 0,
  [RESULT_RECEIVED]: 1,
  [RESULT_EXPIRED]: 2,
  [REQUEST_CANCELLED]: 3
}

export function ordering(left: RequestState<any>, right: RequestState<any>): number {
  const typeOrdering = typeIndex[left.type] - typeIndex[right.type]
  if (typeOrdering === 0) {
    return right.updatedAt - left.updatedAt
  } else {
    return typeOrdering
  }
}

export function awaitingResult(requestId: string, updatedAt: number): AwaitingResult {
  return {
    type: AWAITING_RESULT,
    requestId,
    updatedAt
  }
}

export function requestCancelled(updatedAt: number): RequestCancelled {
  return {
    type: REQUEST_CANCELLED,
    updatedAt
  }
}

export function resultReceived<Result>(result: Result, updatedAt: number): ResultReceived<Result> {
  return {
    type: RESULT_RECEIVED,
    result,
    updatedAt
  }
}

export function resultExpired<Result>(result: Result, updatedAt: number): ResultExpired<Result> {
  return {
    type: RESULT_EXPIRED,
    result,
    updatedAt
  }
}
