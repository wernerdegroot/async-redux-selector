import { CacheDefinition } from '../CacheDefinition'
import { GenericAction } from '../Action'
import { ADVICE } from '../AsyncResultOrAdvice'
import { assert, matchAwaitingResult, matchesAll, matchResultArrived } from './matchers'
import { bigLifetime, Input, Result, someInput, someCacheId, someResult, State } from './data'
import { defer } from './IDeferred'
import { CacheItems } from '../CacheItems'
import { AsyncResult } from '../AsyncResult'

describe('CacheDefinition', () => {

  it('should produce an advice for requests that weren\'t made before', async () => {

    const state: State = { cacheItems: [] }

    const deferred = defer<Result>()

    function cacheItemsSelector(state: State): CacheItems<string, AsyncResult<Result>> {
      return state.cacheItems
    }

    function inputToKey(input: Input): string {
      return input.key
    }

    const cacheDefinition = new CacheDefinition<Input, string, Result, State>(
      someCacheId,
      cacheItemsSelector,
      inputToKey,
      (left: string, right: string) => left === right,
      bigLifetime,
      2
    )

    const asyncResultOrAdvice = cacheDefinition.selector(state).getFor(someInput).orElse(() => deferred.promise)

    const actions: GenericAction[] = []
    function dispatch(action: GenericAction): void {
      actions.push(action)
    }

    if (asyncResultOrAdvice.type === ADVICE) {

      // Initally empty:
      assert(actions).toMatch(matchesAll([]))

      // Start the request:
      asyncResultOrAdvice.followAdvice(dispatch, () => state)
      assert(actions).toMatch(matchesAll([
        matchAwaitingResult(someInput.key)
      ]))

      // Response received:
      await deferred.resolve(someResult)
      assert(actions).toMatch(matchesAll([
        matchAwaitingResult(someInput.key),
        matchResultArrived(someInput.key, someResult)
      ]))
    } else {
      fail('Expected an advice')
    }
  })
})