import * as AsyncResult from '../AsyncResult'
import { AWAITING_RESULT, REQUEST_CANCELLED, RESULT_EXPIRED, RESULT_RECEIVED } from '../consts'
import { CacheItem } from '../CacheItem'
import { numbersAreEqual } from './util'
import { dateTime1, dateTime2, dateTime3, requestId1 } from './data'

describe('AsyncResult', () => {

  describe('forKey', () => {

    type Alternative = { type: 'ALTERNATIVE' }
    const alternative: Alternative = {type: 'ALTERNATIVE'}

    it('should be able to conclude that a new requests needs to be started (no result available)', () => {
      const cacheItems: CacheItem<number, string>[] = []
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, alternative)
      expect(asyncResult.type).toEqual('ALTERNATIVE')
    })

    it('should be able to conclude that a new requests needs to be started (result expired)', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'one', updatedAt: dateTime1.valueOf()}
        }
      ]
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, alternative)
      expect(asyncResult.type).toEqual('ALTERNATIVE')
    })

    it('should be able to conclude that a new requests needs to be started (result cancelled)', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: REQUEST_CANCELLED, updatedAt: dateTime1.valueOf()}
        }
      ]
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, alternative)
      expect(asyncResult.type).toEqual('ALTERNATIVE')
    })

    it('should be able to conclude that a request is running (no previous results)', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: AWAITING_RESULT, requestId: requestId1, updatedAt: dateTime1.valueOf()}
        }
      ]
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, alternative)
      if (asyncResult.type === AWAITING_RESULT) {
        expect(asyncResult.previousResults).toHaveLength(0)
      } else {
        fail()
      }
    })

    it('should be able to conclude that a request is running (with previous results)', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: AWAITING_RESULT, requestId: requestId1, updatedAt: dateTime3.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'eins', updatedAt: dateTime2.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'one', updatedAt: dateTime1.valueOf()}
        }
      ]
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, alternative)
      if (asyncResult.type === AWAITING_RESULT) {
        expect(asyncResult.previousResults).toEqual(['eins', 'one'])
      } else {
        fail()
      }
    })

    it('should be able to conclude that a result is received (no previous results)', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: RESULT_RECEIVED, result: 'one', updatedAt: dateTime1.valueOf()}
        }
      ]
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, alternative)
      if (asyncResult.type === RESULT_RECEIVED) {
        expect(asyncResult.result).toEqual('one')
        expect(asyncResult.previousResults).toHaveLength(0)
      } else {
        fail()
      }
    })

    it('should be able to conclude that a result is received (with previous results)', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'eins', updatedAt: dateTime2.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_RECEIVED, result: 'one', updatedAt: dateTime1.valueOf()}
        }
      ]
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, alternative)
      if (asyncResult.type === RESULT_RECEIVED) {
        expect(asyncResult.result).toEqual('one')
        expect(asyncResult.previousResults).toEqual(['eins'])
      } else {
        fail()
      }
    })

  })
})