const authMiddleware = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

const adminMiddleware = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).render('error', { message: 'Access denied. Admin privileges required.' });
    }
    next();
};

const studentMiddleware = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'student') {
        return res.status(403).render('error', { message: 'Access denied. Student access required.' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware, studentMiddleware };