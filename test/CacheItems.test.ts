import { addSeconds } from 'date-fns'

import { CacheItem } from '../CacheItem'
import { truncate } from '../CacheItems'
import { bigLifetime, later, muchLater, now } from './data'

describe('Cache items', () => {

  it('should only contain the maximum number of items', () => {

    const timeStepInMiliseconds = 10 * 1000
    const time1 = now
    const time2 = addSeconds(time1, timeStepInMiliseconds)
    const time3 = addSeconds(time2, timeStepInMiliseconds)
    const time4 = addSeconds(time3, timeStepInMiliseconds)

    const cacheItem1: CacheItem<number, string> = {
      key: 1,
      value: 'one',
      validityInMiliseconds: bigLifetime,
      forcedInvalid: false,
      updated: now.valueOf()
    }
    
    const cacheItem2: CacheItem<number, string> = {
      key: 2,
      value: 'two',
      validityInMiliseconds: bigLifetime,
      forcedInvalid: false,
      updated: later.valueOf()
    }

    const cacheItem3: CacheItem<number, string> = {
      key: 3,
      value: 'three',
      validityInMiliseconds: bigLifetime,
      forcedInvalid: false,
      updated: muchLater.valueOf()
    }

    const cacheItems = [cacheItem2, cacheItem1, cacheItem3]
    const truncatedCacheItems = truncate(cacheItems, 2)
    expect(truncatedCacheItems).toEqual([cacheItem2, cacheItem3])
  })
})