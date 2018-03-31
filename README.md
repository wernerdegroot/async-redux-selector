# async-redux-selector

### Requirements

* [Thunk middleware](https://github.com/gaearon/redux-thunk)

### Features

* Typescript supported

## Introduction

### Example

Suppose we have a web application in which the user can search for pets based on some filter. We want to:

* fetch the pets that match this filter from the server whenever the filter changes,
* display a loader while fetching

In applications we were used to building this looks like this:

![https://yuml.me/401a85e4.png](https://yuml.me/401a85e4.png)

```
(start)->(Change filter)
(Change filter)->(Dispatch update filter action)
(Change filter)->(Fetch pets)
(Fetch pets)->(Dispatch start loading action)
(Fetch pets)->[...]
[...]->(Dispatch set pets action)
[...]->(Dispatch done loading action)
```

This libary changes this pattern by asking: "How would we solve this if we had _all_ pets already available in the Redux store?" Easy! We would use [selectors](https://redux.js.org/recipes/computing-derived-data):

```javascript
const petsThatMatchFilterSelector = createSelector(
  filterSelector,
  petsSelector,
  (filter, pets) => {
    return pets.filter(pet => pet.type === filter.petType)
  }
)
```

Of course, we don't have _all_ pets available in the Redux store, but the solution doesn't need to be much different if we don't:

```javascript
const asyncPetsThatMatchFilterSelector = createSelector(
  filterSelector,
  petsCacheSelector,
  (filter, petsCache) => {
    return petsCache
      .getFor(filter)
      .orElse(() => fetch(`/api/pets?type=${filter.petType}`))
  }
)
```

Here, `fetch` is a function that returns a `Promise`.

Instead of filtering the pets locally, we let the server take care of that.

The body of the selector may be executed many times. To prevent making the same request multiple times we use a cache of pets. How the cache gets its values is something we will discuss shortly. For now, let's focus on what `asyncPetsThatMatchFilterSelector` returns.

### Asynchronous results
Instead of getting a list of pets _right now_, we have to wait for the server to respond with the pets. We can get:

1. an object with property `type` equal to `'AWAITING_RESULT'`, which indicates that the request was made but no response was received yet,
1. an object with property `type` equal to `'RESULT_ARRIVED'`, which indicates that the response was received (this object contains the response under the property `result`),
1. an object with property `type` equal to `'ERROR_OCURRED'`, which indicates that the request failed,
1. an object with property `type` equal to `'ADVICE'` which indicates that no request was made yet.

It's important to note that the library doesn't make any requests on its own! It will only advise you to do so (hence the type `'ADVICE'`). It's up to you to follow the advice (and make the request), or not.

You follow a request by dispatching:

```javascript
const asyncPets = asyncPetsThatMatchFilterSelector(appState)
if (asyncPets.type === 'ADVICE') {
  dispatch(asyncPets.followAdvice)
}
```

### Cache

Now is the time to discuss how the cache gets its values. The answer will probably not surprise you.

By following advices, actions are dispatched that update the pets cache so that next time you apply the asynchronous selector, you will (hopefully) get an arrived result.

### Finishing up

So far, we have neglected to specify a couple of things:

* We need to make the cache part of the store:
    
    ```javascript
    const reducer = combineReducers({
      ...
      petsCache: PetsCache.reducer,
      ...
    })
    ```
    
* We didn't define `petsCacheSelector`:

    ```javascript
    const petsCacheSelector = PetsCache.selector
    ```

Both cases require a _cache definition_ with the name `PetsCache`, which is given below. Fortunately, creating a cache definition doesn't require a whole lot of configuration.

```javascript
const PetsCache = Cache({
  cacheId: 'pets',
  inputsAreEqual: (filter1, filter2) => filter1.petType === filter2.petType,
  cacheSelector: appState => appState.petsCache
})
```

We basically need three things:

1. a unique `cacheId` to identify the pets cache among all the other possible caches in the store,
2. a way to check if two filters are the same (to prevent making the same request multiple times),
3. the location of the cache in the store.

If we want, we can further specify:

4. The maximum number of responses cached,
5. The time that a response remains valid,
6. The key under which a response is stored in the cache (to make searching the cache faster).

# TODO

* Tests for `map` and `flatMap`
* Store `lastUpdated` as number instead of `Date`.
* Flatten `CacheDefinition.selector`
* Rename `cacheSelector` to `cacheItemsSelector` (on the input side).
* Add actions for clearing the cache, and removing one item.
