import axios from 'axios';

export default async function handler(req, res) {
  const { query = '' } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5&newsCount=0`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const quotes = response.data.quotes || [];
    const results = quotes.map((q) => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol
    }));
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}