import { AsyncResult } from './AsyncResult';
export declare class CacheItem<I, R> {
    readonly input: I;
    readonly asyncResult: AsyncResult<R>;
    readonly lifeTimeInMiliseconds: number;
    readonly forcedInvalid: boolean;
    constructor(input: I, asyncResult: AsyncResult<R>, lifeTimeInMiliseconds: number, forcedInvalid: boolean);
    forceInvalid(): CacheItem<I, R>;
    resultArrived(id: string, result: R, now: Date): CacheItem<I, R>;
    isValid(now: Date): boolean;
}
