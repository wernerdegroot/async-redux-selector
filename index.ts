import { AsyncResult } from './AsyncResult'
import { CacheDefinition } from './CacheDefinition'
import { CacheItems } from './CacheItems'

const DEFAULT_VALIDITY_IN_MILISECONDS = 60 * 60 * 1000
const DEFAULT_MAX_NUMBER_OF_CACHE_ITEMS = 5

export interface ICacheDefinitionObj<Input, Key, Result, State> {
  cacheId: string
  cacheItemsSelector: (state: State) => CacheItems<Input, AsyncResult<Result>>
  inputToKey: (input: Input) => Key,
  keysAreEqual?: (left: Input, right: Input) => boolean
  validityInMiliseconds?: number
  maxNumberOfCacheItems?: number
}

export interface ICacheDefinitionWhenKeyIsInputObj<Input, Result, State> {
  cacheId: string
  cacheItemsSelector: (state: State) => CacheItems<Input, AsyncResult<Result>>
  inputsAreEqual?: (left: Input, right: Input) => boolean
  validityInMiliseconds?: number
  maxNumberOfCacheItems?: number
}

function toCacheDefinitionObj<Input, Result, State>(o: ICacheDefinitionWhenKeyIsInputObj<Input, Result, State>): ICacheDefinitionObj<Input, Input, Result, State> {
  return {
    cacheId: o.cacheId,
    cacheItemsSelector: o.cacheItemsSelector,
    inputToKey: (input: Input) => input,
    keysAreEqual: o.inputsAreEqual,
    validityInMiliseconds: o.validityInMiliseconds,
    maxNumberOfCacheItems: o.maxNumberOfCacheItems
  }
}

function defaultKeysAreEqual(left: any, right: any): boolean {
  return left === right
}

function Cache<Input, Result, State>(o: ICacheDefinitionWhenKeyIsInputObj<Input, Result, State>): CacheDefinition<Input, Input, Result, State>
function Cache<Input, Key, Result, State>(o: ICacheDefinitionObj<Input, Key, Result, State>): CacheDefinition<Input, Key, Result, State>
function Cache<Input, Result, State>(o: ICacheDefinitionObj<Input, any, Result, State> | ICacheDefinitionWhenKeyIsInputObj<Input, Result, State> & { inputToKey: never }): CacheDefinition<Input, any, Result, State> {
  const oo: ICacheDefinitionObj<Input, any, Result, State> = o.inputToKey === undefined
    ? toCacheDefinitionObj(o)
    : o

  return new CacheDefinition<Input, any, Result, State>(
    oo.cacheId,
    oo.cacheItemsSelector,
    oo.inputToKey,
    oo.keysAreEqual || defaultKeysAreEqual,
    oo.validityInMiliseconds || DEFAULT_VALIDITY_IN_MILISECONDS,
    oo.maxNumberOfCacheItems || DEFAULT_MAX_NUMBER_OF_CACHE_ITEMS
  )
}
