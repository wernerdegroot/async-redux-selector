export interface IAdvice<Action> {
  followAdvice(dispatch: (action: Action) => void): void
}
