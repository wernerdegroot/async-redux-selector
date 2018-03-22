import { CacheItem } from './CacheItem';
import { AsyncResult } from './AsyncResult';
export declare type Cache<I, R> = Array<CacheItem<I, R>>;
export declare function clear<I, R>(cache: Cache<I, R>): Cache<I, R>;
export declare function getAsyncResultIfValid<I, R>(cache: Cache<I, R>, eq: (left: I, right: I) => boolean, input: I, now: Date): AsyncResult<R> | undefined;
export declare function awaitingResult<I, R>(cache: Cache<I, R>, eq: (left: I, right: I) => boolean, lifeTimeInMiliseconds: number, requestId: string, input: I): Cache<I, R>;
export declare function resultArrived<I, R>(cache: Cache<I, R>, eq: (left: I, right: I) => boolean, id: string, input: I, result: R, now: Date): Cache<I, R>;
