import { addMilliseconds } from 'date-fns'
import { Resource } from '../Resource'
import { isAwaitingResultAction, ResourceAction } from '../Action'
import { ADVICE } from '../AsyncResultOrAdvice'
import { assert, isAwaitingResult, matchesAll } from './matchers'
import { inputEq } from './data'
import { defer } from './IDeferred'
// import { isAwaitingResultAction } from './matchers'

type Input = {
  inputValue: string
}

const someInput: Input = {
  inputValue: 'some-input'
}

const someOtherInput: Input = {
  inputValue: 'some-other-input'
}

type Result = {
  resultValue: number
}

const someResult: Result = {
  resultValue: 4
}

const someId = 'some-requestId'
const someOtherId = 'some-other-requestId'

const someResourceId = 'some-resource-id'

const now = new Date(2018, 3, 8, 2, 4, 1)
const smallLifetime = 2 * 60 * 1000
const bigLifetime = 6 * 60 * 1000
const later = addMilliseconds(now, (smallLifetime + bigLifetime) / 2)

type Action = ResourceAction<any, any> | { type: 'MY_ACTION' }

describe('Resource', () => {

  it('should produce an advice for requests that weren\'t made before', async () => {

    const deferred = defer<Result>()

    function runner(input: Input): Promise<Result> {
      if (input === someInput) {
        return deferred.promise
      } else {
        throw new Error('Should not happen!')
      }
    }

    const resource = new Resource<Input, Result, Action>(someResourceId, runner, inputEq, bigLifetime)

    const asyncResultOrAdvice = resource.selector([], someInput)

    const actions: Action[] = []
    function dispatch(action: Action): void {
      actions.push(action)
    }

    if (asyncResultOrAdvice.type === ADVICE) {
      assert(actions).toMatch(matchesAll([]))
      asyncResultOrAdvice.advice.followAdvice(dispatch)
      assert(actions).toMatch(matchesAll([
        isAwaitingResult(someInput)
      ]))

      await deferred.resolve(someResult)

      assert(actions).toMatch(matchesAll([
        isAwaitingResult(someInput)
      ]))
    } else {
      fail('Expected an advice')
    }
  })
})