import { CacheItem } from './CacheItem'
import { CacheDefinition } from './CacheDefinition'
import { awaitingResultAction, ResourceAction, resultArrivedAction } from './Action'
import { ADVICE, AWAITING_RESULT, REQUEST_CANCELLED, RESULT_EXPIRED, RESULT_RECEIVED } from './consts'
import { LazyList } from './LazyList'

export type AwaitingResult<Result> = Readonly<{
  type: 'AWAITING_RESULT'
  previousResult: Result | null
}>

export type ResultReceived<Result> = Readonly<{
  type: 'RESULT_RECEIVED',
  result: Result
}>

export type Advice<Result, Action, State> = Readonly<{
  type: 'ADVICE'
  followAdvice(dispatch: (action: Action) => void, getState: () => State): Promise<void>
  previousResult: Result | null
}>

export type AsyncResultCandidate<Result, Action, State>
  = AwaitingResult<Result>
  | ResultReceived<Result>
  | Advice<Result, Action, State>

export function withPreviousResult<Result, Action, State>(asyncResult: AsyncResultCandidate<Result, Action, State>, previousResult: Result): AsyncResultCandidate<Result, Action, State> {
  if (asyncResult.type === AWAITING_RESULT) {
    return { ...asyncResult, previousResult }
  } else if (asyncResult.type === RESULT_RECEIVED) {
    return asyncResult
  } else if (asyncResult.type === ADVICE) {
    return { ...asyncResult, previousResult }
  } else {
    const exhaustive: never = asyncResult
    throw new Error(exhaustive)
  }
}

function createFollowAdvice<Input, Key, Result, State>(getPromise: (getState: () => State) => Promise<Result>,
                                                       cacheDefinition: CacheDefinition<Input, Key, Result, State>,
                                                       key: Key,
                                                       requestId: string): Advice<Result, ResourceAction<Key, Result>, State>['followAdvice'] {

  return (dispatch: (action: ResourceAction<Key, Result>) => void, getState: () => State): Promise<void> => {
    const cacheItems = cacheDefinition.cacheItemsSelector(getState())
    if (CacheItem.hasResult(cacheItems, cacheDefinition.keysAreEqual, key, cacheDefinition.validityInMiliseconds, new Date())) {
      dispatch(awaitingResultAction(cacheDefinition.cacheId, requestId, key, new Date()))
      return getPromise(getState).then(result => {
        dispatch(resultArrivedAction(cacheDefinition.cacheId, requestId, key, result, new Date()))
      })
    } else {
      return Promise.resolve()
    }
  }
}

export function toAsyncResultCandidates<Input, Key, Result, State>(cacheItems: Array<CacheItem<Key, Result>>,
                                                                   getPromise: (getState: () => State) => Promise<Result>,
                                                                   cacheDefinition: CacheDefinition<Input, Key, Result, State>,
                                                                   key: Key,
                                                                   requestId: string): AsyncResultCandidate<Result, ResourceAction<Key, Result>, State> {

  type Candidate = AsyncResultCandidate<Result, ResourceAction<Key, Result>, State>

  const intermediateAsyncResults = LazyList.flatMap(
    LazyList.fromArray(cacheItems),
    cacheItem => {
      if (cacheItem.requestState.type === AWAITING_RESULT) {
        return LazyList.fromArray<Candidate>([{type: AWAITING_RESULT, previousResult: null}])
      } else if (cacheItem.requestState.type === REQUEST_CANCELLED) {
        return LazyList.fromArray<Candidate>([
          {
            type: ADVICE,
            followAdvice: createFollowAdvice(getPromise, cacheDefinition, key, requestId),
            previousResult: null
          }
        ])
      } else if (cacheItem.requestState.type === RESULT_RECEIVED) {
        return LazyList.fromArray<Candidate>([{type: RESULT_RECEIVED, result: cacheItem.requestState.result}])
      } else if (cacheItem.requestState.type === RESULT_EXPIRED) {
        return LazyList.fromArray<Candidate>([
          {
            type: ADVICE,
            followAdvice: createFollowAdvice(getPromise, cacheDefinition, key, requestId),
            previousResult: null
          },
          {
            type: RESULT_RECEIVED,
            result: cacheItem.requestState.result
          }
        ])
      } else {
        const exhaustive: never = cacheItem.requestState
        throw new Error(exhaustive)
      }
    }
  )

  const head = LazyList.head(intermediateAsyncResults)
  const tail = LazyList.tail(intermediateAsyncResults)
  if (head === undefined || tail === undefined) {
    return {
      type: ADVICE,
      followAdvice: createFollowAdvice(getPromise, cacheDefinition, key, requestId),
      previousResult: null
    }
  } else {
    const nextResult = LazyList.head(LazyList.filter(tail, a => a.type === RESULT_RECEIVED ? a : false))
    if (nextResult !== undefined) {
      return withPreviousResult(head, nextResult.result)
    } else {
      return head
    }
  }
}