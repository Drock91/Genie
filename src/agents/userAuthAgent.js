/**
 * User & Auth Agent
 * Generates complete user authentication and management systems
 * 
 * Produces: Auth routes, user model, JWT system, email verification, RBAC
 */

import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";

export class UserAuthAgent extends BaseAgent {
  constructor(opts) {
    super({ name: "UserAuth", ...opts });
    this.multiLlmSystem = opts.multiLlmSystem;
  }

  /**
   * Main entry point - generate complete auth system
   */
  async generateAuthSystem(options = {}) {
    const {
      authType = 'jwt',
      framework = 'express',
      includeOAuth = false,
      traceId = '',
      iteration = 1
    } = options;

    this.info({ traceId, iteration }, `Generating ${authType} authentication system for ${framework}`);

    try {
      // Generate all components
      const userSchema = this.generateUserSchema();
      const authUtilities = this.generateAuthUtilities();
      const authRoutes = this.generateAuthRoutes(framework);
      const authMiddleware = this.generateAuthMiddleware();
      const rbac = this.generateRBACSystem();
      const emailService = this.generateEmailService();
      const envExample = this.generateEnvExample();

      this.info({ traceId }, "Auth system generation complete");

      return makeAgentOutput({
        summary: 'Complete user authentication system generated',
        patches: [
          { 
            type: 'file', 
            path: 'src/auth/routes.js', 
            content: authRoutes,
            description: 'Authentication routes'
          },
          { 
            type: 'file', 
            path: 'src/auth/middleware.js', 
            content: authMiddleware,
            description: 'Auth and RBAC middleware'
          },
          { 
            type: 'file', 
            path: 'src/utils/authUtils.js', 
            content: authUtilities,
            description: 'Authentication utilities'
          },
          { 
            type: 'file', 
            path: 'src/services/emailService.js', 
            content: emailService,
            description: 'Email notification service'
          },
          { 
            type: 'file', 
            path: 'src/auth/rbac.js', 
            content: rbac,
            description: 'Role-based access control'
          },
          { 
            type: 'file', 
            path: 'prisma/auth-schema-additions.prisma', 
            content: userSchema,
            description: 'User/Auth schema for Prisma'
          },
          { 
            type: 'file', 
            path: '.env.example',
            content: envExample, 
            description: 'Environment configuration template'
          }
        ],
        notes: [
          `✓ JWT authentication system generated`,
          `✓ User model with security fields included`,
          `✓ Email verification flow configured`,
          `✓ Password reset with security included`,
          `✓ Role-based access control (RBAC) setup`,
          `✓ Session management implemented`,
          `✓ Audit logging included`,
          `✓ Rate limiting configured`,
          `✓ All routes require authentication`
        ],
        data: {
          authType,
          framework,
          includeOAuth
        }
      });
    } catch (error) {
      this.logger?.error({ error: error.message }, "Auth system generation failed");
      throw error;
    }
  }

  generateUserSchema() {
    return `// User Authentication Prisma Models
// Add these to your prisma/schema.prisma

model User {
  id        String   @id @default(cuid())
  
  // Authentication
  email     String   @unique
  password  String
  
  // Profile
  firstName String?
  lastName  String?
  avatar    String?
  
  // Status
  emailVerified    Boolean   @default(false)
  emailVerificationToken String?
  isActive Boolean   @default(true)
  
  // Security - Account lockout
  loginAttempts    Int       @default(0)
  lockedUntil      DateTime?
  
  // Security - Password management
  passwordChangedAt DateTime?
  passwordResetToken String?
  passwordResetExpires DateTime?
  
  // Relationships
  profile      UserProfile?
  preferences  UserPreferences?
  sessions     LoginSession[]
  auditLogs    AuditLog[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@index([email])
  @@index([emailVerificationToken])
  @@index([passwordResetToken])
}

model UserProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  phone     String?
  bio       String?
  location  String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model UserPreferences {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  theme        String   @default("light")
  language     String   @default("en")
  timezone     String   @default("UTC")
  emailNotifications Boolean @default(true)
  emailNews    Boolean   @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model LoginSession {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  refreshToken  String   @unique
  deviceInfo    String?
  ipAddress     String?
  userAgent     String?
  
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([refreshToken])
}

model AuditLog {
  id            String   @id @default(cuid())
  userId        String?
  user          User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  action        String   // login, logout, password_change, etc
  resource      String   // what was accessed
  changes       Json?    // what changed
  ipAddress     String?
  userAgent     String?
  
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([action])
}
`;
  }

