import * as CacheItem from '../CacheItem'
import { createCacheItemsReducer } from '../createCacheItemsReducer'
import * as Action from '../Action'
import {
  dateTime1,
  dateTime2,
  dateTime3,
  requestId1,
  requestId2,
  requestId3,
  requestId4,
  smallValidity
} from './data'
import { AWAITING_RESULT, RESULT_EXPIRED, RESULT_RECEIVED } from '../consts'
import { addSeconds } from '../utils'
import { numbersAreEqual } from './util'

describe('createCacheItemsReducer', () => {

  const resourceId = 'resource-id'

  const reducer = createCacheItemsReducer<number, string>(resourceId, numbersAreEqual, smallValidity, 3)

  function reduce(actions: Action.GenericAction[]) {
    return actions.reduce<Array<CacheItem.CacheItem<number, string>>>(reducer, [])
  }

  it('should be able to handle requests and responses (the basics)', () => {
    const state = reduce([
      Action.awaitingResultAction(resourceId, requestId1, 1, dateTime1),
      Action.awaitingResultAction(resourceId, requestId2, 2, dateTime1),
      Action.resultReceivedAction(resourceId, requestId1, 1, 'one', dateTime1)
    ])

    expect(state).toHaveLength(2)
    expect(state).toEqual(expect.arrayContaining([
      {
        key: 1,
        requestState: {type: RESULT_RECEIVED, result: 'one', updatedAt: dateTime1.valueOf()}
      },
      {
        key: 2,
        requestState: {type: AWAITING_RESULT, requestId: requestId2, updatedAt: dateTime1.valueOf()}
      }
    ]))
  })

  it('should hold an expired result for a cache item that was cleared', () => {
    const state = reduce([
      Action.awaitingResultAction(resourceId, requestId1, 1, dateTime1),
      Action.resultReceivedAction(resourceId, requestId1, 1, 'one', dateTime1),
      Action.awaitingResultAction(resourceId, requestId2, 2, dateTime1),
      Action.resultReceivedAction(resourceId, requestId2, 2, 'two', dateTime1),
      Action.clearCacheItemAction(resourceId, 1, dateTime1)
    ])

    expect(state).toHaveLength(2)
    expect(state).toEqual(expect.arrayContaining([
      {
        key: 1,
        requestState: {type: RESULT_EXPIRED, result: 'one', updatedAt: dateTime1.valueOf()}
      },
      {
        key: 2,
        requestState: {type: RESULT_RECEIVED, result: 'two', updatedAt: dateTime1.valueOf()}
      }
    ]))
  })

  it('should hold only expired results for a cache that was cleared', () => {
    const state = reduce([
      Action.awaitingResultAction(resourceId, requestId1, 1, dateTime1),
      Action.resultReceivedAction(resourceId, requestId1, 1, 'one', dateTime1),
      Action.awaitingResultAction(resourceId, requestId2, 2, dateTime1),
      Action.resultReceivedAction(resourceId, requestId2, 2, 'two', dateTime1),
      Action.awaitingResultAction(resourceId, requestId3, 3, dateTime1),
      Action.clearCacheAction(resourceId, dateTime1)
    ])

    expect(state).toHaveLength(2)
    expect(state).toEqual(expect.arrayContaining([
      {
        key: 1,
        requestState: {type: RESULT_EXPIRED, result: 'one', updatedAt: dateTime1.valueOf()}
      },
      {
        key: 2,
        requestState: {type: RESULT_EXPIRED, result: 'two', updatedAt: dateTime1.valueOf()}
      }
    ]))
  })

  it('should be able to handle race conditions (first response arriving earlier)', () => {
    const state = reduce([
      Action.awaitingResultAction(resourceId, requestId1, 1, dateTime1),
      Action.awaitingResultAction(resourceId, requestId2, 1, dateTime1),
      Action.resultReceivedAction(resourceId, requestId1, 1, 'one', dateTime1),
      Action.resultReceivedAction(resourceId, requestId2, 1, 'two', dateTime1)
    ])

    expect(state).toHaveLength(1)
    expect(state).toEqual(expect.arrayContaining([
      {
        key: 1,
        requestState: {type: RESULT_RECEIVED, result: 'two', updatedAt: dateTime1.valueOf()}
      }
    ]))
  })

  it('should be able to handle race conditions (second response arriving earlier)', () => {
    const state = reduce([
      Action.awaitingResultAction(resourceId, requestId1, 1, dateTime1),
      Action.awaitingResultAction(resourceId, requestId2, 1, dateTime1),
      Action.resultReceivedAction(resourceId, requestId2, 1, 'two', dateTime1),
      Action.resultReceivedAction(resourceId, requestId1, 1, 'one', dateTime1)
    ])

    expect(state).toHaveLength(1)
    expect(state).toEqual(expect.arrayContaining([
      {
        key: 1,
        requestState: {type: RESULT_RECEIVED, result: 'two', updatedAt: dateTime1.valueOf()}
      }
    ]))
  })

  it('should retain only the maximum allowed number of cache items, favouring fresh responses over old ones', () => {
    const state = reduce([
      // Start three requests:
      Action.awaitingResultAction(resourceId, requestId1, 1, dateTime1),
      Action.awaitingResultAction(resourceId, requestId2, 2, dateTime1),
      Action.awaitingResultAction(resourceId, requestId3, 3, dateTime1),

      // Let the reponses come in, one at a time:
      Action.resultReceivedAction(resourceId, requestId1, 1, 'one', addSeconds(dateTime1, 1)),
      Action.resultReceivedAction(resourceId, requestId2, 2, 'two', addSeconds(dateTime1, 2)),
      Action.resultReceivedAction(resourceId, requestId3, 3, 'three', addSeconds(dateTime1, 3)),

      // Start a new request, making the cache size exceed its limit:
      Action.awaitingResultAction(resourceId, requestId4, 4, addSeconds(dateTime1, 4))
    ])

    expect(state).toHaveLength(3)
    expect(state).toEqual(expect.arrayContaining([
      {
        key: 2,
        requestState: {type: RESULT_RECEIVED, result: 'two', updatedAt: addSeconds(dateTime1, 2).valueOf()}
      },
      {
        key: 3,
        requestState: {type: RESULT_RECEIVED, result: 'three', updatedAt: addSeconds(dateTime1, 3).valueOf()}
      },
      {
        key: 4,
        requestState: {type: AWAITING_RESULT, requestId: requestId4, updatedAt: addSeconds(dateTime1, 4).valueOf()}
      }
    ]))
  })

  it('should retain only the maximum allowed number of cache items, favouring arrived responses over expired responses', () => {
    const state = reduce([
      // Start three requests:
      Action.awaitingResultAction(resourceId, requestId1, 1, dateTime1),
      Action.awaitingResultAction(resourceId, requestId2, 2, dateTime1),
      Action.awaitingResultAction(resourceId, requestId3, 3, dateTime1),

      // Let the reponses come in, one at a time:
      Action.resultReceivedAction(resourceId, requestId1, 1, 'one', addSeconds(dateTime1, 1)),
      Action.resultReceivedAction(resourceId, requestId2, 2, 'two', addSeconds(dateTime1, 2)),
      Action.resultReceivedAction(resourceId, requestId3, 3, 'three', addSeconds(dateTime1, 3)),

      // Expire the freshest response, to see if that will be removed:
      Action.clearCacheItemAction(resourceId, 3, addSeconds(dateTime1, 3)),

      // Start a new request, making the cache size exceed its limit:
      Action.awaitingResultAction(resourceId, requestId4, 4, addSeconds(dateTime1, 4))
    ])

    expect(state).toHaveLength(3)
    expect(state).toEqual(expect.arrayContaining([
      {
        key: 1,
        requestState: {type: RESULT_RECEIVED, result: 'one', updatedAt: addSeconds(dateTime1, 1).valueOf()}
      },
      {
        key: 2,
        requestState: {type: RESULT_RECEIVED, result: 'two', updatedAt: addSeconds(dateTime1, 2).valueOf()}
      },
      {
        key: 4,
        requestState: {type: AWAITING_RESULT, requestId: requestId4, updatedAt: addSeconds(dateTime1, 4).valueOf()}
      }
    ]))
  })

  it('should retain only the maximum allowed number of cache items, favouring pending requests over arrived responses', () => {
    const state = reduce([
      // Start three requests:
      Action.awaitingResultAction(resourceId, requestId1, 1, dateTime1),
      Action.awaitingResultAction(resourceId, requestId2, 2, dateTime1),
      Action.awaitingResultAction(resourceId, requestId3, 3, dateTime1),

      // Let the reponses come in, one at a time, expect the third request:
      Action.resultReceivedAction(resourceId, requestId1, 1, 'one', addSeconds(dateTime1, 1)),
      Action.resultReceivedAction(resourceId, requestId2, 2, 'two', addSeconds(dateTime1, 2)),

      // Start a new request, making the cache size exceed its limit:
      Action.awaitingResultAction(resourceId, requestId4, 4, addSeconds(dateTime1, 4))
    ])

    expect(state).toHaveLength(3)
    expect(state).toEqual(expect.arrayContaining([
      {
        key: 2,
        requestState: {type: RESULT_RECEIVED, result: 'two', updatedAt: addSeconds(dateTime1, 2).valueOf()}
      },
      {
        key: 3,
        requestState: {type: AWAITING_RESULT, requestId: requestId3, updatedAt: dateTime1.valueOf()}
      },
      {
        key: 4,
        requestState: {type: AWAITING_RESULT, requestId: requestId4, updatedAt: addSeconds(dateTime1, 4).valueOf()}
      }
    ]))
  })

  it('should be able to hold a response if its lifetime has not yet passed', () => {
    const state = reduce([
      Action.awaitingResultAction(resourceId, requestId1, 1, dateTime1),
      Action.resultReceivedAction(resourceId, requestId1, 1, 'one', dateTime1),

      // Another action, to trigger expiration:
      Action.awaitingResultAction(resourceId, requestId2, 2, dateTime2)
    ])

    expect(state).toEqual(expect.arrayContaining([
      {
        key: 1,
        requestState: {type: RESULT_RECEIVED, result: 'one', updatedAt: dateTime1.valueOf()}
      }
    ]))
  })

  it('should be able to hold an expired response if its lifetime has passed', () => {
    const state = reduce([
      Action.awaitingResultAction(resourceId, requestId1, 1, dateTime1),
      Action.resultReceivedAction(resourceId, requestId1, 1, 'one', dateTime1),

      // Another action, to trigger expiration:
      Action.awaitingResultAction(resourceId, requestId2, 2, dateTime3)
    ])

    expect(state).toEqual(expect.arrayContaining([
      {
        key: 1,
        requestState: {type: RESULT_EXPIRED, result: 'one', updatedAt: dateTime3.valueOf()}
      }
    ]))
  })
})