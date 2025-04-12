const mongoose =require('mongoose');
const Schema =mongoose.Schema;

const UserSchema=new Schema({
    // name:{
    //     type:String,
    //     required:true,
    // },
    username:{
        type:String,
        required:true,
        unique: true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    // profilePicture: {  // ✅ New field: Profile image
    //     type: String, 
    //     default: ""  // Default empty string if no image
    // },
    // phone_no: {  // ✅ New field: Phone number
    //     type: String,
    //     unique: false,
    //     sparse: true  // Allows null values without affecting uniqueness
    // },
    bio: {  // ✅ New field: User bio
        type: String,
        default: ""
    },
    location: {  // ✅ New field: User location
        type: String,
        default: ""
    },
    updatedAt: {  // ✅ New field: Auto update timestamp
        type: Date,
        default: Date.now
    },
    isMfaActive:{
        type: Boolean,
        required:false,
    },
    twoFactorSecret:{
        type: String,
    },
    expenses:[
        {
            text:{
                type:String,
                required:true
            },
            amount:{
                type:Number,
                required:true
            },
            createdAt:{
                type:Date,
                default:Date.now
            },
            location:{
                type:String,
                default:""
            }
        }
    ]
},{
    timestamps:true,
});

const User = mongoose.models.users || mongoose.model("users", UserSchema);
module.exports = User;
