export declare const AWAITING_FIRST_RESULT = "AWAITING_FIRST_RESULT";
export declare const AWAITING_NEXT_RESULT = "AWAITING_NEXT_RESULT";
export declare const RESULT_ARRIVED = "RESULT_ARRIVED";
export declare class AwaitingFirstResult<R> {
    readonly requestId: string;
    readonly type: string;
    constructor(requestId: string);
    resultArrived(id: string, r: R, now: Date): AsyncResult<R>;
}
export declare class AwaitingNextResult<R> {
    readonly requestId: string;
    readonly previousResult: R;
    readonly type: string;
    constructor(requestId: string, previousResult: R);
    resultArrived(id: string, r: R, now: Date): AsyncResult<R>;
}
export declare class ResultArrived<R> {
    readonly result: R;
    readonly when: Date;
    readonly type: string;
    constructor(result: R, when: Date);
    resultArrived(id: string, r: R, now: Date): AsyncResult<R>;
}
export declare type AsyncResult<R> = AwaitingFirstResult<R> | AwaitingNextResult<R> | ResultArrived<R>;
