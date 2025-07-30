/**
 * Caching module for MathML processing performance optimization
 * Implements LRU (Least Recently Used) cache for frequently processed MathML patterns
 */

class MathMLCache {
    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
        this.cache = new Map();
        this.accessOrder = [];
        this.hitCount = 0;
        this.missCount = 0;
    }

    /**
     * Generate a cache key from MathML content and processing parameters
     * @param {string} mathML - The MathML content
     * @param {Object} alixThresholds - ALIX threshold parameters
     * @returns {string} Cache key
     */
    generateKey(mathML, alixThresholds) {
        // Create a deterministic key from MathML content and thresholds
        const normalizedMathML = this.normalizeMathML(mathML);
        const thresholdString = JSON.stringify(alixThresholds);
        return `${normalizedMathML}|${thresholdString}`;
    }

    /**
     * Normalize MathML content for consistent caching
     * Removes whitespace and normalizes namespace declarations
     * @param {string} mathML - The MathML content
     * @returns {string} Normalized MathML
     */
    normalizeMathML(mathML) {
        let normalized = mathML
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/>\s+</g, '><') // Remove whitespace between tags
            .trim()
            .replace(/<m:/g, '<') // Convert old namespace to new (do this first)
            .replace(/<\/m:/g, '</') // Convert old namespace to new (do this first)
            .replace(/xmlns:m="[^"]*"/g, '') // Remove old namespace declarations
            .replace(/xmlns="[^"]*"/g, '') // Remove any existing xmlns
        ;
        // Add the standard namespace if it's not present
        if (!normalized.includes('xmlns=')) {
            normalized = normalized.replace('<math', '<math xmlns="http://www.w3.org/1998/Math/MathML"');
        }
        // Remove any extra spaces before >
        normalized = normalized.replace(/\s*>/g, '>');
        return normalized;
    }

    /**
     * Get cached result if available
     * @param {string} key - Cache key
     * @returns {Object|null} Cached result or null if not found
     */
    get(key) {
        if (this.cache.has(key)) {
            // Update access order
            const index = this.accessOrder.indexOf(key);
            if (index > -1) {
                this.accessOrder.splice(index, 1);
            }
            this.accessOrder.push(key);
            return this.cache.get(key);
        }
        return null;
    }

    /**
     * Store result in cache
     * @param {string} key - Cache key
     * @param {Object} result - Result to cache
     */
    set(key, result) {
        // Remove oldest entry if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.accessOrder.shift();
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        // Add new entry
        this.cache.set(key, result);
        this.accessOrder.push(key);
    }

    /**
     * Clear the cache
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
        this.hitCount = 0;
        this.missCount = 0;
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        const totalRequests = this.hitCount + this.missCount;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
            hitCount: this.hitCount,
            missCount: this.missCount,
            totalRequests: totalRequests
        };
    }

    /**
     * Track cache hit/miss for statistics
     * @param {boolean} isHit - Whether this was a cache hit
     */
    trackAccess(isHit) {
        if (isHit) {
            this.hitCount++;
        } else {
            this.missCount++;
        }
    }
}

// Create singleton instance
const mathMLCache = new MathMLCache();

module.exports = {
    MathMLCache,
    mathMLCache
};