export type Input = {
  inputValue: string
}

export function inputEq(left: Input, right: Input): boolean {
  return left.inputValue === right.inputValue
}
