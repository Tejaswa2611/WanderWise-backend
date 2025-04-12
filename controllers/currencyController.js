const axios = require('axios');

const BASE_URL = process.env.CURRENCY_API_URL;
const API_KEY = process.env.CURRENCY_API_KEY;

exports.convertCurrency = async (req, res) => {
  const { amount, to } = req.query;

  if (!amount || !to) {
    return res.status(400).json({ message: "Missing 'amount' or 'to' currency code in query" });
  }

  try {
    const response = await axios.get(`${BASE_URL}?apikey=${API_KEY}`);
    const rate = response.data.rates[to.toUpperCase()];

    if (!rate) {
      return res.status(404).json({ message: `Currency code '${to}' not found.` });
    }

    const result = (parseFloat(amount) * parseFloat(rate)).toFixed(2);

    res.json({
      base: response.data.base,
      target: to.toUpperCase(),
      rate,
      amount,
      result
    });

  } catch (error) {
    console.error("Conversion error:", error.message);
    res.status(500).json({ message: "Currency conversion failed" });
  }
};

exports.getTopFiveRates = async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}?apikey=${API_KEY}`);
    const rates = response.data.rates;

    const top5 = Object.entries(rates)
      .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]))
      .slice(0, 5);

    res.json({
      base: response.data.base,
      top5: top5.map(([code, rate]) => ({ code, rate }))
    });

  } catch (error) {
    console.error("Top 5 rates fetch error:", error.message);
    res.status(500).json({ message: "Fetching top 5 failed" });
  } 
};

exports.getTopFiatCurrencies = async (req, res) => {
    try {
      const response = await axios.get(`${BASE_URL}?apikey=${API_KEY}`);
      const rates = response.data.rates;
  
      // Top common fiat currencies globally
      const topFiatCodes = ["EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "CNY", "HKD", "NZD", "SGD"];
  
      const topFiatRates = {};
      topFiatCodes.forEach((code) => {
        if (rates[code]) {
          topFiatRates[code] = rates[code];
        }
      });
  
      res.json({
        base: response.data.base,
        rates: topFiatRates,
      });
    } catch (error) {
      console.error("Fiat Rate Fetch Error:", error.message);
      res.status(500).json({ message: "Failed to fetch fiat exchange rates." });
    }
  };

  exports.getAllCurrencies = async (req, res) => {
    try {
      const response = await axios.get(`${BASE_URL}?apikey=${API_KEY}`);
      const rates = response.data.rates;
  
      res.json({
        base: response.data.base,  // Should be "USD"
        rates: rates               // All currency codes with their rates
      });
  
    } catch (error) {
      console.error("All Currencies Fetch Error:", error.message);
      res.status(500).json({ message: "Failed to fetch all currencies." });
    }
  };
