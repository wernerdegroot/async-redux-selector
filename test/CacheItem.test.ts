import { CacheItem } from '../CacheItem'
import { bigLifetime, later, muchLater, now, smallLifetime } from './data'

describe('CacheItem', () => {

  it('should be valid when its lifetime is not over yet', () => {
    const expectedValid: CacheItem<number, string> = { 
      key: 0, 
      value: 'zero', 
      validityInMiliseconds: bigLifetime, 
      forcedInvalid: false, 
      updated: now
    }

    expect(CacheItem.isValid(expectedValid, later)).toEqual(true)
  })

  it('should not be valid after it was forced to be invalid', () => {
    const cacheItem: CacheItem<number, string> = { 
      key: 1, 
      value: 'one', 
      validityInMiliseconds: bigLifetime, 
      forcedInvalid: false, 
      updated: now
    }
    const expectedInvalid = CacheItem.forceInvalid(cacheItem)

    expect(CacheItem.isValid(expectedInvalid, later)).toEqual(false)
  })

  it('should not be valid after its lifetime is over', () => {
    const expectedInvalid: CacheItem<number, string> = {
      key: 2,
      value: 'two',
      validityInMiliseconds: smallLifetime,
      forcedInvalid: false,
      updated: now
    }
    expect(CacheItem.isValid(expectedInvalid, later)).toEqual(false)
  })

  it('should be valid when the lifetime is over but it was updated before the lifetime was over', () => {
    const cacheItem: CacheItem<number, string> = {
      key: 3,
      value: 'three',
      validityInMiliseconds: bigLifetime,
      forcedInvalid: false,
      updated: now
    }
    const updatedCacheItem = CacheItem.update(
      cacheItem,
      value => value + '!',
      later
    )
    expect(updatedCacheItem.value).toEqual('three!')
    expect(CacheItem.isValid(updatedCacheItem, muchLater)).toEqual(true)
  })

  it('should order cache items by the time they ware last updated', () => {
    const cacheItem1: CacheItem<number, string> = {
      key: 1,
      value: 'one',
      validityInMiliseconds: bigLifetime,
      forcedInvalid: false,
      updated: now
    }
    
    const cacheItem2: CacheItem<number, string> = {
      key: 2,
      value: 'two',
      validityInMiliseconds: bigLifetime,
      forcedInvalid: false,
      updated: later 
    }

    const cacheItem3: CacheItem<number, string> = {
      key: 3,
      value: 'three',
      validityInMiliseconds: bigLifetime,
      forcedInvalid: false,
      updated: muchLater 
    }

    expect([cacheItem2, cacheItem1, cacheItem3].sort(CacheItem.order)).toEqual([cacheItem1, cacheItem2, cacheItem3])
  })
})