const jwt = require('jsonwebtoken');

const getUserFromToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
            return decoded;
        } catch (err) {
            return null;
        }
    }
    return null;
};

const protect = async (req, res, next) => {
    const decoded = getUserFromToken(req);
    if (!decoded) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }

    try {
        // We need to fetch the user to check the current sessionId
        // Note: This adds a DB call to every protected route.
        const User = require('../models/User');
        const user = await User.findById(decoded.id).select('+sessionId');

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Session Check
        if (decoded.sessionId && user.sessionId && decoded.sessionId !== user.sessionId) {
            return res.status(401).json({ message: "Session expired. Logged in on another device." });
        }

        req.user = decoded; // Keep using decoded for lightweight access if needed found in other parts, or attach full user? 
        // Existing code used `req.user = user` (from getUserFromToken returning decoded) - wait, getUserFromToken returns decoded.
        // My previous view showed: req.user = user; (where user was decoded).
        // Let's keep it consistent but attach the full fetched user if desired, OR just the decoded info + verification.
        // To minimize breaking changes elsewhere that might expect just the decoded payload or full user, let's see.
        // The original code:
        // const user = getUserFromToken(req); // which returns decoded object
        // req.user = user; 

        // So req.user was just the decoded token payload. 
        // I should keep it that way primarily, BUT the sessionId check is crucial.

        req.user = decoded;
        next();

    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(401).json({ message: "Not authorized, session check failed" });
    }
};

const protectOptional = async (req, res, next) => {
    // If no token, proceed as guest
    if (!req.headers.authorization) {
        return next();
    }
    // If token exists, enforce it (same as protect)
    return protect(req, res, next);
};

module.exports = { getUserFromToken, protect, protectOptional };
