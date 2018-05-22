export function addSeconds(date: Date, seconds: number): Date {
  return addMilliseconds(date, seconds * 1000)
}

export function addMilliseconds(date: Date, milliseconds: number): Date {
  return new Date(date.valueOf() + milliseconds)
}

export function flatten<A>(as: A[][]): A[] {
  return as.reduce((acc: A[], curr: A[]) => [...acc, ...curr], [])
}

