export const AWAITING_RESPONSE = 'AWAITING_RESPONSE'
export type AwaitingResponse = Readonly<{
  type: 'AWAITING_RESULT'
}>

export const RESPONSE_RECEIVED = 'RESPONSE_RECEIVED'
export type ResponseReceived<Response> = Readonly<{
  type: 'RESULT_RECEIVED',
  response: Response
}>

export const ADVICE = 'ADVICE'
export type Advice<Action, State> = Readonly<{
  type: 'ADVICE'
  followAdvice(dispatch: (action: Action) => void, getState: () => State): Promise<void>
}>

export type AsyncResultCandidate<Response, Action, State>
  = AwaitingResponse
  | ResponseReceived<Response>
  | Advice<Action, State>