export interface GenericAction {
  type: string
}

export const AWAITING_RESULT = 'AWAITING_RESULT'

export interface IAwaitingResultAction<I> {
  type: typeof AWAITING_RESULT
  resourceId: string
  requestId: string
  input: I
  currentTime: Date
}

export function awaitingResultAction<I>(resourceId: string, requestId: string, input: I, currentTime: Date): IAwaitingResultAction<I> {
  return {
    type: AWAITING_RESULT,
    resourceId,
    requestId,
    input,
    currentTime
  }
}

export function isAwaitingResultAction<I>(action: GenericAction): action is IAwaitingResultAction<I> {
  return action.type === AWAITING_RESULT
}

export const RESULT_ARRIVED = 'RESULT_ARRIVED'

export interface IResultArrivedAction<I, R> {
  type: typeof RESULT_ARRIVED
  resourceId: string
  requestId: string
  input: I
  result: R
}

export function resultArrivedAction<I, R>(resourceId: string, requestId: string, input: I, result: R): IResultArrivedAction<I, R> {
  return {
    type: RESULT_ARRIVED,
    resourceId,
    requestId,
    input,
    result
  }
}

export type ResourceAction<I, R> = IAwaitingResultAction<I> | IResultArrivedAction<I, R>
