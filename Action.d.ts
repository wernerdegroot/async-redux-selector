export interface GenericAction {
    type: string;
}
export declare const AWAITING_RESULT = "AWAITING_RESULT";
export interface IAwaitingResultAction<I> {
    type: typeof AWAITING_RESULT;
    resourceId: string;
    requestId: string;
    input: I;
    currentTime: Date;
}
export declare function awaitingResultAction<I>(resourceId: string, requestId: string, input: I, currentTime: Date): IAwaitingResultAction<I>;
export declare function isAwaitingResultAction<I>(action: GenericAction): action is IAwaitingResultAction<I>;
export declare const RESULT_ARRIVED = "RESULT_ARRIVED";
export interface IResultArrivedAction<I, R> {
    type: typeof RESULT_ARRIVED;
    resourceId: string;
    requestId: string;
    input: I;
    result: R;
}
export declare function resultArrivedAction<I, R>(resourceId: string, requestId: string, input: I, result: R): IResultArrivedAction<I, R>;
export declare type ResourceAction<I, R> = IAwaitingResultAction<I> | IResultArrivedAction<I, R>;
