import * as AsyncResult from '../AsyncResult'
import { ADVICE, AWAITING_RESULT, REQUEST_CANCELLED, RESULT_EXPIRED, RESULT_RECEIVED } from '../consts'
import { CacheItem } from '../CacheItem'
import { numbersAreEqual, stringsAreEqual } from './util'
import { dateTime1, dateTime2, dateTime3, requestId1 } from './data'

describe('AsyncResult', () => {

  function factory<Result>(): AsyncResult.Factory<Result> {
    return {
      ...AsyncResult.defaultFactory<Result>(),
      advice(previousResults: Result[]): AsyncResult.Advice<Result> {
        return {
          type: ADVICE,
          previousResults
        }
      }
    }
  }

  describe('forKey', () => {

    it('should be able to conclude that a new requests needs to be started (no result available)', () => {
      const cacheItems: CacheItem<number, string>[] = []
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, factory())
      if (asyncResult.type === ADVICE) {
        expect(asyncResult.previousResults).toEqual([])
      } else {
        fail()
      }
    })

    it('should be able to conclude that a new requests needs to be started (result expired)', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: 'one', updatedAt: dateTime1.valueOf()}
        }
      ]
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, factory())
      if (asyncResult.type === ADVICE) {
        expect(asyncResult.previousResults).toEqual(['one'])
      } else {
        fail()
      }
    })

    it('should be able to conclude that a new requests needs to be started (result cancelled)', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: REQUEST_CANCELLED, updatedAt: dateTime1.valueOf()}
        }
      ]
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, factory())
      if (asyncResult.type === ADVICE) {
        expect(asyncResult.previousResults).toEqual([])
      } else {
        fail()
      }
    })

    it('should be able to conclude that a request is running (no previous results)', () => {
      const cacheItems: CacheItem<number, string>[] = [
        {
          key: 1,
          requestState: {type: AWAITING_RESULT, requestId: requestId1, updatedAt: dateTime1.valueOf()}
        }
      ]
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, factory())
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
          requestState: {type: RESULT_EXPIRED, result: 'one', updatedAt: dateTime2.valueOf()}
        }
      ]
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, factory())
      if (asyncResult.type === AWAITING_RESULT) {
        expect(asyncResult.previousResults).toEqual(['one', 'eins'])
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
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, factory())
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
      const asyncResult = AsyncResult.forKey(cacheItems, 1, numbersAreEqual, factory())
      if (asyncResult.type === RESULT_RECEIVED) {
        expect(asyncResult.result).toEqual('one')
        expect(asyncResult.previousResults).toEqual(['eins'])
      } else {
        fail()
      }
    })

  })

  describe('flatMap', () => {

    type Cat = {
      id: string,
      name: string,
      vaccinated: boolean,
      ownerId: number
    }

    type Owner = {
      id: number,
      name: string
    }

    it('should be able to map one `ResultReceived` to another', () => {
      const catCacheItems: CacheItem<string, Cat>[] = [
        {
          key: 'bob-the-cat',
          requestState: {type: RESULT_RECEIVED, result: {id: 'bob-the-cat', name: 'Bob', ownerId: 1, vaccinated: true}, updatedAt: dateTime2.valueOf()}
        },
        {
          key: 'bob-the-cat',
          requestState: {type: RESULT_EXPIRED, result: {id: 'bob-the-cat', name: 'Bob', ownerId: 1, vaccinated: false}, updatedAt: dateTime1.valueOf()}
        }
      ]
      const ownerCacheItems: CacheItem<number, Owner>[] = [
        {
          key: 1,
          requestState: {type: RESULT_RECEIVED, result: {id: 1, name: 'Marianne'}, updatedAt: dateTime1.valueOf()}
        }
      ]
      const catAsyncResult = AsyncResult.forKey(catCacheItems, 'bob-the-cat', stringsAreEqual, factory())
      const ownerAsyncResult = AsyncResult.flatMap(
        catAsyncResult,
        cat => AsyncResult.forKey(ownerCacheItems, cat.ownerId, numbersAreEqual, factory()),
        factory()
      )
      if (ownerAsyncResult.type === RESULT_RECEIVED) {
        expect(ownerAsyncResult.result).toEqual({id: 1, name: 'Marianne'})
        expect(ownerAsyncResult.previousResults).toEqual([{id: 1, name: 'Marianne'}])
      } else {
        fail()
      }
    })

    it('should be able to map a `ResultReceived` to an `AwaitingResult`', () => {
      const catCacheItems: CacheItem<string, Cat>[] = [
        {
          key: 'bob-the-cat',
          requestState: {type: RESULT_RECEIVED, result: {id: 'bob-the-cat', name: 'Bob', ownerId: 1, vaccinated: true}, updatedAt: dateTime2.valueOf()}
        },
        {
          key: 'bob-the-cat',
          requestState: {type: RESULT_EXPIRED, result: {id: 'bob-the-cat', name: 'Bob', ownerId: 1, vaccinated: false}, updatedAt: dateTime1.valueOf()}
        }
      ]
      const ownerCacheItems: CacheItem<number, Owner>[] = [
        {
          key: 1,
          requestState: {type: AWAITING_RESULT, requestId: '1', updatedAt: dateTime2.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: {id: 1, name: 'Marianne'}, updatedAt: dateTime1.valueOf()}
        }
      ]
      const catAsyncResult = AsyncResult.forKey(catCacheItems, 'bob-the-cat', stringsAreEqual, factory())
      const ownerAsyncResult = AsyncResult.flatMap(
        catAsyncResult,
        cat => AsyncResult.forKey(ownerCacheItems, cat.ownerId, numbersAreEqual, factory()),
        factory()
      )
      if (ownerAsyncResult.type === AWAITING_RESULT) {
        expect(ownerAsyncResult.previousResults).toEqual([{id: 1, name: 'Marianne'}])
      } else {
        fail()
      }
    })

    it('should be able to map a `ResultReceived` to an `Advice`', () => {
      const catCacheItems: CacheItem<string, Cat>[] = [
        {
          key: 'bob-the-cat',
          requestState: {type: RESULT_RECEIVED, result: {id: 'bob-the-cat', name: 'Bob', ownerId: 1, vaccinated: true}, updatedAt: dateTime2.valueOf()}
        },
        {
          key: 'bob-the-cat',
          requestState: {type: RESULT_EXPIRED, result: {id: 'bob-the-cat', name: 'Bob', ownerId: 1, vaccinated: false}, updatedAt: dateTime1.valueOf()}
        }
      ]
      const ownerCacheItems: CacheItem<number, Owner>[] = [
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: {id: 1, name: 'Marianne'}, updatedAt: dateTime1.valueOf()}
        }
      ]
      const catAsyncResult = AsyncResult.forKey(catCacheItems, 'bob-the-cat', stringsAreEqual, factory())
      const ownerAsyncResult = AsyncResult.flatMap(
        catAsyncResult,
        cat => AsyncResult.forKey(ownerCacheItems, cat.ownerId, numbersAreEqual, factory()),
        factory()
      )
      if (ownerAsyncResult.type === ADVICE) {
        expect(ownerAsyncResult.previousResults).toEqual([{id: 1, name: 'Marianne'}])
      } else {
        fail()
      }
    })

    it('should be able to provide previous results when a new source result was provided', () => {
      const catCacheItems: CacheItem<string, Cat>[] = [
        {
          key: 'bob-the-cat',
          requestState: {type: RESULT_RECEIVED, result: {id: 'bob-the-cat', name: 'Bob', ownerId: 2, vaccinated: false}, updatedAt: dateTime2.valueOf()}
        },
        {
          key: 'bob-the-cat',
          requestState: {type: RESULT_EXPIRED, result: {id: 'bob-the-cat', name: 'Bob', ownerId: 1, vaccinated: false}, updatedAt: dateTime1.valueOf()}
        }
      ]
      const ownerCacheItems: CacheItem<number, Owner>[] = [
        {
          key: 1,
          requestState: {type: RESULT_RECEIVED, result: {id: 1, name: 'Marianne'}, updatedAt: dateTime1.valueOf()}
        },
        {
          key: 2,
          requestState: {type: AWAITING_RESULT, requestId: '1', updatedAt: dateTime2.valueOf()}
        }
      ]
      const catAsyncResult = AsyncResult.forKey(catCacheItems, 'bob-the-cat', stringsAreEqual, factory())
      const ownerAsyncResult = AsyncResult.flatMap(
        catAsyncResult,
        cat => AsyncResult.forKey(ownerCacheItems, cat.ownerId, numbersAreEqual, factory()),
        factory()
      )
      if (ownerAsyncResult.type === AWAITING_RESULT) {
        expect(ownerAsyncResult.previousResults).toEqual([{id: 1, name: 'Marianne'}])
      } else {
        fail()
      }
    })

    it('should be able to provide previous results when a new target result was provided', () => {
      const catCacheItems: CacheItem<string, Cat>[] = [
        {
          key: 'bob-the-cat',
          requestState: {type: RESULT_RECEIVED, result: {id: 'bob-the-cat', name: 'Bob', ownerId: 1, vaccinated: false}, updatedAt: dateTime2.valueOf()}
        }
      ]
      const ownerCacheItems: CacheItem<number, Owner>[] = [
        {
          key: 1,
          requestState: {type: RESULT_EXPIRED, result: {id: 1, name: 'Marianne Rutherford'}, updatedAt: dateTime2.valueOf()}
        },
        {
          key: 1,
          requestState: {type: RESULT_RECEIVED, result: {id: 1, name: 'Marianne Rutherford-Jackson'}, updatedAt: dateTime2.valueOf()}
        }
      ]
      const catAsyncResult = AsyncResult.forKey(catCacheItems, 'bob-the-cat', stringsAreEqual, factory())
      const ownerAsyncResult = AsyncResult.flatMap(
        catAsyncResult,
        cat => AsyncResult.forKey(ownerCacheItems, cat.ownerId, numbersAreEqual, factory()),
        factory()
      )
      if (ownerAsyncResult.type === RESULT_RECEIVED) {
        expect(ownerAsyncResult.result).toEqual({id: 1, name: 'Marianne Rutherford-Jackson'})
        expect(ownerAsyncResult.previousResults).toEqual([{id: 1, name: 'Marianne Rutherford'}])
      } else {
        fail()
      }
    })
  })
})