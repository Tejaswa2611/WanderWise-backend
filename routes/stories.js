const express = require('express');
const router = express.Router();
const { 
  getAllStories, 
  createStory, 
  updateStory 
} = require('../controllers/stories');

router.get('/', getAllStories);
router.post('/', createStory);
router.put('/:id', updateStory);

module.exports = router;