import { awaitingResult, CacheItems, getAsyncResultIfValid, resultArrived, truncate } from './CacheItems'
import { v4 as uuid } from 'uuid'
import { AsyncResultOrAdvice, DefaultAdvice, IAdvice } from './AsyncResultOrAdvice'
import { CacheItem } from './CacheItem' // Required to prevent compile error.
import { GenericAction, isAwaitingResultAction, isResultArrivedAction } from './Action'
import { ResourceAction } from './Action'

const DEFAULT_VALIDITY_IN_MILISECONDS = 60 * 60 * 1000
const DEFAULT_MAX_NUMBER_OF_CACHE_ITEMS = 5

export interface ICreateResourceParam<Input, Key, Result, Action extends { type: string }, State> {
  resourceId: string
  runner: (input: Input, getState: () => State) => Promise<Result>
  inputToKey: (input: Input) => Key
  cacheSelector: (state: State) => CacheItems<Key, Result>
  keysAreEqual?: (left: Key, right: Key) => boolean
  validityInMiliseconds?: number
  maxNumberOfCacheItems?: number
}

export function createResource<Input, Key, Result, Action extends { type: string }, State>(p: ICreateResourceParam<Input, Key, Result, Action, State>) {

  function defaultKeysAreEqual(left: Key, right: Key) {
    return left === right
  }

  return new Resource<Input, Key, Result, Action, State>(
    p.resourceId,
    p.runner,
    p.inputToKey,
    p.cacheSelector,
    p.keysAreEqual === undefined ? defaultKeysAreEqual : p.keysAreEqual,
    p.validityInMiliseconds === undefined ? DEFAULT_VALIDITY_IN_MILISECONDS : p.validityInMiliseconds,
    p.maxNumberOfCacheItems === undefined ? DEFAULT_MAX_NUMBER_OF_CACHE_ITEMS : p.maxNumberOfCacheItems
  )
}

export interface ICreateResourceShortParam<Input, Result, Action extends { type: string }, State> {
  resourceId: string
  runner: (input: Input, getState: () => State) => Promise<Result>
  cacheSelector: (state: State) => CacheItems<Input, Result>
  inputsAreEqual?: (left: Input, right: Input) => boolean
  validityInMiliseconds?: number
  maxNumberOfCacheItems?: number
}

export function createResourceShort<Input, Result, Action extends { type: string }, State>(p: ICreateResourceShortParam<Input, Result, Action, State>) {

  function defaultInputsAreEqual(left: Input, right: Input) {
    return left === right
  }

  return new Resource<Input, Input, Result, Action, State>(
    p.resourceId,
    p.runner,
    (input: Input) => input,
    p.cacheSelector,
    p.inputsAreEqual === undefined ? defaultInputsAreEqual : p.inputsAreEqual,
    p.validityInMiliseconds === undefined ? DEFAULT_VALIDITY_IN_MILISECONDS : p.validityInMiliseconds,
    p.maxNumberOfCacheItems === undefined ? DEFAULT_MAX_NUMBER_OF_CACHE_ITEMS : p.maxNumberOfCacheItems
  )
}

export class Resource<Input, Key, Result, Action extends { type: string }, State> {

  constructor(public readonly resourceId: string,
              private readonly runner: (input: Input, getState: () => State) => Promise<Result>,
              private readonly inputToKey: (input: Input) => Key,
              private readonly cacheSelector: (state: State) => CacheItems<Key, Result>,
              private readonly keysAreEqual: (left: Key, right: Key) => boolean,
              private readonly validityInMiliseconds: number,
              private readonly maxNumberOfCacheItems: number) {

  }

  public selector = (cache: CacheItems<Key, Result>, input: Input): AsyncResultOrAdvice<Result, ResourceAction<Key, Result>, State> => {
    const now = new Date()
    const possibleAsyncResult = getAsyncResultIfValid(cache, this.keysAreEqual, this.inputToKey(input), now)
    if (possibleAsyncResult === undefined) {
      return this.getAdvice(input)
    } else {
      return possibleAsyncResult
    }
  }

  public reducer = (cache: CacheItems<Key, Result> = [], action: GenericAction): CacheItems<Key, Result> => {
    if (isAwaitingResultAction<Key>(action)) {
      return action.resourceId === this.resourceId
        ? awaitingResult(cache, this.keysAreEqual, this.validityInMiliseconds, action.requestId, action.key)
        : cache
    } else if (isResultArrivedAction<Key, Result>(action)) {
      if (action.resourceId === this.resourceId) {
        return truncate(resultArrived(cache, this.keysAreEqual, action.requestId, action.key, action.result, action.currentTime), this.maxNumberOfCacheItems)
      } else {
        return cache
      }
    } else {
      return cache
    }
  }

  private getAdvice(input: Input): IAdvice<ResourceAction<Key, Result>, State> {
    const requestId = uuid()
    return new DefaultAdvice(
      this.runner,
      this.cacheSelector,
      this.inputToKey,
      this.keysAreEqual,
      input,
      this.resourceId,
      requestId
    )
  }
}
