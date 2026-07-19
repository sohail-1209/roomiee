// Zero-dependency, lightweight in-memory cache utility
const cache = new Map();

/**
 * Get item from cache
 * @param {string} key 
 * @returns {any|null}
 */
const get = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }
  return cached.value;
};

/**
 * Set item in cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 
 */
const set = (key, value, ttlSeconds = 30) => {
  cache.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });
};

/**
 * Clear the entire cache
 */
const clear = () => {
  cache.clear();
};

module.exports = { get, set, clear };
