import { Resource } from '../Resource'
import { GenericAction } from '../Action'
import { ADVICE } from '../AsyncResultOrAdvice'
import { assert, matchAwaitingResult, matchesAll, matchResultArrived } from './matchers'
import { bigLifetime, Input, Result, someInput, someResourceId, someResult, State } from './data'
import { defer } from './IDeferred'
import { Cache } from '../Cache'

describe('Resource', () => {

  it('should produce an advice for requests that weren\'t made before', async () => {

    const state: State = { cache: [] }

    const deferred = defer<Result>()

    function runner(input: Input): Promise<Result> {
      if (input === someInput) {
        return deferred.promise
      } else {
        throw new Error('Should not happen!')
      }
    }

    function cacheSelector(state: State): Cache<string, Result> {
      return state.cache
    }

    function inputToKey(input: Input): string {
      return input.key
    }

    const resource = new Resource<Input, string, Result, GenericAction, State>(
      someResourceId,
      runner,
      inputToKey,
      cacheSelector,
      (left: string, right: string) => left === right,
      bigLifetime,
      2
    )

    const asyncResultOrAdvice = resource.selector([], someInput)

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