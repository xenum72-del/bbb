// Currency conversion utilities using free exchange rates API

// Free exchange rate API (no auth required, 1500 requests/month)
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Cache exchange rates for 1 hour
let ratesCache: ExchangeRates | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (ratesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return ratesCache;
  }

  try {
    const response = await fetch(EXCHANGE_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const rates = await response.json();
    ratesCache = rates;
    cacheTimestamp = now;
    return rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    
    // Fallback to hardcoded approximate rates if API fails
    const fallbackRates: ExchangeRates = {
      base: 'USD',
      date: new Date().toISOString().split('T')[0],
      rates: {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        CAD: 1.25,
        AUD: 1.35,
        JPY: 110,
        CHF: 0.92,
        CNY: 6.45,
        INR: 75
      }
    };
    
    ratesCache = fallbackRates;
    cacheTimestamp = now;
    return fallbackRates;
  }
}

export async function convertToUSD(amount: number, fromCurrency: string): Promise<{
  amountUSD: number;
  exchangeRate: number;
}> {
  if (fromCurrency === 'USD' || !fromCurrency) {
    return { amountUSD: amount, exchangeRate: 1 };
  }

  try {
    const rates = await getExchangeRates();
    const rate = rates.rates[fromCurrency.toUpperCase()];
    
    if (!rate) {
      console.warn(`Exchange rate not found for ${fromCurrency}, using 1:1 ratio`);
      return { amountUSD: amount, exchangeRate: 1 };
    }

    // Convert from foreign currency to USD
    const amountUSD = amount / rate;
    return { amountUSD: Math.round(amountUSD * 100) / 100, exchangeRate: rate };
  } catch (error) {
    console.error('Currency conversion failed:', error);
    return { amountUSD: amount, exchangeRate: 1 };
  }
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    // Fallback if currency is not supported
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$'
    };
    const symbol = symbols[currency.toUpperCase()] || '$';
    return `${symbol}${amount.toFixed(2)}`;
  }
}