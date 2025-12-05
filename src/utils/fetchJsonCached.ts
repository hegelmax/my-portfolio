type CacheStore = {
  responses: Map<string, any>;
  inflight: Map<string, Promise<any>>;
};

// Keep cache on globalThis to survive StrictMode remounts and HMR reloads.
const globalStore: CacheStore = (() => {
  const root = globalThis as any;
  if (!root.__codexFetchCache) {
    root.__codexFetchCache = {
      responses: new Map<string, any>(),
      inflight: new Map<string, Promise<any>>(),
    };
  }
  return root.__codexFetchCache as CacheStore;
})();

const makeKey = (url: string, init?: RequestInit) =>
  `${(init?.method || "GET").toUpperCase()}:${url}`;

/**
 * Fetch JSON once per page life. Subsequent calls return the cached result.
 * Errors clear the cache entry so a later retry can happen.
 */
export async function fetchJsonCached<T = any>(url: string, init?: RequestInit): Promise<T> {
  const key = makeKey(url, init);

  if (globalStore.responses.has(key)) {
    return globalStore.responses.get(key) as T;
  }
  if (globalStore.inflight.has(key)) {
    return globalStore.inflight.get(key) as Promise<T>;
  }

  const promise = fetch(url+'?ts='+Date.now(), init)
    .then((resp) => {
      if (!resp.ok) {
        throw new Error(`Failed to load ${url}`);
      }
      return resp.json() as Promise<T>;
    })
    .then((data) => {
      globalStore.responses.set(key, data);
      globalStore.inflight.delete(key);
      return data;
    })
    .catch((err) => {
      globalStore.inflight.delete(key);
      throw err;
    });

  globalStore.inflight.set(key, promise);
  return promise;
}

/**
 * Fetch plain text once per page life (used for static HTML).
 */
export async function fetchTextCached(url: string, init?: RequestInit): Promise<string> {
  const key = makeKey(url, init);

  if (globalStore.responses.has(key)) {
    return globalStore.responses.get(key) as string;
  }
  if (globalStore.inflight.has(key)) {
    return globalStore.inflight.get(key) as Promise<string>;
  }

  const promise = fetch(url, init)
    .then((resp) => {
      if (!resp.ok) {
        throw new Error(`Failed to load ${url}`);
      }
      return resp.text();
    })
    .then((data) => {
      globalStore.responses.set(key, data);
      globalStore.inflight.delete(key);
      return data;
    })
    .catch((err) => {
      globalStore.inflight.delete(key);
      throw err;
    });

  globalStore.inflight.set(key, promise);
  return promise;
}
