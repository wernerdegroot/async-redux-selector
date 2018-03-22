import { IAdvice } from './IAdvice';
import { AsyncResult } from './AsyncResult';
export declare const ADVICE = "ADVICE";
export declare class HasAdvice<Action> {
    readonly advice: IAdvice<Action>;
    readonly type: string;
    constructor(advice: IAdvice<Action>);
}
export declare type AsyncResultOrAdvice<R, Action> = AsyncResult<R> | HasAdvice<Action>;
