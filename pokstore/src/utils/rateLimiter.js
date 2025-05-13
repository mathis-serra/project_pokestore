const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

class RateLimiter {
  constructor() {
    this.attempts = new Map();
  }

  isRateLimited(identifier) {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || { count: 0, timestamp: now };

    // Reset attempts if the time window has passed
    if (now - userAttempts.timestamp > RATE_LIMIT_WINDOW) {
      userAttempts.count = 0;
      userAttempts.timestamp = now;
    }

    // Check if user has exceeded maximum attempts
    if (userAttempts.count >= MAX_ATTEMPTS) {
      const timeLeft = Math.ceil((RATE_LIMIT_WINDOW - (now - userAttempts.timestamp)) / 1000 / 60);
      return {
        limited: true,
        timeLeft,
        message: `Trop de tentatives. Réessayez dans ${timeLeft} minutes.`
      };
    }

    return { limited: false };
  }

  addAttempt(identifier) {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || { count: 0, timestamp: now };

    if (now - userAttempts.timestamp > RATE_LIMIT_WINDOW) {
      userAttempts.count = 1;
      userAttempts.timestamp = now;
    } else {
      userAttempts.count += 1;
    }

    this.attempts.set(identifier, userAttempts);
  }

  resetAttempts(identifier) {
    this.attempts.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter(); 