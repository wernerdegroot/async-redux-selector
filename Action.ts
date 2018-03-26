export interface GenericAction {
  type: string
}

export const AWAITING_RESULT = 'AWAITING_RESULT'

export interface IAwaitingResultAction<Key> {
  type: typeof AWAITING_RESULT
  resourceId: string
  requestId: string
  key: Key
  currentTime: Date
}

export function awaitingResultAction<Key>(resourceId: string, requestId: string, key: Key, currentTime: Date): IAwaitingResultAction<Key> {
  return {
    type: AWAITING_RESULT,
    resourceId,
    requestId,
    key,
    currentTime
  }
}

export function isAwaitingResultAction<Key>(action: GenericAction): action is IAwaitingResultAction<Key> {
  return action.type === AWAITING_RESULT
}

export const RESULT_ARRIVED = 'RESULT_ARRIVED'

export interface IResultArrivedAction<Key, Result> {
  type: typeof RESULT_ARRIVED
  resourceId: string
  requestId: string
  key: Key
  result: Result
  currentTime: Date
}

export function resultArrivedAction<Key, Result>(resourceId: string, requestId: string, key: Key, result: Result, currentTime: Date): IResultArrivedAction<Key, Result> {
  return {
    type: RESULT_ARRIVED,
    resourceId,
    requestId,
    key,
    result,
    currentTime
  }
}

export function isResultArrivedAction<Key, Result>(action: GenericAction): action is IResultArrivedAction<Key, Result> {
  return action.type === RESULT_ARRIVED
}

export type ResourceAction<Key, Result> = IAwaitingResultAction<Key> | IResultArrivedAction<Key, Result>
