/**
 * Privacy-First Analytics System
 * 
 * Tracks anonymous usage patterns with ZERO personal data collection.
 * All data is anonymized, aggregated, and user-controllable.
 * 
 * Design Principles:
 * - No personal identifiable information
 * - No precise location tracking
 * - User can opt-out completely
 * - Data stays minimal and anonymous
 * - Transparent about what's collected
 */

export interface AnalyticsSettings {
  enabled: boolean;
  anonymousId: string; // Generated hash, not tied to user
  optedOut: boolean;
  lastOptInDate?: string;
}

export interface AnalyticsEvent {
  type: 'page_view' | 'interaction' | 'feature_usage' | 'error';
  action: string;
  timestamp: number;
  sessionId: string; // Anonymous session identifier
  region?: string; // City/state level only
  version: string;
}

// Generate anonymous user ID that can't be traced back
function generateAnonymousId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `anon_${timestamp}_${random}`;
}

// Get general location (city/state) without precise coordinates
async function getGeneralLocation(): Promise<string | undefined> {
  if (!navigator.geolocation) return undefined;
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get city/state only
          const lat = Math.round(position.coords.latitude * 100) / 100; // Round to ~1km accuracy
          const lon = Math.round(position.coords.longitude * 100) / 100;
          
          // You'd use a service like OpenStreetMap Nominatim (free) here
          // This is just a placeholder - implement actual reverse geocoding
          resolve(`${lat.toFixed(1)},${lon.toFixed(1)}`); // Very general area
        } catch {
          resolve(undefined);
        }
      },
      () => resolve(undefined),
      { timeout: 5000, maximumAge: 300000 } // 5 min cache
    );
  });
}

class PrivacyFirstAnalytics {
  private settings: AnalyticsSettings;
  private sessionId: string;
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.settings = this.getSettings();
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private getSettings(): AnalyticsSettings {
    const stored = localStorage.getItem('analytics-settings');
    if (stored) {
      return JSON.parse(stored);
    }

    // Default: DISABLED for maximum privacy
    return {
      enabled: false,
      anonymousId: '', // Only generated when user opts in
      optedOut: false
    };
  }

  private saveSettings(): void {
    localStorage.setItem('analytics-settings', JSON.stringify(this.settings));
  }

  // User controls
  public optOut(): void {
    this.settings.optedOut = true;
    this.settings.enabled = false;
    this.settings.anonymousId = ''; // Clear anonymous ID
    this.saveSettings();
    this.clearLocalEvents();
  }

  public optIn(): void {
    this.settings.optedOut = false;
    this.settings.enabled = true;
    this.settings.lastOptInDate = new Date().toISOString();
    this.settings.anonymousId = generateAnonymousId(); // Generate fresh anonymous ID
    this.saveSettings();
  }

  public enable(): void {
    if (!this.settings.anonymousId) {
      this.settings.anonymousId = generateAnonymousId();
    }
    this.settings.enabled = true;
    this.settings.optedOut = false;
    this.settings.lastOptInDate = new Date().toISOString();
    this.saveSettings();
  }

  public disable(): void {
    this.settings.enabled = false;
    this.saveSettings();
    this.clearLocalEvents();
  }

  public isEnabled(): boolean {
    return this.settings.enabled && !this.settings.optedOut;
  }

  // Event tracking
  public async trackEvent(type: AnalyticsEvent['type'], action: string): Promise<void> {
    if (!this.isEnabled()) return;

    const event: AnalyticsEvent = {
      type,
      action,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      region: await getGeneralLocation(),
      version: '1.0.0' // App version
    };

    this.events.push(event);
    
    // Send events in batches to reduce network calls
    if (this.events.length >= 10) {
      await this.sendEvents();
    }
  }

  // Convenience methods
  public trackPageView(page: string): void {
    this.trackEvent('page_view', page);
  }

  public trackInteraction(element: string, action: string = 'click'): void {
    this.trackEvent('interaction', `${element}_${action}`);
  }

  public trackFeature(feature: string): void {
    this.trackEvent('feature_usage', feature);
  }

  public trackError(error: string): void {
    this.trackEvent('error', error);
  }

  // Send events to your analytics endpoint
  private async sendEvents(): Promise<void> {
    if (this.events.length === 0 || !this.isEnabled()) return;

    try {
      const payload = {
        anonymousId: this.settings.anonymousId,
        events: this.events,
        meta: {
          userAgent: navigator.userAgent.substring(0, 100), // Limited UA string
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          viewport: `${window.innerWidth}x${window.innerHeight}`
        }
      };

      // Replace with your analytics endpoint
      await fetch('https://your-analytics-endpoint.com/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      this.events = []; // Clear sent events
    } catch (error) {
      console.warn('Analytics send failed:', error);
      // Keep events for retry
    }
  }

  // Periodic flush
  public startPeriodicFlush(): void {
    setInterval(() => {
      this.sendEvents();
    }, 30000); // Send every 30 seconds
  }

  // Clear local data
  private clearLocalEvents(): void {
    this.events = [];
  }

  // Get current status for UI
  public getStatus(): { 
    enabled: boolean; 
    anonymousId: string; 
    eventsQueued: number;
    optedOut: boolean;
  } {
    return {
      enabled: this.settings.enabled,
      anonymousId: this.settings.anonymousId,
      eventsQueued: this.events.length,
      optedOut: this.settings.optedOut
    };
  }
}

// Singleton instance
export const analytics = new PrivacyFirstAnalytics();

// Auto-start periodic flush
analytics.startPeriodicFlush();

// React hook for easy integration
export function useAnalytics() {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackInteraction: analytics.trackInteraction.bind(analytics),
    trackFeature: analytics.trackFeature.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    enable: analytics.enable.bind(analytics),
    disable: analytics.disable.bind(analytics),
    optOut: analytics.optOut.bind(analytics),
    optIn: analytics.optIn.bind(analytics),
    isEnabled: analytics.isEnabled.bind(analytics),
    getStatus: analytics.getStatus.bind(analytics)
  };
}