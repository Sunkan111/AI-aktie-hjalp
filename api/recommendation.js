import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }
  const { ticker, data } = req.body || {};
  if (!ticker || !data) {
    return res.status(400).json({ error: 'Missing ticker or data' });
  }
  // Use environment variable if defined, otherwise fall back to provided key
  // Only use the API key provided via environment variables. Do not hard-code secrets in source code.
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key is missing. Please configure OPENAI_API_KEY as an environment variable.' });
  }
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful stock trading assistant. Based on recent closing prices, provide clear BUY, SELL, or HOLD suggestions with a brief explanation.'
        },
        {
          role: 'user',
          content: `The recent closing prices for ${ticker} are: ${data.join(', ')}. Based on this information, should I buy, sell, or hold? Provide your recommendation and brief reasoning.`
        }
      ],
      temperature: 0.3,
      max_tokens: 60
    }, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const message = response.data.choices?.[0]?.message?.content?.trim();
    return res.status(200).json({ message });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}