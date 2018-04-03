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

export const CLEAR_CACHE = 'CLEAR_CACHE'

export interface IClearCacheAction {
  type: typeof CLEAR_CACHE
  resourceId: string
  currentTime: Date
}

export function clearCacheAction(resourceId: string, currentTime: Date): IClearCacheAction {
  return {
    type: CLEAR_CACHE,
    resourceId,
    currentTime
  }
}

export function isClearCacheAction(action: GenericAction): action is IClearCacheAction {
  return action.type === CLEAR_CACHE
}

export const CLEAR_CACHE_ITEM = 'CLEAR_CACHE_ITEM'

export interface IClearCacheItemAction<Key> {
  type: typeof CLEAR_CACHE_ITEM
  resourceId: string
  key: Key,
  currentTime: Date
}

export function clearCacheItemAction<Key>(resourceId: string, key: Key, currentTime: Date): IClearCacheItemAction<Key> {
  return {
    type: CLEAR_CACHE_ITEM,
    resourceId,
    key,
    currentTime
  }
}

export function isClearCacheItemAction<Key>(action: GenericAction): action is IClearCacheItemAction<Key> {
  return action.type === CLEAR_CACHE_ITEM
}

export type ResourceAction<Key, Result> 
  = IAwaitingResultAction<Key>
  | IResultArrivedAction<Key, Result>
  | IClearCacheAction
  | IClearCacheItemAction<Key>