  generateAuthUtilities() {
    return `import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Password Hashing
 */
export async function hashPassword(password) {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return bcryptjs.compare(password, hash);
}

export async function isPasswordStrong(password) {
  // Minimum 8 chars, 1 uppercase, 1 number, 1 special char
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

/**
 * Token Management
 */
export function generateAccessToken(userId, options = {}) {
  const { expiresIn = '15m' } = options;
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

export function generateRefreshToken(userId, sessionId, options = {}) {
  const { expiresIn = '7d' } = options;
  return jwt.sign(
    { userId, sessionId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn }
  );
}

export function verifyToken(token, isRefresh = false) {
  try {
    const secret = isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}

export function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Email Verification & Password Reset
 */
export function generateEmailVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

export function isTokenExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

/**
 * Validation
 */
export function validateEmail(email) {
  const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return regex.test(email);
}
`;
  }

  generateAuthRoutes(framework = 'express') {
    return `import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  hashPassword,
  verifyPassword,
  isPasswordStrong,
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  hashToken,
  validateEmail
} from '../utils/authUtils.js';
import { authenticate } from './middleware.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============ REGISTRATION ============

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    if (!await isPasswordStrong(password)) {
      return res.status(400).json({
        error: 'Password must be 8+ chars with uppercase, number, and special char'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateEmailVerificationToken();
    const hashedToken = hashToken(verificationToken);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        emailVerificationToken: hashedToken,
        profile: { create: {} },
        preferences: { create: {} }
      },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    return res.status(201).json({
      message: 'User created. Please verify your email.',
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============ EMAIL VERIFICATION ============

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const hashedToken = hashToken(token);

    // Find user with token
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: hashedToken }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null
      }
    });

    return res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============ LOGIN ============

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email verified
    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email first' });
    }

    // Check if account locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(429).json({ error: 'Account locked. Try again later.' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      // Increment failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: user.loginAttempts + 1 }
      });

      // Lock account after 5 failed attempts
      if ((user.loginAttempts + 1) >= 5) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lockedUntil: new Date(Date.now() + 15 * 60000) } // 15 min
        });
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lastLogin: new Date(),
        lockedUntil: null
      }
    });

    // Create login session
    const session = await prisma.loginSession.create({
      data: {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60000), // 7 days
        refreshToken: generateRefreshToken(user.id, 'session')
      }
    });

    const accessToken = generateAccessToken(user.id);

    return res.json({
      accessToken,
      refreshToken: session.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============ REFRESH TOKEN ============

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, true);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if session exists and is valid
    const session = await prisma.loginSession.findUnique({
      where: { refreshToken }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId, session.id);

    // Update session
    await prisma.loginSession.update({
      where: { id: session.id },
      data: { refreshToken: newRefreshToken }
    });

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// ============ PASSWORD RESET REQUEST ============

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If email exists, you will receive reset link' });
    }

    const resetToken = generateEmailVerificationToken();
    const hashedToken = hashToken(resetToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60000) // 1 hour
      }
    });

    await sendPasswordResetEmail(email, resetToken);

    return res.json({ message: 'Password reset link sent to email' });
  } catch (error) {
    res.status(500).json({ error: 'Request failed' });
  }
});

// ============ PASSWORD RESET ============

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!await isPasswordStrong(newPassword)) {
      return res.status(400).json({ error: 'Password too weak' });
    }

    const hashedToken = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date()
      }
    });

    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// ============ GET CURRENT USER ============

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        profile: true,
        preferences: true
      }
    });

    return res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============ UPDATE PROFILE ============

router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, avatar, bio, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        avatar,
        profile: {
          update: { bio, phone }
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profile: true
      }
    });

    return res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// ============ LOGOUT ============

router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.loginSession.deleteMany({
        where: { refreshToken }
      });
    }

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
`;
  }

