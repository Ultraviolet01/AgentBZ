/**
 * Live Crypto News Service — AgentBazaar LaunchWatch
 *
 * Uses 100% free keyless RSS-to-JSON feeds from CoinTelegraph & Decrypt
 * to deliver real-time crypto news digests.
 */

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  author?: string;
  description?: string;
  source: string;
}

export class NewsService {
  private static RSS_SOURCES = [
    { name: 'CoinTelegraph', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss' },
    { name: 'Decrypt', url: 'https://api.rss2json.com/v1/api.json?rss_url=https://decrypt.co/feed' }
  ];

  /**
   * Fetches latest live crypto news matching topics or project keywords.
   */
  static async getLatestNews(queryOrTopic?: string): Promise<NewsArticle[]> {
    console.log(`[NewsService] Fetching live crypto news (filter: ${queryOrTopic || 'general'})...`);
    const allArticles: NewsArticle[] = [];

    for (const source of this.RSS_SOURCES) {
      try {
        const res = await fetch(source.url, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(6000)
        });

        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];

          for (const item of items) {
            allArticles.push({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              author: item.author || source.name,
              description: (item.description || '').replace(/<[^>]*>?/gm, '').substring(0, 180) + '...',
              source: source.name
            });
          }
        }
      } catch (err: any) {
        console.warn(`[NewsService] Failed to fetch news from ${source.name}: ${err.message}`);
      }
    }

    if (!queryOrTopic) return allArticles.slice(0, 5);

    const term = queryOrTopic.toLowerCase();
    const filtered = allArticles.filter(art =>
      art.title.toLowerCase().includes(term) ||
      (art.description && art.description.toLowerCase().includes(term))
    );

    return filtered.length > 0 ? filtered.slice(0, 5) : allArticles.slice(0, 3);
  }
}
