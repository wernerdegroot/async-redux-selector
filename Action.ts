import { AWAITING_RESULT, CLEAR_CACHE, CLEAR_CACHE_ITEM, RESULT_RECEIVED } from './consts'

export interface GenericAction {
  type: string
}

export interface IAwaitingResultAction<Key> {
  type: 'AWAITING_RESULT'
  resourceId: string
  requestId: string
  key: Key
  currentTime: number
}

export function awaitingResultAction<Key>(resourceId: string, requestId: string, key: Key, currentTime: Date): IAwaitingResultAction<Key> {
  return {
    type: AWAITING_RESULT,
    resourceId,
    requestId,
    key,
    currentTime: currentTime.valueOf()
  }
}

export function isAwaitingResultAction<Key>(action: GenericAction): action is IAwaitingResultAction<Key> {
  return action.type === AWAITING_RESULT
}

export interface IResultReceivedAction<Key, Result> {
  type: 'RESULT_RECEIVED'
  resourceId: string
  requestId: string
  key: Key
  result: Result
  currentTime: number
}

export function resultReceivedAction<Key, Result>(resourceId: string, requestId: string, key: Key, result: Result, currentTime: Date): IResultReceivedAction<Key, Result> {
  return {
    type: RESULT_RECEIVED,
    resourceId,
    requestId,
    key,
    result,
    currentTime: currentTime.valueOf()
  }
}

export function isResultReceivedAction<Key, Result>(action: GenericAction): action is IResultReceivedAction<Key, Result> {
  return action.type === RESULT_RECEIVED
}

export interface IClearCacheAction {
  type: 'CLEAR_CACHE'
  resourceId: string
  currentTime: number
}

export function clearCacheAction(resourceId: string, currentTime: Date): IClearCacheAction {
  return {
    type: CLEAR_CACHE,
    resourceId,
    currentTime: currentTime.valueOf()
  }
}

export function isClearCacheAction(action: GenericAction): action is IClearCacheAction {
  return action.type === CLEAR_CACHE
}

export interface IClearCacheItemAction<Key> {
  type: 'CLEAR_CACHE_ITEM'
  resourceId: string
  key: Key,
  currentTime: number
}

export function clearCacheItemAction<Key>(resourceId: string, key: Key, currentTime: Date): IClearCacheItemAction<Key> {
  return {
    type: CLEAR_CACHE_ITEM,
    resourceId,
    key,
    currentTime: currentTime.valueOf()
  }
}

export function isClearCacheItemAction<Key>(action: GenericAction): action is IClearCacheItemAction<Key> {
  return action.type === CLEAR_CACHE_ITEM
}

export type Action<Key, Result>
  = IAwaitingResultAction<Key>
  | IResultReceivedAction<Key, Result>
  | IClearCacheAction
  | IClearCacheItemAction<Key>

export function isAction<Key, Result>(action: GenericAction): action is Action<Key, Result> {
  return isAwaitingResultAction<Key>(action) ||
    isResultReceivedAction<Key, Result>(action) ||
    isClearCacheAction(action) ||
    isClearCacheItemAction(action)
}
