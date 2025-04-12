// const { signupValidation,loginValidation } = require('../middlewares/AuthValidation');
const User=require("../models/User");
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const qrCode = require('qrcode');

const {
    signup,
    login,
    updateUserProfile,
    logout,
    authStatus,
    setup2FA,
    verify2FA,
    reset2FA
}=require('../controllers/authcontroller.js');
const ensureAuthenticated =require("../middlewares/Auth")
const passport=require('passport');
const router = require('express').Router();


//router.post('/login',loginValidation,login);
router.post('/login',passport.authenticate("local"),login);

router.post('/signup',signup);
router.get('/status',authStatus); //Auth status

//logout 

router.post('/logout',logout);
//2FA setup

router.post('/2fa/setup',(req,res,next)=>{
    if(req.isAuthenticated()) return next();
    res.status(401).json({message:"Unauthorized"});
},setup2FA);

//verify 2FA route

router.post('/2fa/verify',(req,res,next)=>{
    if(req.isAuthenticated()) return next();
    res.status(401).json({message:"Unauthorized"});
},verify2FA);

//reset 2fa route

router.post('/2fa/reset',(req,res,next)=>{
    if(req.isAuthenticated()) return next();
    res.status(401).json({message:"Unauthorized"});
},reset2FA);

// routes/authRoutes.js

router.get("/profile", (req, res) => {

  console.log("Request user "+req.user);
  
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
  
    res.json({
      username: req.user.username,
      email: req.user.email,
      preferences: req.user.preferences, // optional
      // add other fields if needed
    });
  });
  
  router.post('/2fa/setup-dev', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Setup 2FA
        const secret = speakeasy.generateSecret();
        user.twoFactorSecret = secret.base32;
        user.isMfaActive = true;
        await user.save();

        const otpAuthUrl = speakeasy.otpauthURL({
            secret: secret.base32,
            label: `${user.username}`,
            issuer: "www.supriyavia.com",
            encoding: "base32"
        });

        const qrCodeImageUrl = await qrCode.toDataURL(otpAuthUrl);

        res.status(200).json({
            message: "2FA setup complete",
            secret: secret.base32,
            qrCode: qrCodeImageUrl
        });

    } catch (err) {
        console.error("Error in /2fa/setup-dev:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

// router.route('/users/profile').post(ensureAuthenticated,updateUserProfile);
router.put('/profile', ensureAuthenticated,updateUserProfile);


module.exports=router;