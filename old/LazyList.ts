export type Lazy<A> = () => A

export const Lazy = {
  of<A>(fn: () => A): Lazy<A> {
    type State
      = { evaluated: false, evaluator: () => A }
      | { evaluated: true, value: A }
    let state: State = { evaluated: false, evaluator: fn }
    return () => {
      if (state.evaluated === true) {
        return state.value
      } else {
        const value = state.evaluator()
        state = { evaluated: true, value }
        return value
      }
    }
  }
}

export type LazyNil = null
export type LazyCons<A> = { head: A, tail: LazyList<A> }
export type LazyList<A> = Lazy<LazyCons<A> | LazyNil>

export const LazyList = {

  empty<A>(): LazyList<A> {
    return Lazy.of(() => null)
  },

  singleton<A>(a: Lazy<A>): LazyList<A> {
    return Lazy.of(() => {
      return {
        head: a(),
        tail: LazyList.empty<A>()
      }
    })
  },

  fromArray<A>(lst: A[]): LazyList<A> {
    return Lazy.of(() => {
      if (lst.length <= 0) {
        return null
      } else {
        const [head, ...tail] = lst
        return { head, tail: LazyList.fromArray(tail) }
      }
    })
  },

  generate<A>(fn: (prev: A) => A, initial: A): LazyList<A> {
    return Lazy.of(() => {
      return {
        head: initial,
        tail: LazyList.generate(fn, fn(initial))
      }
    })
  },

  head<A>(ll: LazyList<A>): A | undefined {
    const evaluated = ll()
    if (evaluated === null) {
      return undefined
    } else {
      return evaluated.head
    }
  },

  tail<A>(ll: LazyList<A>): LazyList<A> | undefined {
    const evaluated = ll()
    if (evaluated === null) {
      return undefined
    } else {
      return evaluated.tail
    }
  },

  concat<A>(left: LazyList<A>, right: LazyList<A>): LazyList<A> {
    return Lazy.of(() => {
      const evaluated = left()
      if (evaluated === null) {
        return right()
      } else {
        return {
          head: evaluated.head,
          tail: LazyList.concat(evaluated.tail, right)
        }
      }
    })
  },

  flatten<A>(ll: LazyList<LazyList<A>>): LazyList<A> {
    return Lazy.of(() => {
      const evaluated = ll()
      if (evaluated === null) {
        return null
      } else {
        return LazyList.concat(evaluated.head, LazyList.flatten(evaluated.tail))()
      }
    })
  },

  map<A, B>(ll: LazyList<A>, fn: (a: A) => B): LazyList<B> {
    return Lazy.of(() => {
      const evaluated = ll()
      if (evaluated === null) {
        return null
      } else {
        return {
          head: fn(evaluated.head),
          tail: LazyList.map(evaluated.tail, fn)
        }
      }
    })
  },

  filter<A, B>(ll: LazyList<A>, predicate: (a: A) => B | false): LazyList<B> {
    return Lazy.of(() => {
      const evaluated = ll()
      if (evaluated === null) {
        return null
      } else {
        const b = predicate(evaluated.head)
        if (b === false) {
          return LazyList.filter(evaluated.tail, predicate)()
        } else {
          return {
            head: b,
            tail: LazyList.filter(evaluated.tail, predicate)
          }
        }
      }
    })
  },

  flatMap<A, B>(ll: LazyList<A>, fn: (a: A) => LazyList<B>): LazyList<B> {
    return LazyList.flatten(LazyList.map(ll, fn))
  }
}
