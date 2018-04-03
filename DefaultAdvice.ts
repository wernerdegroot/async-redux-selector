import { ADVICE, Advice } from "./AsyncResultCandidate";
import { ResourceAction, awaitingResultAction, resultArrivedAction } from "./Action";
import { CacheDefinition } from "./CacheDefinition";
import { CacheItem } from "./CacheItem";

export class DefaultAdvice<Input, Key, Result, State> implements Advice<ResourceAction<Key, Result>, State> {
  readonly type: 'ADVICE' = ADVICE

  constructor(
    private readonly getPromise: (getState: () => State) => Promise<Result>,
    private readonly cacheDefinition: CacheDefinition<Input, Key, Result, State>,
    private readonly key: Key,
    private readonly requestId: string) {
  }

  followAdvice = (dispatch: (action: ResourceAction<Key, Result>) => void, getState: () => State): Promise<void> => {
    const cacheItems = this.cacheDefinition.cacheItemsSelector(getState())
    if (CacheItem.hasResponse(cacheItems, this.cacheDefinition.keysAreEqual, this.key, this.cacheDefinition.validityInMiliseconds, new Date())) {
      dispatch(awaitingResultAction(this.cacheDefinition.cacheId, this.requestId, this.key, new Date()))
      return this.getPromise(getState).then(result => {
        dispatch(resultArrivedAction(this.cacheDefinition.cacheId, this.requestId, this.key, result, new Date()))
      })
    } else {
      return Promise.resolve()
    }
  }
}