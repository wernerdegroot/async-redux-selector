import { addMilliseconds } from 'date-fns'
import { Resource } from '../Resource'
import { ResourceAction } from '../Action'
import { ADVICE } from '../AsyncResultOrAdvice'
// import { isAwaitingResultAction } from './matchers'

type Input = {
  inputValue: string
}

function inputEq(left: Input, right: Input): boolean {
  return left.inputValue === right.inputValue
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

  it('should produce an advice for requests that weren\'t made before', () => {

    let deferred: (result: Result) => void
    const promise = new Promise<Result>(resolve => {
      deferred = (result: Result) => {
        resolve(result)
      }
    })

    function runner(input: Input): Promise<Result> {
      if (input === someInput) {
        return promise
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
      asyncResultOrAdvice.advice.followAdvice(dispatch)
      expect(actions.length).toBe(1)
      // isAwaitingResultAction<Action, Input, Result>(actions[0], someInput, someResourceId)
    } else {
      fail()
    }
  })
})