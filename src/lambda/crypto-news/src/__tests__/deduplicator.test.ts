import { deduplicateArticles } from '../services/deduplicator';

describe('Article Deduplication', () => {
  it('should remove exact duplicate URLs', () => {
    const articles = [
      { title: 'Article 1', url: 'https://example.com/news/1' },
      { title: 'Article 1 copy', url: 'https://example.com/news/1' },
      { title: 'Article 2', url: 'https://example.com/news/2' },
    ];

    const result = deduplicateArticles(articles);
    expect(result).toHaveLength(2);
    expect(result[0].url).toBe('https://example.com/news/1');
    expect(result[1].url).toBe('https://example.com/news/2');
  });

  it('should remove exact duplicate titles', () => {
    const articles = [
      { title: 'Bitcoin surges', url: 'https://example.com/1' },
      { title: 'bitcoin surges', url: 'https://example.com/2' }, // same title, different case
      { title: 'Ethereum drops', url: 'https://example.com/3' },
    ];

    const result = deduplicateArticles(articles);
    expect(result).toHaveLength(2);
  });

  it('should skip articles without URL', () => {
    const articles = [
      { title: 'Article 1', url: '' },
      { title: 'Article 2', url: null as any },
      { title: 'Article 3', url: 'https://example.com/3' },
    ];

    const result = deduplicateArticles(articles);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Article 3');
  });

  it('should preserve article properties', () => {
    const articles = [
      {
        title: 'Bitcoin News',
        url: 'https://coindesk.com/news',
        source_name: 'CoinDesk',
        pubDate: '2025-10-19T10:00:00Z',
        tickers: ['BTC'],
      },
    ];

    const result = deduplicateArticles(articles);
    expect(result[0].source_name).toBe('CoinDesk');
    expect(result[0].tickers).toEqual(['BTC']);
    expect(result[0].pubDate).toBe('2025-10-19T10:00:00Z');
  });

  it('should handle empty array', () => {
    const result = deduplicateArticles([]);
    expect(result).toEqual([]);
  });

  it('should preserve order', () => {
    const articles = [
      { title: 'First', url: 'https://example.com/1' },
      { title: 'Second', url: 'https://example.com/2' },
      { title: 'Third', url: 'https://example.com/3' },
    ];

    const result = deduplicateArticles(articles);
    expect(result[0].title).toBe('First');
    expect(result[1].title).toBe('Second');
    expect(result[2].title).toBe('Third');
  });
});
