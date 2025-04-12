const { 
    handleSubscription,
    sendScheduledEmails
  } = require('../services/newsletterService');
  
  const subscribe = async (req, res) => {
    try {
      const { email, fullName } = req.body;
      const newSubscriber = await handleSubscription(email, fullName);
      
      res.status(201).json({ 
        success: true, 
        message: 'Subscription successful', 
        data: newSubscriber 
      });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  };
  
 
  const sendNewsletter = async (req, res) => {
    try {
      const result = await sendScheduledEmails();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  };
  
  module.exports = { 
    subscribe, 
    sendNewsletter
  };