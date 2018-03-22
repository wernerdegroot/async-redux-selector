import { AsyncResultOrAdvice } from './AsyncResultOrAdvice';
import { CacheItem } from './CacheItem';
import { IAwaitingResultAction, IResultArrivedAction } from './Action';
import { ResourceAction } from './Action';
export declare class Resource<I, R, Action extends {
    type: string;
}> {
    private readonly resourceId;
    private readonly runner;
    private readonly inputEq;
    private readonly validityInMiliseconds;
    constructor(resourceId: string, runner: (input: I) => Promise<R>, inputEq: (left: I, right: I) => boolean, validityInMiliseconds?: number);
    selector: (cache: CacheItem<I, R>[], input: I) => AsyncResultOrAdvice<R, ResourceAction<I, R>>;
    reducer: (cache: CacheItem<I, R>[], action: (Action & IAwaitingResultAction<I>) | (Action & IResultArrivedAction<I, R>)) => CacheItem<I, R>[];
    private getAdvice(input, now);
}
