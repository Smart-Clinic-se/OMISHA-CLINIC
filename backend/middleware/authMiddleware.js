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

const protect = (req, res, next) => {
    const user = getUserFromToken(req);
    if (!user) {
        return res.status(401).json({ message: "Not authorized, token failed" });
    }
    req.user = user;
    next();
};

module.exports = { getUserFromToken, protect };
