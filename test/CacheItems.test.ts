import { addSeconds } from 'date-fns'

import { CacheItem } from '../CacheItem'
import { CacheItems } from '../CacheItems'
import { bigLifetime, later, muchLater, now, hugeLifetime, muchMuchLater } from './data'

describe('Cache items', () => {

  const cacheItem1: CacheItem<number, string> = {
    key: 1,
    value: 'one',
    validityInMiliseconds: hugeLifetime,
    forcedInvalid: false,
    updated: now.valueOf()
  }

  const cacheItem2: CacheItem<number, string> = {
    key: 2,
    value: 'two',
    validityInMiliseconds: hugeLifetime,
    forcedInvalid: false,
    updated: later.valueOf()
  }

  const cacheItem3: CacheItem<number, string> = {
    key: 3,
    value: 'three',
    validityInMiliseconds: hugeLifetime,
    forcedInvalid: false,
    updated: muchLater.valueOf()
  }

  function numbersAreEqual(left: number, right: number): boolean {
    return left === right
  }

  it('should hold no result for a cache item that was cleared', () => {
    const cacheItems = [cacheItem1, cacheItem2, cacheItem3]
    const clearedCacheItems = CacheItems.clear(cacheItems)
    expect(CacheItems.getValueIfValid(clearedCacheItems, numbersAreEqual, cacheItem1.key, muchMuchLater)).toEqual(undefined)
    expect(CacheItems.getValueIfValid(clearedCacheItems, numbersAreEqual, cacheItem2.key, muchMuchLater)).toEqual(undefined)
    expect(CacheItems.getValueIfValid(clearedCacheItems, numbersAreEqual, cacheItem3.key, muchMuchLater)).toEqual(undefined)
  })

  it('should hold no result for a cache item that was cleared individually', () => {
    const cacheItems = [cacheItem1, cacheItem2, cacheItem3]
    const clearedCacheItems = CacheItems.clearItem(cacheItems, numbersAreEqual, cacheItem2.key)
    expect(CacheItems.getValueIfValid(clearedCacheItems, numbersAreEqual, cacheItem1.key, muchMuchLater)).toEqual(cacheItem1.value)
    expect(CacheItems.getValueIfValid(clearedCacheItems, numbersAreEqual, cacheItem2.key, muchMuchLater)).toEqual(undefined)
    expect(CacheItems.getValueIfValid(clearedCacheItems, numbersAreEqual, cacheItem3.key, muchMuchLater)).toEqual(cacheItem3.value)
  })
  
  it('should only contain the maximum number of items', () => {
    const cacheItems = [cacheItem2, cacheItem1, cacheItem3]
    const truncatedCacheItems = CacheItems.truncate(cacheItems, 2)
    expect(truncatedCacheItems).toEqual([cacheItem2, cacheItem3])
  })
})