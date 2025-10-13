/**
 * 🎭 Comprehensive Behavioral Security Testing for Encounter Ledger PWA
 * 
 * Tests runtime behavior, privacy compliance, and security posture
 * of the actual running application in a real browser environment.
 */

import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import fs from 'fs';

class BehaviorSecurityTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      loading: false,
      offline: false,
      privacy: {},
      security: {},
      accessibility: {},
      performance: {},
      pwa: {},
      gaySpecific: {}
    };
  }

  async initialize() {
    console.log('🚀 Initializing browser for behavioral testing...');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions-file-access-check',
        '--disable-extensions',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Monitor network activity
    this.networkRequests = [];
    this.consoleMessages = [];
    this.errors = [];

    this.page.on('request', (request) => {
      this.networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        headers: request.headers(),
        timestamp: Date.now()
      });
    });

    this.page.on('console', (msg) => {
      this.consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });

    this.page.on('pageerror', (error) => {
      this.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
    });

    // Set user agent to iPhone (our target platform)
    await this.page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    );
  }

  async testAppLoading(url = 'http://localhost:5174') {
    console.log('📱 Testing app loading behavior...');
    
    try {
      const response = await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      this.results.loading = {
        success: true,
        statusCode: response.status(),
        loadTime: Date.now(),
        url: response.url()
      };

      // Wait for React to initialize and service worker to register
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Wait for app to be ready
      await this.page.waitForFunction(
        () => document.readyState === 'complete' && document.querySelector('#root'),
        { timeout: 10000 }
      ).catch(() => {
        console.log('⚠️ App may not be fully loaded, continuing...');
      });

      // Check if app content is present
      const appContent = await this.page.evaluate(() => {
        return {
          hasContent: document.body.innerHTML.length > 2000,
          title: document.title,
          hasReactRoot: !!document.querySelector('#root'),
          bodyClasses: document.body.className,
          readyState: document.readyState
        };
      });

      this.results.loading = { ...this.results.loading, ...appContent };

    } catch (error) {
      this.results.loading = {
        success: false,
        error: error.message
      };
    }
  }

  async testOfflineCapability() {
    console.log('✈️ Testing offline functionality...');
    
    try {
      // First check if service worker is registered
      const hasServiceWorker = await this.page.evaluate(() => {
        return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
      });

      // Test offline mode
      await this.page.setOfflineMode(true);
      
      let reloadWorks = false;
      let reloadTime = 0;
      let offlineContent = {};

      try {
        // Try to reload page
        const reloadStart = Date.now();
        await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 8000 });
        reloadTime = Date.now() - reloadStart;
        reloadWorks = true;

        // Wait a bit for app to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if app still works
        offlineContent = await this.page.evaluate(() => {
          return {
            hasContent: document.body.innerHTML.length > 1000,
            hasNavigation: !!document.querySelector('nav, [role="navigation"]'),
            isInteractive: !!document.querySelector('button, input, [role="button"]'),
            errorMessages: Array.from(document.querySelectorAll('[class*="error"], [class*="offline"]'))
              .map(el => el.textContent.trim()).filter(text => text.length > 0)
          };
        });

      } catch (reloadError) {
        console.log('⚠️ Offline reload failed (expected without service worker):', reloadError.message);
        reloadWorks = false;
        
        // Try to check current page content
        try {
          offlineContent = await this.page.evaluate(() => {
            return {
              hasContent: document.body.innerHTML.length > 1000,
              hasNavigation: false,
              isInteractive: false,
              errorMessages: ['Page failed to load offline']
            };
          });
        } catch (evalError) {
          offlineContent = {
            hasContent: false,
            hasNavigation: false,
            isInteractive: false,
            errorMessages: ['Cannot evaluate page offline']
          };
        }
      }

      this.results.offline = {
        hasServiceWorker,
        reloadWorks,
        reloadTime,
        contentPresent: offlineContent.hasContent,
        navigationWorks: offlineContent.isInteractive,
        interactive: offlineContent.isInteractive,
        errors: offlineContent.errorMessages || []
      };

      // Return to online mode
      await this.page.setOfflineMode(false);
      
      // Reload page to get back to working state
      if (!reloadWorks) {
        await this.page.reload({ waitUntil: 'networkidle2', timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      this.results.offline = {
        hasServiceWorker: false,
        reloadWorks: false,
        error: error.message
      };
      
      // Ensure we're back online
      try {
        await this.page.setOfflineMode(false);
        await this.page.reload({ waitUntil: 'networkidle2', timeout: 10000 });
      } catch (recoveryError) {
        console.log('⚠️ Failed to recover from offline test:', recoveryError.message);
      }
    }
  }

  async testPrivacyCompliance() {
    console.log('🔒 Testing privacy compliance...');
    
    // Analyze network requests
    const externalRequests = this.networkRequests.filter(req => 
      !req.url.includes('localhost') && 
      !req.url.startsWith('chrome-extension://')
    );

    // Check localStorage usage with error handling
    let storageAnalysis = { itemCount: 0, items: {}, error: null };
    try {
      storageAnalysis = await this.page.evaluate(() => {
        try {
          const localStorageItems = {};
          const storageLength = localStorage.length;
          
          for (let i = 0; i < storageLength; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            if (key && value) {
              // Check for personal data patterns
              const hasPersonalData = /name|email|phone|address|birth|ssn|card|personal/i.test(key + value);
              const hasEncounterData = /encounter|friend|sexual|intimate/i.test(key + value);
              
              localStorageItems[key] = {
                size: value.length,
                hasPersonalData,
                hasEncounterData,
                preview: value.substring(0, 50) + '...'
              };
            }
          }

          return {
            itemCount: storageLength,
            items: localStorageItems,
            error: null
          };
        } catch (error) {
          return {
            itemCount: 0,
            items: {},
            error: error.message
          };
        }
      });
    } catch (error) {
      storageAnalysis.error = error.message;
    }

    // Check for tracking scripts
    const trackingAnalysis = await this.page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const trackingPatterns = /google.*analytics|facebook|twitter|tiktok|instagram|snapchat|tracking/i;
      
      return scripts.some(script => 
        trackingPatterns.test(script.src) || 
        trackingPatterns.test(script.innerHTML)
      );
    });

    this.results.privacy = {
      externalRequestCount: externalRequests.length,
      externalRequests: externalRequests.map(req => ({
        url: req.url,
        method: req.method,
        type: req.resourceType
      })),
      localStorage: storageAnalysis,
      hasThirdPartyTracking: trackingAnalysis,
      cookieCount: (await this.page.cookies()).length
    };
  }

  async testSecurityHeaders() {
    console.log('🛡️ Testing security headers and CSP...');
    
    try {
      // Get current page response or navigate to get fresh headers
      let response;
      try {
        response = await this.page.goto(this.page.url());
      } catch (error) {
        // If navigation fails, try the original URL
        response = await this.page.goto('http://localhost:5174');
      }

      const headers = response.headers();

      this.results.security = {
        headers: {
          csp: headers['content-security-policy'] || null,
          xFrameOptions: headers['x-frame-options'] || null,
          xssProtection: headers['x-xss-protection'] || null,
          contentTypeOptions: headers['x-content-type-nosniff'] || null,
          strictTransportSecurity: headers['strict-transport-security'] || null
        },
        https: response.url().startsWith('https://'),
        mixedContent: false // Will be detected by network monitoring
      };

      // Check for mixed content
      const mixedContentRequests = this.networkRequests.filter(req =>
        response.url().startsWith('https://') && req.url.startsWith('http://')
      );

      this.results.security.mixedContent = mixedContentRequests.length > 0;
      this.results.security.mixedContentRequests = mixedContentRequests;

      // Wait for page to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      this.results.security = {
        error: error.message,
        headers: {},
        https: false,
        mixedContent: false
      };
    }
  }

  async testAccessibility() {
    console.log('♿ Testing accessibility compliance...');
    
    try {
      const axe = new AxePuppeteer(this.page);
      const axeResults = await axe.analyze();

      this.results.accessibility = {
        violations: axeResults.violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          nodes: violation.nodes.length
        })),
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length
      };

    } catch (error) {
      this.results.accessibility = {
        error: error.message
      };
    }
  }

  async testPWACapabilities() {
    console.log('📱 Testing PWA capabilities...');
    
    const pwaFeatures = await this.page.evaluate(() => {
      return {
        serviceWorker: 'serviceWorker' in navigator,
        manifest: !!document.querySelector('link[rel="manifest"]'),
        installPrompt: 'onbeforeinstallprompt' in window,
        pushNotifications: 'PushManager' in window,
        cacheApi: 'caches' in window,
        indexedDb: 'indexedDB' in window,
        webShare: 'share' in navigator
      };
    });

    // Check manifest
    let manifestData = null;
    try {
      const manifestLink = await this.page.$('link[rel="manifest"]');
      if (manifestLink) {
        const manifestUrl = await this.page.evaluate(link => link.href, manifestLink);
        const manifestResponse = await this.page.goto(manifestUrl);
        manifestData = await manifestResponse.json();
      }
    } catch (error) {
      // Manifest not accessible
    }

    this.results.pwa = {
      features: pwaFeatures,
      manifest: manifestData,
      installable: pwaFeatures.serviceWorker && pwaFeatures.manifest
    };
  }

  async testGaySpecificSafety() {
    console.log('🏳️‍🌈 Testing gay-specific safety features...');
    
    // Test discrete app appearance
    const discreteAppearance = await this.page.evaluate(() => {
      const title = document.title;
      const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
      
      // Check if app looks innocent in browser/app switcher
      const looksInnocent = !/(sex|gay|hookup|grindr|encounter|intimate)/i.test(title);
      
      return {
        title,
        faviconUrl: favicon ? favicon.href : null,
        looksInnocent
      };
    });

    // Test for privacy protection features
    const privacyFeatures = await this.page.evaluate(() => {
      // Look for security/privacy UI elements using proper selectors
      const buttons = Array.from(document.querySelectorAll('button'));
      const hasLockButton = buttons.some(btn => 
        btn.textContent.toLowerCase().includes('lock') || 
        btn.getAttribute('aria-label')?.toLowerCase().includes('lock')
      );
      const hasSettingsAccess = buttons.some(btn => 
        btn.textContent.toLowerCase().includes('settings') || 
        btn.getAttribute('aria-label')?.toLowerCase().includes('settings')
      );
      
      return {
        hasLockButton,
        hasSettingsAccess
      };
    });

    // Check console for privacy-related messages
    const privacyMessages = this.consoleMessages.filter(msg =>
      /privacy|security|encrypt|anonymous|local/i.test(msg.text)
    );

    this.results.gaySpecific = {
      discreteAppearance,
      privacyFeatures,
      privacyMessages: privacyMessages.length,
      noSocialIntegration: this.networkRequests.every(req => 
        !/(facebook|twitter|instagram|tiktok|social)/i.test(req.url)
      )
    };
  }

  async testPerformance() {
    console.log('⚡ Testing performance metrics...');
    
    const performanceMetrics = await this.page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: nav ? nav.loadEventEnd - nav.loadEventStart : 0,
        domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart : 0,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        resourceCount: performance.getEntriesByType('resource').length
      };
    });

    this.results.performance = performanceMetrics;
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    
    const report = {
      timestamp,
      testSuite: 'Encounter Ledger Behavioral Security Audit',
      version: '1.0.0',
      results: this.results,
      summary: {
        totalNetworkRequests: this.networkRequests.length,
        consoleMessages: this.consoleMessages.length,
        errors: this.errors.length,
        overallSafety: this.calculateSafetyScore()
      }
    };

    // Save detailed report
    fs.writeFileSync('behavior-security-report.json', JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    this.generateMarkdownSummary(report);
    
    return report;
  }

  calculateSafetyScore() {
    let score = 100;
    let issues = [];

    // Loading issues
    if (!this.results.loading?.success) {
      score -= 20;
      issues.push('App loading failed');
    }

    // Offline issues  
    if (!this.results.offline?.reloadWorks) {
      score -= 15;
      issues.push('Offline functionality broken');
    }

    // Privacy issues
    if (this.results.privacy?.externalRequestCount > 0) {
      score -= 10;
      issues.push(`${this.results.privacy.externalRequestCount} external requests`);
    }

    if (this.results.privacy?.hasThirdPartyTracking) {
      score -= 25;
      issues.push('Third-party tracking detected');
    }

    // Security issues
    if (!this.results.security?.headers?.csp) {
      score -= 10;
      issues.push('No Content Security Policy');
    }

    // Accessibility issues
    const a11yViolations = this.results.accessibility?.violations?.length || 0;
    if (a11yViolations > 0) {
      score -= Math.min(20, a11yViolations * 2);
      issues.push(`${a11yViolations} accessibility violations`);
    }

    // PWA issues
    if (!this.results.pwa?.installable) {
      score -= 5;
      issues.push('Not installable as PWA');
    }

    return {
      score: Math.max(0, score),
      issues
    };
  }

  generateMarkdownSummary(report) {
    const summary = report.summary;
    const safety = summary.overallSafety;
    
    let status = '🏆 EXCELLENT';
    if (safety.score < 90) status = '⚡ GOOD';
    if (safety.score < 70) status = '⚠️ NEEDS WORK';
    if (safety.score < 50) status = '❌ CRITICAL';

    const markdown = `# 🎭 Behavioral Security Report

**Generated**: ${report.timestamp}
**Overall Safety Score**: ${safety.score}/100 ${status}

## 📊 Quick Summary

- **Loading**: ${this.results.loading?.success ? '✅' : '❌'} App loads successfully
- **Offline**: ${this.results.offline?.reloadWorks ? '✅' : '❌'} Works without internet  
- **Privacy**: ${this.results.privacy?.externalRequestCount === 0 ? '✅' : '❌'} No external tracking
- **Security**: ${this.results.security?.headers?.csp ? '✅' : '⚠️'} Security headers present
- **PWA**: ${this.results.pwa?.installable ? '✅' : '⚠️'} Installable as app
- **Gay Safety**: ${this.results.gaySpecific?.noSocialIntegration ? '✅' : '❌'} No social integration

## 🚨 Issues Found

${safety.issues.length > 0 ? safety.issues.map(issue => `- ⚠️ ${issue}`).join('\n') : '✅ No major issues detected!'}

*See \`behavior-security-report.json\` for detailed technical analysis.*
`;

    fs.writeFileSync('behavior-summary.md', markdown);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
(async () => {
  const tester = new BehaviorSecurityTester();
  
  try {
    await tester.initialize();
    await tester.testAppLoading();
    await tester.testOfflineCapability();
    await tester.testPrivacyCompliance();
    await tester.testSecurityHeaders();
    await tester.testAccessibility();
    await tester.testPWACapabilities();
    await tester.testGaySpecificSafety();
    await tester.testPerformance();
    
    const report = await tester.generateReport();
    
    console.log(`🎯 Behavioral security audit complete!`);
    console.log(`📊 Safety Score: ${report.summary.overallSafety.score}/100`);
    console.log(`📋 Report saved: behavior-security-report.json`);
    
  } catch (error) {
    console.error('❌ Behavioral testing failed:', error.message);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
})();