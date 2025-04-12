const Subscriber = require('../models/Subscriber');
const { sendWelcomeEmail, sendNewsletterEmail } = require('./emailService');
const { takeScreenshots } = require('./screenshotService');
const fs = require('fs');
const validator =require('validator')

exports.handleSubscription = async (email, fullName) => {
  if(!validator.isEmail(email))
    throw new Error('Providea valid email')
  const existingSubscriber = await Subscriber.findOne({ email });
  if (existingSubscriber) {
    throw new Error('This email is already subscribed');
  }
  
  const newSubscriber = await Subscriber.create({ email, fullName });
  await sendWelcomeEmail(email, fullName);
  console.log(`Welcome Email sent to ${fullName} `)
  return newSubscriber;
};


exports.sendScheduledEmails = async () => {
  try {
    const activeSubscribers = await Subscriber.find({});
    
    if (activeSubscribers.length === 0) {
      console.log('No active subscribers found');
      return { success: true, count: 0 };
    }

    // 1. Verify screenshot generation
    let screenshotPaths;
    try {
      screenshotPaths = await takeScreenshots();
      console.log('Screenshots taken successfully:', screenshotPaths);
      
      // Verify screenshots exist
      screenshotPaths.forEach(path => {
        if (!fs.existsSync(path)) {
          throw new Error(`Screenshot not found at ${path}`);
        }
      });
    } catch (screenshotError) {
      console.error('Failed to generate screenshots:', screenshotError);
      return {
        success: false,
        error: 'Failed to generate screenshots',
        details: screenshotError.message
      };
    }

    // 2. Send emails with attachments
    const results = await Promise.allSettled(
      activeSubscribers.map(async (subscriber) => {
        try {
          await sendNewsletterEmail(
            subscriber.email, 
            subscriber.fullName, 
            screenshotPaths
          );
          return { success: true, email: subscriber.email };
        } catch (error) {
          console.error(`Failed to send to ${subscriber.email}:`, error);
          return { 
            success: false, 
            email: subscriber.email, 
            error: error.message 
          };
        }
      })
    );

    // 3. Clean up screenshots
    try {
      screenshotPaths.forEach(path => {
        if (fs.existsSync(path)) {
          fs.promises.unlink(path);
        }
      });
      console.log('Temporary screenshot files removed');
    } catch (cleanupError) {
      console.error('Error cleaning up screenshots:', cleanupError);
    }

    // 4. Analyze results
    const successfulSends = results.filter(r => r.value?.success).length;
    const failedSends = results.filter(r => !r.value?.success);
    
    console.log(`Newsletter sent to ${successfulSends}/${activeSubscribers.length} subscribers`);
    
    if (failedSends.length > 0) {
      console.error('Failed sends:', failedSends.map(f => ({
        email: f.value.email,
        error: f.value.error
      })));
    }
    
    return { 
      success: successfulSends > 0,
      count: successfulSends,
      total: activeSubscribers.length,
      failures: failedSends.length,
      details: results.map(r => r.value) 
    };
  } catch (error) {
    console.error('Critical error in sendScheduledEmails:', error);
    return {
      success: false,
      error: 'Critical error',
      details: error.message
    };
  }
};