const cron = require('cron');
const { sendScheduledEmails } = require('../services/newsletterService');

// Run every friday 8 am
const newsletterJob = new cron.CronJob('0 8 * * 5', async () => {
  console.log('Running newsletter job...');
  try {
    const result = await sendScheduledEmails();
   console.log(`Sent emails to ${result?.count||'all'} subscribers`);
  } catch (error) {
    console.error('Error in newsletter job:', error.message);
  }
});

module.exports = newsletterJob;