import { IAdvice } from './IAdvice'
import { AsyncResult } from './AsyncResult'

export const ADVICE = 'ADVICE'

export class HasAdvice<Action> {
  public readonly type = ADVICE

  constructor(public readonly advice: IAdvice<Action>) {

  }
}

export type AsyncResultOrAdvice<R, Action> = AsyncResult<R> | HasAdvice<Action>