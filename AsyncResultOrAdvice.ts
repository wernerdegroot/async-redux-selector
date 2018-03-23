import { AsyncResult } from './AsyncResult'

export const ADVICE = 'ADVICE'

export interface IHasAdvice<Action> {
  type: typeof ADVICE
  followAdvice(dispatch: (action: Action) => void): void
}

export type AsyncResultOrAdvice<R, Action> = AsyncResult<R> | IHasAdvice<Action>