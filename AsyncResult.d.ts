export declare const AWAITING_FIRST_RESULT = "AWAITING_FIRST_RESULT";
export declare const AWAITING_NEXT_RESULT = "AWAITING_NEXT_RESULT";
export declare const RESULT_ARRIVED = "RESULT_ARRIVED";
export declare class AwaitingFirstResult<R> {
    readonly id: string;
    readonly type: string;
    constructor(id: string);
    resultArrived(id: string, r: R, now: Date): AsyncResult<R>;
}
export declare class AwaitingNextResult<R> {
    readonly id: string;
    readonly previousResult: R;
    readonly type: string;
    constructor(id: string, previousResult: R);
    resultArrived(id: string, r: R, now: Date): AsyncResult<R>;
}
export declare class ResultArrived<R> {
    readonly id: string;
    readonly result: R;
    readonly when: Date;
    readonly type: string;
    constructor(id: string, result: R, when: Date);
    resultArrived(id: string, r: R, now: Date): AsyncResult<R>;
}
export declare type AsyncResult<R> = AwaitingFirstResult<R> | AwaitingNextResult<R> | ResultArrived<R>;
