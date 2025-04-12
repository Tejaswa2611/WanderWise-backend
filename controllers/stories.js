const Story = require('../models/Story');

// Get all stories
exports.getAllStories = async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Create a new story
exports.createStory = async (req, res) => {
  try {

    console.log('I am here')
    const newStory = new Story(req.body);
    const story = await newStory.save();
    res.json(story);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update story (like/bookmark)
exports.updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    let update = {};
    if (action === 'like') {
      update = { $inc: { likes: 1 }, isLiked: true };
    } else if (action === 'unlike') {
      update = { $inc: { likes: -1 }, isLiked: false };
    } else if (action === 'bookmark') {
      update = { isBookmarked: true };
    } else if (action === 'unbookmark') {
      update = { isBookmarked: false };
    }
    
    const story = await Story.findByIdAndUpdate(id, update, { new: true });
    res.json(story);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};