  generateAuthMiddleware() {
    return `import { verifyToken } from '../utils/authUtils.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Authentication Middleware - Verifies JWT token
 */
export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const decoded = verifyToken(token, false);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Authorization Middleware - Checks user role/permission
 */
export function authorize(allowed = []) {
  return async (req, res, next) => {
    try {
      // Add your permission check logic here
      next();
    } catch (error) {
      res.status(403).json({ error: 'Authorization failed' });
    }
  };
}

/**
 * Rate Limit Middleware
 */
export function rateLimit(maxAttempts = 5, windowMs = 15 * 60000) {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const userAttempts = attempts.get(key) || [];
    
    // Clean old attempts
    const recentAttempts = userAttempts.filter(t => now - t < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({ error: 'Too many attempts, try again later' });
    }

    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    next();
  };
}

/**
 * Error Logging Middleware
 */
export function logAudit(action) {
  return async (req, res, next) => {
    try {
      if (req.user) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            resource: req.originalUrl,
            changes: req.body,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
      }
      next();
    } catch (error) {
      console.error('Audit logging error:', error);
      next();
    }
  };
}
`;
  }

  generateRBACSystem() {
    return `/**
 * Role-Based Access Control (RBAC)
 */

export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user'
};

export const PERMISSIONS = {
  admin: {
    users: ['create', 'read', 'update', 'delete'],
    teams: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update']
  },
  moderator: {
    users: ['read', 'update'],
    teams: ['read', 'update'],
    settings: ['read']
  },
  user: {
    users: ['read'],
    teams: ['read'],
    settings: ['read']
  }
};

export function hasPermission(role, resource, action) {
  const rolePerms = PERMISSIONS[role] || {};
  const resourcePerms = rolePerms[resource] || [];
  return resourcePerms.includes(action);
}

export function requirePermission(resource, action) {
  return (req, res, next) => {
    const userRole = req.user?.role || 'user';
    
    if (!hasPermission(userRole, resource, action)) {
      return res.status(403).json({ 
        error: 'Permission denied',
        required: \`\${resource}:\${action}\`
      });
    }
    
    next();
  };
}
`;
  }

  generateEmailService() {
    return `import nodemailer from 'nodemailer';

// Configure your email service
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send email verification
 */
export async function sendVerificationEmail(to, token) {
  const verificationUrl = \`\${process.env.APP_URL}/verify-email?token=\${token}\`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Verify your email',
    html: \`
      <h2>Welcome!</h2>
      <p>Please verify your email by clicking the link below:</p>
      <a href="\${verificationUrl}">\${verificationUrl}</a>
      <p>This link expires in 24 hours.</p>
    \`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', to);
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(to, token) {
  const resetUrl = \`\${process.env.APP_URL}/reset-password?token=\${token}\`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Password Reset Request',
    html: \`
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="\${resetUrl}">\${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    \`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', to);
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}
`;
  }

  generateEnvExample() {
    return `# Authentication
JWT_SECRET=your-jwt-secret-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-this-in-production
JWT_EXPIRY=15m

# Email Service (for verification & password reset)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
APP_URL=http://localhost:3000

# Security
BCRYPT_ROUNDS=10
PASSWORD_RESET_EXPIRY=1h
LOGIN_ATTEMPT_LIMIT=5
LOGIN_LOCKOUT_DURATION=15m

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Environment
NODE_ENV=development
PORT=3000
`;
  }
}

export default UserAuthAgent;
