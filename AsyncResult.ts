import { flatten } from './utils'
import { AWAITING_RESULT, REQUEST_CANCELLED, RESULT_EXPIRED, RESULT_RECEIVED } from './consts'
import * as CacheItem from './CacheItem'
import * as RequestState from './RequestState'
import { RESULT_ARRIVED } from './old/Action'

export type AsyncResult<Result>
  = AwaitingResult<Result>
  | ResultReceived<Result>

export class AwaitingResult<Result> {
  public readonly type: 'AWAITING_RESULT' = AWAITING_RESULT

  constructor(
    public readonly previousResults: Result[]) {

  }
}

export class ResultReceived<Result> {
  public readonly type: 'RESULT_RECEIVED' = RESULT_RECEIVED

  constructor(
    public readonly result: Result,
    public readonly previousResults: Result[]) {

  }
}

export function forKey<Key, Result, Alternative>(cacheItems: CacheItem.CacheItem<Key, Result>[], key: Key, keysAreEqual: (left: Key, right: Key) => boolean, alternative: Alternative): AsyncResult<Result> | Alternative {
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

  if (head === undefined || head.requestState.type === REQUEST_CANCELLED) {
    return alternative
  } else if (head.requestState.type === RESULT_EXPIRED) {
    return alternative
  } else {
    if (head.requestState.type === AWAITING_RESULT) {
      return new AwaitingResult(previousResults)
    } else if (head.requestState.type === RESULT_RECEIVED) {
      return new ResultReceived(head.requestState.result, previousResults)
    } else {
      const exhaustive: never = head.requestState
      throw new Error(exhaustive)
    }
  }
}
