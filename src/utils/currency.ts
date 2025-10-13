// Currency conversion utilities using free exchange rates API

// Free exchange rate API (no auth required, 1500 requests/month)
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

// Supported currencies with their display information
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: '₣', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: '$', flag: '🇳🇿' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: '$', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$', flag: '🇭🇰' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' }
] as const;

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
        USD: 1.00,     // US Dollar
        EUR: 0.85,     // Euro
        GBP: 0.73,     // British Pound
        JPY: 110.00,   // Japanese Yen
        AUD: 1.35,     // Australian Dollar
        CAD: 1.25,     // Canadian Dollar
        CHF: 0.92,     // Swiss Franc
        CNY: 6.45,     // Chinese Yuan
        SEK: 8.75,     // Swedish Krona
        NZD: 1.45,     // New Zealand Dollar
        MXN: 18.50,    // Mexican Peso
        SGD: 1.35,     // Singapore Dollar
        HKD: 7.85,     // Hong Kong Dollar
        NOK: 8.90,     // Norwegian Krone
        KRW: 1180.00,  // South Korean Won
        TRY: 8.75,     // Turkish Lira
        RUB: 65.00,    // Russian Ruble
        INR: 75.00,    // Indian Rupee
        BRL: 5.25,     // Brazilian Real
        ZAR: 15.50     // South African Rand
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
      minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2
    }).format(amount);
  } catch {
    // Fallback if currency is not supported
    const symbols: Record<string, string> = {
      USD: '$',      EUR: '€',      GBP: '£',      JPY: '¥',
      AUD: 'A$',     CAD: 'C$',     CHF: '₣',      CNY: '¥',
      SEK: 'kr',     NZD: 'NZ$',    MXN: 'MX$',    SGD: 'S$',
      HKD: 'HK$',    NOK: 'kr',     KRW: '₩',      TRY: '₺',
      RUB: '₽',      INR: '₹',      BRL: 'R$',     ZAR: 'R'
    };
    const symbol = symbols[currency.toUpperCase()] || '$';
    const decimals = (currency === 'JPY' || currency === 'KRW') ? 0 : 2;
    return `${symbol}${amount.toFixed(decimals)}`;
  }
}