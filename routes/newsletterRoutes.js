// newsletterRoutes.js
const express = require('express');
const router = express.Router();
const { sendNewsletterToAll } = require('../controllers/newsletterController');

router.post('/send', sendNewsletterToAll);

module.exports = router;