import { Resource } from '../Resource'
import { GenericAction } from '../Action'
import { ADVICE } from '../AsyncResultOrAdvice'
import { assert, matchAwaitingResult, matchesAll, matchResultArrived } from './matchers'
import { bigLifetime, Input, inputEq, Result, someInput, someResourceId, someResult } from './data'
import { defer } from './IDeferred'

describe('Resource', () => {

  it('should produce an advice for requests that weren\'t made before', async () => {

    const deferred = defer<Result>()

    function runner(input: Input): Promise<Result> {
      if (inputEq(input, someInput)) {
        return deferred.promise
      } else {
        throw new Error('Should not happen!')
      }
    }

    const resource = new Resource<Input, Result, GenericAction>(someResourceId, runner, inputEq, bigLifetime, 2)

    const asyncResultOrAdvice = resource.selector([], someInput)

    const actions: GenericAction[] = []
    function dispatch(action: GenericAction): void {
      actions.push(action)
    }

    if (asyncResultOrAdvice.type === ADVICE) {

      // Initally empty:
      assert(actions).toMatch(matchesAll([]))

      // Start the request:
      asyncResultOrAdvice.followAdvice(dispatch)
      assert(actions).toMatch(matchesAll([
        matchAwaitingResult(someInput)
      ]))

      // Response received:
      await deferred.resolve(someResult)
      assert(actions).toMatch(matchesAll([
        matchAwaitingResult(someInput),
        matchResultArrived(someInput, someResult)
      ]))
    } else {
      fail('Expected an advice')
    }
  })
})