export interface IDeferred<A> {
    resolve(a: A): Promise<void>;
    promise: Promise<A>;
}
export declare function defer<A>(): IDeferred<A>;
