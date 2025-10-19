import { analyzeSentimentKeyword } from '../services/sentiment';

describe('Sentiment Analysis', () => {
  describe('Keyword-based sentiment', () => {
    it('should classify positive sentiment', () => {
      const result = analyzeSentimentKeyword(
        'Bitcoin partnership announcement',
        'Major institutional investment approved'
      );
      expect(result.sentiment).toBe('Positive');
      expect(result.emoji).toBe('🐂');
      expect(result.score).toBeGreaterThan(0.65);
    });

    it('should classify negative sentiment', () => {
      const result = analyzeSentimentKeyword(
        'Crypto exchange hacked',
        'Vulnerability exploited, investigation launched'
      );
      expect(result.sentiment).toBe('Negative');
      expect(result.emoji).toBe('🐻');
      expect(result.score).toBeLessThan(0.35);
    });

    it('should classify neutral sentiment', () => {
      const result = analyzeSentimentKeyword(
        'Bitcoin price update',
        'Market data released for analysis'
      );
      expect(result.sentiment).toBe('Neutral');
      expect(result.emoji).toBe('⚪');
      expect(result.score).toBeCloseTo(0.5, 1);
    });

    it('should handle mixed sentiment (more positive)', () => {
      const result = analyzeSentimentKeyword(
        'SEC ban on cryptos but surge in adoption',
        'Investigation underway but record partnerships signed'
      );
      expect(result.sentiment).toBe('Positive');
    });

    it('should return score between 0 and 1', () => {
      const result = analyzeSentimentKeyword(
        'Crypto market moves',
        'Trading volumes increase'
      );
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });
});
