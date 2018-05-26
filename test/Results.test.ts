import * as AsyncResult from '../Results'
import { AWAITING_RESULT, REQUEST_CANCELLED, RESULT_EXPIRED, RESULT_RECEIVED } from '../consts'
import { CacheItem } from '../CacheItem'
import { numbersAreEqual } from './util'
import { dateTime1, dateTime2, dateTime3, requestId1 } from './data'

describe('Results', () => {

  describe('mostRecent', () => {

    const alternative: false = false

    it('should return the most recent result when many results are available', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: RESULT_RECEIVED, result: 'one', updatedAt: dateTime1.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_RECEIVED, result: 'uno', updatedAt: dateTime2.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_RECEIVED, result: 'eins', updatedAt: dateTime3.valueOf()}
        }
      ]
      const result = AsyncResult.mostRecent(cacheItems, 1, numbersAreEqual, alternative)
      expect(result).toEqual('eins')
    })

    it('should return the most recent expired result when no results are available but many expired results are', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'one', updatedAt: dateTime1.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'uno', updatedAt: dateTime2.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'eins', updatedAt: dateTime3.valueOf()}
        }
      ]
      const result = AsyncResult.mostRecent(cacheItems, 1, numbersAreEqual, alternative)
      expect(result).toEqual('eins')
    })

    it('should favor results over expired results (even in the crazy situation that the expired results is newer than the result)', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: RESULT_RECEIVED, result: 'one', updatedAt: dateTime1.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'uno', updatedAt: dateTime2.valueOf()}
        }
      ]
      const result = AsyncResult.mostRecent(cacheItems, 1, numbersAreEqual, alternative)
      expect(result).toEqual('one')
    })

    it('should return the previous (expired) result when a new request is in progress but no results has arrived yet', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: AWAITING_RESULT, requestId: requestId1, updatedAt: dateTime2.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'one', updatedAt: dateTime1.valueOf()}
        }
      ]
      const result = AsyncResult.mostRecent(cacheItems, 1, numbersAreEqual, alternative)
      expect(result).toEqual('one')
    })

    it('should return the alternative when the cache is empty', () => {
      const cacheItems: CacheItem<number, string>[] = []
      const result = AsyncResult.mostRecent(cacheItems, 1, numbersAreEqual, alternative)
      expect(result).toEqual(false)
    })

    it('should return the alternative when only running requests and cancelled requests are available', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: REQUEST_CANCELLED, updatedAt: dateTime1.valueOf()}
        },
        {
          key: 1,
          requestState: {type: AWAITING_RESULT, requestId: requestId1, updatedAt: dateTime2.valueOf()}
        }
      ]
      const result = AsyncResult.mostRecent(cacheItems, 1, numbersAreEqual, alternative)
      expect(result).toEqual(false)
    })
  })

  describe('allAvailable', () => {

    it('should return all available results (with the more recent result up front and the oldest expired result in the back)', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'een', updatedAt: dateTime1.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_RECEIVED, result: 'one', updatedAt: dateTime3.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'eins', updatedAt: dateTime2.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_RECEIVED, result: 'uno', updatedAt: dateTime2.valueOf()}
        }
      ]
      const results = AsyncResult.allAvailable(cacheItems, 1, numbersAreEqual)
      expect(results).toEqual(['one', 'uno', 'eins', 'een'])
    })

    it('should ignore running requests and cancelled requests', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: AWAITING_RESULT, requestId: requestId1, updatedAt: dateTime2.valueOf()}
        },
        {
          key: 1,
          requestState: {type: REQUEST_CANCELLED, updatedAt: dateTime1.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'one', updatedAt: dateTime1.valueOf()}
        }
      ]
      const results = AsyncResult.allAvailable(cacheItems, 1, numbersAreEqual)
      expect(results).toEqual(['one'])
    })

    it('should return an empty array when the cache is empty', () => {
      const cacheItems: CacheItem<number, string>[] = []
      const results = AsyncResult.allAvailable(cacheItems, 1, numbersAreEqual)
      expect(results).toEqual([])
    })

    it('should return an empty array when ony running requests and cancelled requests are available', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: REQUEST_CANCELLED, updatedAt: dateTime1.valueOf()}
        },
        {
          key: 1,
          requestState: {type: AWAITING_RESULT, requestId: requestId1, updatedAt: dateTime1.valueOf()}
        }
      ]
      const results = AsyncResult.allAvailable(cacheItems, 1, numbersAreEqual)
      expect(results).toEqual([])
    })
  })
})