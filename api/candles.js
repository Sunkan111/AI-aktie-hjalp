import axios from 'axios';

export default async function handler(req, res) {
  const { ticker = '' } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker parameter is required' });
  }
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=5m`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const result = response.data.chart && response.data.chart.result && response.data.chart.result[0];
    if (!result) {
      return res.status(500).json({ error: 'No data returned' });
    }
    const timestamps = result.timestamp || [];
    const quote = (result.indicators && result.indicators.quote && result.indicators.quote[0]) || {};
    const candles = [];
    for (let i = 0; i < timestamps.length; i++) {
      const o = quote.open ? quote.open[i] : undefined;
      const h = quote.high ? quote.high[i] : undefined;
      const l = quote.low ? quote.low[i] : undefined;
      const c = quote.close ? quote.close[i] : undefined;
      if (o != null && h != null && l != null && c != null) {
        candles.push({
          time: timestamps[i] * 1000,
          open: o,
          high: h,
          low: l,
          close: c
        });
      }
    }
    return res.status(200).json({ candles });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}