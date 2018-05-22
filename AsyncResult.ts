import { flatten } from './utils'
import { ADVICE, AWAITING_RESULT, REQUEST_CANCELLED, RESULT_EXPIRED, RESULT_RECEIVED } from './consts'
import * as CacheItem from './CacheItem'
import * as RequestState from './RequestState'
import { RESULT_ARRIVED } from './old/Action'

export type AsyncResult<Result>
  = AwaitingResult<Result>
  | ResultReceived<Result>
  | Advice<Result>

export class AwaitingResult<Result> {
  public readonly type: 'AWAITING_RESULT'

  constructor(
    public readonly previousResults: Result[]) {

  }
}

export class ResultReceived<Result> {
  public readonly type: 'RESULT_RECEIVED'

  constructor(
    public readonly result: Result,
    public readonly previousResults: Result[]) {

  }
}

export class Advice<Result> {
  public readonly type: 'ADVICE'

  constructor(public readonly previousResults: Result[]) {
  }
}

export interface Factory<Result> {

  awaitingResult(previousResults: Result[]): AwaitingResult<Result>

  resultReceived(result: Result, previousResults: Result[]): ResultReceived<Result>

  advice(previousResults: Result[]): Advice<Result>
}

export function defaultFactory<Result>(): Factory<Result> {
  return {
    awaitingResult(previousResults: Result[]): AwaitingResult<Result> {
      return new AwaitingResult(previousResults)
    },
    resultReceived(result: Result, previousResults: Result[]): ResultReceived<Result> {
      return new ResultReceived(result, previousResults)
    },
    advice(previousResults: Result[]): Advice<Result> {
      return new Advice<Result>(previousResults)
    }
  }
}

export function forKey<Key, Result>(cacheItems: CacheItem.CacheItem<Key, Result>[], key: Key, keysAreEqual: (left: Key, right: Key) => boolean, factory: Factory<Result>): AsyncResult<Result> {
  const cacheItemsForKey = cacheItems
    .filter(cacheItem => keysAreEqual(cacheItem.key, key))
    .sort(CacheItem.ordering)

  const [head, ...tail] = cacheItemsForKey

  const previousResults = tail.reduce((acc: Result[], curr: CacheItem.CacheItem<Key, Result>): Result[] => {
    if (curr.requestState.type === RESULT_RECEIVED || curr.requestState.type === RESULT_EXPIRED) {
      return [...acc, curr.requestState.result]
    } else {
      return acc
    }
  }, [])

  if (head === undefined || head.requestState.type === RESULT_EXPIRED || head.requestState.type === REQUEST_CANCELLED) {
    return factory.advice(previousResults)
  } else {
    if (head.requestState.type === AWAITING_RESULT) {
      return factory.awaitingResult(previousResults)
    } else if (head.requestState.type === RESULT_RECEIVED) {
      return factory.resultReceived(head.requestState.result, previousResults)
    } else {
      const exhaustive: never = head.requestState
      throw new Error(exhaustive)
    }
  }
}

export function map<A, B>(asyncResult: AsyncResult<A>, fn: (a: A) => B): AsyncResult<B> {
  const mappedPreviousResults = asyncResult.previousResults.map(fn)
  switch (asyncResult.type) {
    case AWAITING_RESULT:
      return new AwaitingResult(mappedPreviousResults)
    case RESULT_RECEIVED:
      return new ResultReceived(fn(asyncResult.result), mappedPreviousResults)
    case ADVICE:
      return new Advice(mappedPreviousResults)
    default:
      const exhaustive: never = asyncResult
      throw new Error(exhaustive)
  }
}

export function flatMap<A, B>(asyncResult: AsyncResult<A>, fn: (a: A) => AsyncResult<B>, factory: Factory<B>): AsyncResult<B> {
  const flatMappedPreviousResults = flatten(asyncResult.previousResults.map(fn).map(ar => ar.previousResults))
  switch (asyncResult.type) {
    case AWAITING_RESULT:
      return factory.awaitingResult(flatMappedPreviousResults)
    case RESULT_RECEIVED: {
      const flatMapped = fn(asyncResult.result)
      const previousResults = flatMapped.previousResults.concat(flatMappedPreviousResults)
      switch (flatMapped.type) {
        case AWAITING_RESULT:
          return factory.awaitingResult(previousResults)
        case RESULT_RECEIVED:
          return factory.resultReceived(flatMapped.result, previousResults)
        case ADVICE:
          return factory.advice(previousResults)
        default:
          const exhaustive: never = flatMapped
          throw new Error(exhaustive)
      }
    }
    case ADVICE:
      return factory.advice(flatMappedPreviousResults)
    default:
      const exhaustive: never = asyncResult
      throw new Error(exhaustive)
  }
}
