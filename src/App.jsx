import React, { useState, useEffect } from 'react';
import { Chart, CategoryScale, LinearScale, TimeScale, Tooltip, Legend } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import { Chart as ChartJS } from 'react-chartjs-2';
import axios from 'axios';

// Register Chart.js components required for candlestick charting
Chart.register(CandlestickController, CandlestickElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend);

function App() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [ticker, setTicker] = useState('');
  const [candles, setCandles] = useState([]);
  const [recommendation, setRecommendation] = useState('');

  // Fetch symbol suggestions when the search query changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = query.trim();
      if (q.length > 0) {
        try {
          const { data } = await axios.get(`/api/search?query=${encodeURIComponent(q)}`);
          setSuggestions(data);
        } catch (err) {
          console.error('Search error:', err);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch candlestick data and AI recommendation when a ticker is selected
  useEffect(() => {
    let intervalId;
    async function loadData() {
      if (!ticker) return;
      try {
        const candleResp = await axios.get(`/api/candles?ticker=${encodeURIComponent(ticker)}`);
        const candleData = candleResp.data.candles || [];
        setCandles(candleData);
        const closes = candleData.map(c => c.close).slice(-50);
        const recResp = await axios.post('/api/recommendation', {
          ticker,
          data: closes
        });
        setRecommendation(recResp.data.message || recResp.data.recommendation || '');
      } catch (err) {
        console.error('Data load error:', err);
      }
    }
    loadData();
    if (ticker) {
      // Refresh every minute
      intervalId = setInterval(loadData, 60000);
    }
    return () => clearInterval(intervalId);
  }, [ticker]);

  // Prepare data for Chart.js candlestick chart
  const chartData = {
    datasets: [
      {
        label: ticker || 'Selected Stock',
        data: candles.map(c => ({ x: new Date(c.time), o: c.open, h: c.high, l: c.low, c: c.close })),
        borderColor: 'rgba(33, 150, 243, 1)',
        color: {
          up: 'rgba(76, 175, 80, 1)',
          down: 'rgba(244, 67, 54, 1)',
          unchanged: 'rgba(158, 158, 158, 1)'
        }
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: true
      },
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute'
        },
        display: true
      },
      y: {
        display: true,
        beginAtZero: false
      }
    }
  };

  const handleSelect = (symbol) => {
    setTicker(symbol);
    setQuery('');
    setSuggestions([]);
  };

  return (
    <div className="container">
      <h1>AI Aktie Hjälp</h1>
      <div className="search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök aktie..."
        />
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((item) => (
              <li key={item.symbol} onClick={() => handleSelect(item.symbol)}>
                {item.symbol} - {item.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {ticker && (
        <div className="ticker-header">
          <h2>{ticker}</h2>
        </div>
      )}
      <div className="chart-wrapper">
        {candles.length > 0 ? (
          <ChartJS type="candlestick" data={chartData} options={options} />
        ) : (
          ticker && <p>Laddar data...</p>
        )}
      </div>
      {recommendation && (
        <div className="recommendation">
          <h3>AI-rekommendation:</h3>
          <p>{recommendation}</p>
        </div>
      )}
    </div>
  );
}

export default App;