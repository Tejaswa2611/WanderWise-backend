const express = require('express');
const router = express.Router();
const { convertCurrency, getTopFiveRates ,getTopFiatCurrencies,getAllCurrencies} = require('../controllers/currencyController');

router.get('/convert', convertCurrency);
router.get('/top5', getTopFiveRates);
router.get('/top10fiat', getTopFiatCurrencies);
router.get('/all', getAllCurrencies);


module.exports = router;
