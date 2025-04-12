const Subscriber = require('../models/Subscriber');
const NewsletterLog = require('../models/NewsletterLog');
const { takeScreenshot } = require('../services/screenshotService');
const { sendNewsletter } = require('../services/emailService');

const sendNewsletterToAll = async () => {
  try {
    // Take screenshot
    const screenshotPath = await takeScreenshot();
    
    
    
    // Get all active subscribers
    const subscribers = await Subscriber.find({ isActive: true });
    
    // Send email to each subscriber
    const sendPromises = subscribers.map(subscriber => 
      sendNewsletter(subscriber.email, screenshotPath)
    );
    
    const results = await Promise.all(sendPromises);
    const successfulSends = results.filter(Boolean).length;
    
    // Log the newsletter send
    await NewsletterLog.create({
      recipientsCount: successfulSends,
      screenshotPath,
    });
    
    console.log(`Newsletter sent to ${successfulSends} subscribers`);
    return { success: true, count: successfulSends };
  } catch (error) {
    console.error('Error in newsletter sending:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendNewsletterToAll };