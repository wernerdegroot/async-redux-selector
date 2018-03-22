import { GenericAction } from '../Action';
import { Input } from './data';
export declare type IMatcher<A> = (a: A) => true | string;
export declare function assert<A>(a: A): {
    toMatch(matcher: IMatcher<A>): void;
};
export declare const matchesAll: <A>(matchers: IMatcher<A>[]) => IMatcher<A[]>;
export declare const isAwaitingResult: (input: Input) => IMatcher<GenericAction>;
