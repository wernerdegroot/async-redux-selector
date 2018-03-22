export interface IDeferred<A> {
  resolve(a: A): Promise<void>
  promise: Promise<A>
}

export function defer<A>(): IDeferred<A> {

  let resolve: (a: A) => Promise<void> = () => Promise.resolve()
  const promise = new Promise<A>(resolver => {
    resolve = async (a: A) => {
      resolver(a)
      return promise.then(() => {})
    }
  })

  const deferred: IDeferred<A> = {
    resolve(a: A) {
      return resolve(a)
    },
    promise
  }

  return deferred
}

