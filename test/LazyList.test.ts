import { Lazy, LazyList } from '../LazyList'

describe('A lazy value', () => {
  it('should only be evaluated when asked', () => {
    let numberOfTimesEvaluated = 0
    const lazy = Lazy.of(() => {
      numberOfTimesEvaluated++
      return 4
    })
    expect(numberOfTimesEvaluated).toEqual(0)
    expect(lazy()).toEqual(4)
    expect(numberOfTimesEvaluated).toEqual(1)
    expect(lazy()).toEqual(4)
    expect(numberOfTimesEvaluated).toEqual(1)
    expect(lazy()).toEqual(4)
  })
})

describe('A lazy list', () => {
  it('should have a `map` function that calls the mapping only when asked', () => {
    const calledFor: number[] = []
    const lazyList = LazyList.fromArray([0, 1, 2])
    const mappedLazyList = LazyList.map(lazyList, i => {
      calledFor.push(i)
      return i + '!'
    })

    let head: string
    let tail: LazyList<string> = mappedLazyList

    const assertion = (expectedCalledFor: number[], expectedNextHead: string) => () => {
      const nextHead = LazyList.head(tail)
      const nextTail = LazyList.tail(tail)

      if (nextHead === undefined) {
        fail('Expected the head to be defined')
        return
      }

      if (nextTail === undefined) {
        fail('Expected the tail to be defined')
        return
      }

      expect(calledFor).toEqual(expectedCalledFor)
      expect(nextHead).toEqual(expectedNextHead)

      head = nextHead
      tail = nextTail
    }

    // First, we expect the mapping to not have been called yet:
    expect(calledFor).toEqual([])

    // Next, check the progression of the heads and very that the mapping hasn't been called too much:
    let assertions: Array<() => void> = [
      assertion([0], '0!'),
      assertion([0, 1], '1!'),
      assertion([0, 1, 2], '2!')
    ]
    assertions.forEach(fn => fn())

    // We should have reached the end of the lazy list:
    expect(LazyList.head(tail)).toEqual(undefined)

    // If we reset the entire thing, we don't expect the mapping to be called any further:
    tail = mappedLazyList

    assertions = [
      assertion([0, 1, 2], '0!'),
      assertion([0, 1, 2], '1!'),
      assertion([0, 1, 2], '2!')
    ]
    assertions.forEach(fn => fn())
  })

  it('should have a `flatMap` function that calls the mapping only when asked', () => {
    const calledFor: number[] = []
    const lazyList = LazyList.fromArray([0, 1, 2])
    const flatMappedLazyList = LazyList.flatMap(lazyList, i => {
      calledFor.push(i)
      return LazyList.fromArray([i + '!', i + '?'])
    })

    let head: string
    let tail: LazyList<string> = flatMappedLazyList

    const assertion = (expectedCalledFor: number[], expectedNextHead: string) => () => {
      const nextHead = LazyList.head(tail)
      const nextTail = LazyList.tail(tail)

      if (nextHead === undefined) {
        fail('Expected the head to be defined')
        return
      }

      if (nextTail === undefined) {
        fail('Expected the tail to be defined')
        return
      }

      expect(calledFor).toEqual(expectedCalledFor)
      expect(nextHead).toEqual(expectedNextHead)

      head = nextHead
      tail = nextTail
    }

    // First, we expect the mapping to not have been called yet:
    expect(calledFor).toEqual([])

    // Next, check the progression of the heads and very that the mapping hasn't been called too much:
    let assertions: Array<() => void> = [
      assertion([0], '0!'),
      assertion([0], '0?'),
      assertion([0, 1], '1!'),
      assertion([0, 1], '1?'),
      assertion([0, 1, 2], '2!'),
      assertion([0, 1, 2], '2?')
    ]
    assertions.forEach(fn => fn())

    // We should have reached the end of the lazy list:
    expect(LazyList.head(tail)).toEqual(undefined)

    // If we reset the entire thing, we don't expect the mapping to be called any further:
    tail = flatMappedLazyList

    assertions = [
      assertion([0, 1, 2], '0!'),
      assertion([0, 1, 2], '0?'),
      assertion([0, 1, 2], '1!'),
      assertion([0, 1, 2], '1?'),
      assertion([0, 1, 2], '2!'),
      assertion([0, 1, 2], '2?')
    ]
    assertions.forEach(fn => fn())
  })
})