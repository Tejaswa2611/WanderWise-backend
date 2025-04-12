const express = require('express');
const { handleGenerateContent, analyzeAccessibility } = require('../controllers/geminiController');

const router = express.Router();

router.post('/generate', handleGenerateContent); 
router.post('/analyze-image', analyzeAccessibility);

module.exports = router;
