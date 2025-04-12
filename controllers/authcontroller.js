const bcrypt =require('bcrypt');
const User=require("../models/User");
const jwt=require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrCode = require('qrcode');

const signup = async(req,res)=>{
    try{
        const {username,password,email}=req.body;
        const hashedPassword = await bcrypt.hash(password,10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            isMfaActive:false,
            
        });
        console.log("New User:", newUser);
        await newUser.save();
        res.status(201).json({message:"User registered successfully", success:true});
    }catch(error){
        res.status(500).json({
            error:"Error signup user", message: error
        })
    }
}

const login = async (req, res) => {
    const { username,email } = req.body; 
    const user = req.user;
    console.log("the authenticated user is:", req.user);
    res.status(200).json({
        message:"user logged in successfully",
        username: req.user.username,
        isMfaActive: req.user.isMfaActive,
        email,
        avatar: user.avatar || "https://i.pravatar.cc/150", // ✅ Default avatar if not provided
        user: {  
                id: user._id,
                username: user.username,
                email: user.email,
                phone_no: user.phone_no,
                avatar: user.avatar || "https://i.pravatar.cc/150", // ✅ Ensure avatar is included
                role: user.role || "user", // ✅ If role exists
            }
    });
};


const updateUserProfile = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log("Incoming Profile Update Request:", req.body);

        const user = await User.findById(req.user._id);
        if (!user) {

            console.log("User not found in DB");
            return res.status(403).json({ message: errorMsg, success: false });
        }
        

        // Check if email is being updated and already exists in DB
        if (username && username !== user.username) {
            const usernameExists = await User.findOne({ username });
            if (usernameExists) {
                return res.status(400).json({ message: "username is already in use", success: false });
            }
        }

        // If password is provided, validate and hash it
        let hashedPassword = user.password;
        if (password) {
            if (password.length < 3) {
                return res.status(400).json({ message: 'Password must be at least 3 characters long', success: false });
            }
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Update user data
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                username: username || user.username,
                email: email || user.email,
                password: hashedPassword,
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            updatedUser,
        });

    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: err.message,
        });
    }
};

const authStatus=async(req,res)=>{
    if(req.user){
        res.status(200).json({
            message:"user authenticated successfully",
            username: req.user.username,
            isMfaActive: req.user.isMfaActive,
        });
    }else{
        res.status(401).json({message:"Unauthorized user"});
    }
};
const logout=async(req,res)=>{
    if(!req.user) {
        res.status(401).json({message:"Unauthorized user"});
    }
    req.logout((err)=>{
        if(err) return res.status(400).json({message:"User not logged in"});
        res.status(200).json({message:"Logout Successful"});
    })
};
const setup2FA=async(req,res)=>{
    try{
        console.log("the req.user is: ", req.user);
        const user = req.user;
        var secret = speakeasy.generateSecret();
        console.log("The Secret object is: ", secret);
        user.twoFactorSecret = secret.base32;
        user.isMfaActive = true;
        await user.save();
        const url = speakeasy.otpauthURL({
            secret: secret.base32,
            label:`${req.user.username}`,
            issuer:"www.supriyavia.com",
            encoding:"base32",
        });
        const qrImageUrl = await qrCode.toDataURL(url);
        res.status(200).json({
            secret:secret.base32,
            qrCode: qrImageUrl,
        })
    }catch(error){
        res.status(500).json({
            error:"Error setting up 2FA", message: error
        })
    }
};
// const verify2FA=async(req,res)=>{
//     const {token} = req.body;
//     const user = req.user;

//     const verified = speakeasy.totp.verify({
//         secret: user.twoFactorSecret,
//         encoding: "base32",
//         window: 2,
//         token,
//     });
//     if(verified){
//         const jwtToken = jwt.sign({username: user.username},process.env.JWT_SECRET,
//             {expiresIn:"1hr"}
//         );
//         res.status(200).json({message:"2FA successful",token: jwtToken})
//     }else{
//         res.status(400).json({message:"Invalid 2FA token"});
//     }
// };

const verify2FA = async (req, res) => {
    try {
        if (!req.user || !req.user.twoFactorSecret) {
            return res.status(401).json({ success: false, message: "No user or secret found" });
        }

        const { token } = req.body;
        const secret = req.user.twoFactorSecret;
        console.log("testing in verify2FA");
        console.log("Token received:", token);
        console.log("Secret:", secret);
        console.log("Server time:", new Date().toISOString());

        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2
        });

        console.log("TOTP verified:", verified);

        if (verified) {
            req.user.isTwoFactorAuthenticated = true;
            await req.user.save();
            return res.status(200).json({ success: true });
        } else {
            return res.status(403).json({ success: false, message: "Invalid 2FA token" });
        }
    } catch (err) {
        console.error("2FA verification error:", err);
        return res.status(500).json({ success: false, message: "Internal error" });
    }
};



const reset2FA=async(req,res)=>{
    try{
        const user = req.user;
        user.twoFactorSecret="";
        user.isMfaActive=false;
        await user.save();
        res.status(200).json({message:"2FA reset successful"})
    }catch(error){
        res.status(500).json({error:"Error reseting 2FA", message:error})
    }
};


module.exports = {
    signup,
    login,
    updateUserProfile,
    authStatus,
    logout,
    setup2FA,
    verify2FA,
    reset2FA
  };
  
