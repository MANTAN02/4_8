import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logInfo, logError, logWarn } from './logger';
import { cacheManager } from './cache-manager';

interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  enableBruteForceProtection: boolean;
  enableDDoSProtection: boolean;
  enableThreatDetection: boolean;
  encryptionKey: string;
}

interface ThreatDetection {
  suspiciousIPs: Map<string, SuspiciousActivity>;
  blockedIPs: Set<string>;
  rateLimitViolations: Map<string, number>;
  securityEvents: SecurityEvent[];
}

interface SuspiciousActivity {
  ip: string;
  attempts: number;
  lastAttempt: number;
  reasons: string[];
  riskScore: number;
}

interface SecurityEvent {
  id: string;
  timestamp: number;
  type: 'brute_force' | 'ddos' | 'sql_injection' | 'xss' | 'suspicious_pattern';
  ip: string;
  userAgent: string;
  payload: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
}

class SecurityFortress {
  private config: SecurityConfig;
  private threatDetection: ThreatDetection;
  private ipWhitelist: Set<string> = new Set();
  private apiKeysCache: Map<string, any> = new Map();

  constructor(config: SecurityConfig) {
    this.config = config;
    this.threatDetection = {
      suspiciousIPs: new Map(),
      blockedIPs: new Set(),
      rateLimitViolations: new Map(),
      securityEvents: []
    };
    
    this.initializeSecurity();
  }

  private initializeSecurity(): void {
    // Add localhost and common private networks to whitelist
    this.ipWhitelist.add('127.0.0.1');
    this.ipWhitelist.add('::1');
    this.ipWhitelist.add('localhost');
    
    // Setup periodic cleanup
    setInterval(() => {
      this.cleanupSecurityData();
    }, 300000); // 5 minutes

    // Setup threat analysis
    if (this.config.enableThreatDetection) {
      setInterval(() => {
        this.analyzeThreatPatterns();
      }, 60000); // 1 minute
    }

    logInfo('Security fortress initialized', {
      bruteForceProtection: this.config.enableBruteForceProtection,
      ddosProtection: this.config.enableDDoSProtection,
      threatDetection: this.config.enableThreatDetection
    });
  }

  // Advanced brute force protection
  async checkBruteForce(identifier: string, maxAttempts: number = this.config.maxLoginAttempts): Promise<boolean> {
    const key = `brute_force:${identifier}`;
    const attempts = await cacheManager.get(key) || 0;
    
    if (attempts >= maxAttempts) {
      await this.logSecurityEvent({
        type: 'brute_force',
        ip: identifier,
        userAgent: '',
        payload: `Blocked after ${attempts} attempts`,
        severity: 'high'
      });
      
      return false; // Account is locked
    }
    
    return true;
  }

  async recordFailedAttempt(identifier: string): Promise<void> {
    const key = `brute_force:${identifier}`;
    const attempts = (await cacheManager.get(key) || 0) + 1;
    
    await cacheManager.set(key, attempts, this.config.lockoutDuration);
    
    if (attempts >= this.config.maxLoginAttempts) {
      logWarn('Account locked due to brute force attempts', { identifier, attempts });
    }
  }

  async clearFailedAttempts(identifier: string): Promise<void> {
    const key = `brute_force:${identifier}`;
    await cacheManager.del(key);
  }

