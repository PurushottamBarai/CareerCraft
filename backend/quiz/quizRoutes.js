const express = require('express');

// Helper to inject dependencies dynamically
module.exports = function(getDb, auth) {
    const router = express.Router();
    
    // Inject DB into controller
    const { getAccessStatus, generateQuiz, recordQuizResult } = require('./quizController')(getDb);

    // Get limit status (public route, checks user headers if present but doesn't mandate)
    // We attach auth middleware conditionally allowing unauthenticated requests to pass through
    const optionalAuth = (req, res, next) => {
        const header = req.headers['authorization'];
        if (header && header.startsWith('Bearer ') && header.split(' ')[1] !== 'null') {
            return auth(req, res, next);
        }
        next();
    };

    router.get('/status', optionalAuth, getAccessStatus);
    router.post('/generate', optionalAuth, generateQuiz);
    router.post('/submit', optionalAuth, recordQuizResult);

    return router;
};
