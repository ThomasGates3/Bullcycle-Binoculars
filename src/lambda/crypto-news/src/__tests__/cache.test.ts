import { generateQueryKey } from '../services/cache';

describe('Cache Utilities', () => {
  describe('generateQueryKey', () => {
    it('should generate consistent hash for same input', () => {
      const key1 = generateQueryKey('query', 'en', 'business');
      const key2 = generateQueryKey('query', 'en', 'business');
      expect(key1).toBe(key2);
    });

    it('should generate different hash for different query', () => {
      const key1 = generateQueryKey('query1', 'en', 'business');
      const key2 = generateQueryKey('query2', 'en', 'business');
      expect(key1).not.toBe(key2);
    });

    it('should generate different hash for different language', () => {
      const key1 = generateQueryKey('query', 'en', 'business');
      const key2 = generateQueryKey('query', 'es', 'business');
      expect(key1).not.toBe(key2);
    });

    it('should generate 64-character SHA256 hash', () => {
      const key = generateQueryKey('query', 'en', 'business');
      expect(key).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle special characters', () => {
      const key = generateQueryKey('query AND (test OR "phrase")', 'en', 'business');
      expect(key).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