  // DDoS Protection middleware
  createDDoSProtection() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute window
      max: (req) => {
        const ip = this.getClientIP(req);
        
        // Whitelist gets higher limits
        if (this.ipWhitelist.has(ip)) {
          return 1000;
        }
        
        // Suspicious IPs get lower limits
        if (this.threatDetection.suspiciousIPs.has(ip)) {
          return 10;
        }
        
        return 100; // Default limit
      },
      message: {
        error: 'Too many requests, please slow down',
        retryAfter: 60
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        const ip = this.getClientIP(req);
        this.recordSuspiciousActivity(ip, 'rate_limit_exceeded');
        
        this.logSecurityEvent({
          type: 'ddos',
          ip,
          userAgent: req.get('User-Agent') || '',
          payload: `Rate limit exceeded`,
          severity: 'medium'
        });
        
        res.status(429).json({
          error: 'Too many requests',
          message: 'Please slow down and try again later'
        });
      }
    });
  }

  // Threat detection middleware
  threatDetectionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enableThreatDetection) {
        return next();
      }

      const ip = this.getClientIP(req);
      const userAgent = req.get('User-Agent') || '';
      const payload = JSON.stringify({
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query
      });

      // Check if IP is blocked
      if (this.threatDetection.blockedIPs.has(ip)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Detect suspicious patterns
      const threats = this.detectThreats(req, payload);
      
      if (threats.length > 0) {
        this.recordSuspiciousActivity(ip, threats.join(', '));
        
        threats.forEach(threat => {
          this.logSecurityEvent({
            type: this.mapThreatToEventType(threat),
            ip,
            userAgent,
            payload,
            severity: this.getThreatSeverity(threat)
          });
        });

        // Block if high severity threats detected
        if (threats.some(t => this.getThreatSeverity(t) === 'critical')) {
          this.blockIP(ip, 'Critical threat detected');
          return res.status(403).json({ error: 'Security violation detected' });
        }
      }

      next();
    };
  }

  private detectThreats(req: Request, payload: string): string[] {
    const threats: string[] = [];
    const patterns = {
      sql_injection: [
        /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b|\bALTER\b)/i,
        /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
        /(\'|\")(\s*)(UNION|SELECT|INSERT|DELETE)/i
      ],
      xss: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/i,
        /on\w+\s*=\s*["\'][^"\']*["\']?/i
      ],
      path_traversal: [
        /\.\.\/|\.\.\\/,
        /%2e%2e%2f|%2e%2e%5c/i,
        /\.\.\%2f|\.\.\%5c/i
      ],
      command_injection: [
        /[;&|`$(){}[\]]/,
        /(wget|curl|nc|netcat|bash|sh|cmd|powershell)/i
      ]
    };

    // Check URL and payload for threats
    const fullText = req.url + ' ' + payload;
    
    Object.entries(patterns).forEach(([threatType, threatPatterns]) => {
      if (threatPatterns.some(pattern => pattern.test(fullText))) {
        threats.push(threatType);
      }
    });

    // Check for suspicious user agents
    const userAgent = req.get('User-Agent') || '';
    const suspiciousUAPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /burp/i,
      /crawler/i,
      /bot/i
    ];

    if (suspiciousUAPatterns.some(pattern => pattern.test(userAgent))) {
      threats.push('suspicious_user_agent');
    }

    return threats;
  }

  private mapThreatToEventType(threat: string): SecurityEvent['type'] {
    const mapping: { [key: string]: SecurityEvent['type'] } = {
      'sql_injection': 'sql_injection',
      'xss': 'xss',
      'path_traversal': 'suspicious_pattern',
      'command_injection': 'suspicious_pattern',
      'suspicious_user_agent': 'suspicious_pattern'
    };
    
    return mapping[threat] || 'suspicious_pattern';
  }

  private getThreatSeverity(threat: string): SecurityEvent['severity'] {
    const severityMapping: { [key: string]: SecurityEvent['severity'] } = {
      'sql_injection': 'critical',
      'xss': 'high',
      'command_injection': 'critical',
      'path_traversal': 'high',
      'suspicious_user_agent': 'medium'
    };
    
    return severityMapping[threat] || 'low';
  }

  private recordSuspiciousActivity(ip: string, reason: string): void {
    const current = this.threatDetection.suspiciousIPs.get(ip) || {
      ip,
      attempts: 0,
      lastAttempt: 0,
      reasons: [],
      riskScore: 0
    };

    current.attempts++;
    current.lastAttempt = Date.now();
    current.reasons.push(reason);
    current.riskScore += this.calculateRiskScore(reason);

    this.threatDetection.suspiciousIPs.set(ip, current);

    // Auto-block if risk score is too high
    if (current.riskScore >= 100) {
      this.blockIP(ip, 'High risk score reached');
    }
  }

  private calculateRiskScore(reason: string): number {
    const scores: { [key: string]: number } = {
      'sql_injection': 50,
      'xss': 30,
      'command_injection': 50,
      'path_traversal': 25,
      'rate_limit_exceeded': 10,
      'suspicious_user_agent': 15
    };
    
    return scores[reason] || 5;
  }

  private blockIP(ip: string, reason: string): void {
    this.threatDetection.blockedIPs.add(ip);
    
    logWarn('IP blocked by security system', { ip, reason });
    
    // Store in cache for persistence across restarts
    cacheManager.set(`blocked_ip:${ip}`, { reason, timestamp: Date.now() }, 3600000); // 1 hour
  }

  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...event
    };

    this.threatDetection.securityEvents.push(securityEvent);

    // Keep only last 1000 events
    if (this.threatDetection.securityEvents.length > 1000) {
      this.threatDetection.securityEvents = this.threatDetection.securityEvents.slice(-500);
    }

    // Store critical events in cache for admin alerts
    if (event.severity === 'critical') {
      const criticalEvents = await cacheManager.get('critical_security_events') || [];
      criticalEvents.push(securityEvent);
      await cacheManager.set('critical_security_events', criticalEvents, 86400000); // 24 hours
    }

    logWarn('Security event detected', securityEvent);
  }

  private cleanupSecurityData(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    // Clean up suspicious IPs
    for (const [ip, activity] of this.threatDetection.suspiciousIPs.entries()) {
      if (now - activity.lastAttempt > maxAge) {
        this.threatDetection.suspiciousIPs.delete(ip);
      }
    }

    // Clean up rate limit violations
    for (const [ip, timestamp] of this.threatDetection.rateLimitViolations.entries()) {
      if (now - timestamp > maxAge) {
        this.threatDetection.rateLimitViolations.delete(ip);
      }
    }

    logInfo('Security data cleanup completed', {
      suspiciousIPs: this.threatDetection.suspiciousIPs.size,
      blockedIPs: this.threatDetection.blockedIPs.size
    });
  }

  private analyzeThreatPatterns(): void {
    const recentEvents = this.threatDetection.securityEvents.filter(
      event => Date.now() - event.timestamp < 3600000 // Last hour
    );

    // Analyze patterns by IP
    const ipCounts = new Map<string, number>();
    recentEvents.forEach(event => {
      ipCounts.set(event.ip, (ipCounts.get(event.ip) || 0) + 1);
    });

    // Auto-block IPs with too many security events
    for (const [ip, count] of ipCounts.entries()) {
      if (count >= 10 && !this.threatDetection.blockedIPs.has(ip)) {
        this.blockIP(ip, `${count} security events in last hour`);
      }
    }
  }

  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      '0.0.0.0'
    ).replace(/^::ffff:/, '');
  }

  // Data encryption utilities
  encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.config.encryptionKey);
    cipher.setAAD(Buffer.from('baartal-security'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      data: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decrypt(encryptedData: EncryptedData): string {
    const decipher = crypto.createDecipher('aes-256-gcm', this.config.encryptionKey);
    decipher.setAAD(Buffer.from('baartal-security'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Secure password hashing
  async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hash);
  }

  // API key management
  generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  validateApiKey(apiKey: string): boolean {
    // Implement your API key validation logic
    return this.apiKeysCache.has(apiKey);
  }

  // Security headers middleware
  securityHeadersMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      // CSP for production
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Content-Security-Policy', 
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' checkout.razorpay.com; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self' wss: https:; " +
          "frame-src checkout.razorpay.com;"
        );
      }
      
      next();
    };
  }

  // Get security statistics
  getSecurityStats(): any {
    return {
      suspiciousIPs: this.threatDetection.suspiciousIPs.size,
      blockedIPs: this.threatDetection.blockedIPs.size,
      recentEvents: this.threatDetection.securityEvents.filter(
        event => Date.now() - event.timestamp < 3600000
      ).length,
      threatsByType: this.getEventsByType(),
      topThreats: this.getTopThreateningIPs()
    };
  }

  private getEventsByType(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    
    this.threatDetection.securityEvents
      .filter(event => Date.now() - event.timestamp < 3600000)
      .forEach(event => {
        counts[event.type] = (counts[event.type] || 0) + 1;
      });
    
    return counts;
  }

  private getTopThreateningIPs(): Array<{ ip: string; riskScore: number; attempts: number }> {
    return Array.from(this.threatDetection.suspiciousIPs.values())
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10)
      .map(activity => ({
        ip: activity.ip,
        riskScore: activity.riskScore,
        attempts: activity.attempts
      }));
  }

  // Manual IP management
  whitelistIP(ip: string): void {
    this.ipWhitelist.add(ip);
    logInfo('IP whitelisted', { ip });
  }

  unblockIP(ip: string): void {
    this.threatDetection.blockedIPs.delete(ip);
    this.threatDetection.suspiciousIPs.delete(ip);
    cacheManager.del(`blocked_ip:${ip}`);
    logInfo('IP unblocked', { ip });
  }
}

// Configuration
const securityConfig: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordMinLength: 8,
  enableBruteForceProtection: true,
  enableDDoSProtection: true,
  enableThreatDetection: true,
  encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key-change-this'
};

export const securityFortress = new SecurityFortress(securityConfig);
export default securityFortress;