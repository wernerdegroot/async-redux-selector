import { addMilliseconds } from 'date-fns'
import { AwaitingResponse, ResponseReceived, RequestState, RESPONSE_RECEIVED } from './RequestState'
import { ResourceAction, isAwaitingResultAction, isResultArrivedAction, isClearCacheAction, isClearCacheItemAction, GenericAction } from './Action';

export type CacheItem<Key, Response> = Readonly<{
  key: Key,
  requestState: RequestState<Response>,
  updatedAt: number // `Date` as a `number`.
}>

export const CacheItem = {

  hasResponse<Key, Response>(cacheItems: Array<CacheItem<Key, Response>>, keysAreEqual: (left: Key, right: Key) => boolean, key: Key, validityInMiliseconds: number, now: Date) {
    const cacheItemWithResponse = cacheItems.find(cacheItem => {
      return keysAreEqual(cacheItem.key, key)
        && cacheItem.requestState.type === RESPONSE_RECEIVED
        && cacheItem.updatedAt + validityInMiliseconds > now.valueOf()
    })

    return cacheItemWithResponse !== undefined
  }
}