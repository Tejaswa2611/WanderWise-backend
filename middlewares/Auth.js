// middlewares/ensureAuthenticated.js

const ensureAuthenticated = (req, res, next) => {
    console.log("🔵 Passport Session Middleware called!");

    if (req.isAuthenticated()) {
        console.log("🟢 User is authenticated:", req.user);
        return next();
    }

    console.log("🔴 User is not authenticated");
    return res.status(401).json({ message: 'Unauthorized. Please login to access this resource.' });
};

module.exports = ensureAuthenticated;
