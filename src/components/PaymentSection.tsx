import { CURRENCIES } from '../utils/currency';

interface PaymentData {
  isPaid: boolean;
  paymentType: 'given' | 'received';
  amountAsked: string;
  amountGiven: string;
  currency: string;
  paymentMethod: 'cash' | 'venmo' | 'cashapp' | 'paypal' | 'zelle' | 'crypto' | 'gift' | 'other';
  paymentNotes: string;
}

interface PaymentSectionProps {
  paymentData: PaymentData;
  onPaymentChange: (data: PaymentData) => void;
  className?: string;
}

export default function PaymentSection({
  paymentData,
  onPaymentChange,
  className = ''
}: PaymentSectionProps) {
  const updatePaymentData = (updates: Partial<PaymentData>) => {
    onPaymentChange({ ...paymentData, ...updates });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Payment Toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPaid"
          checked={paymentData.isPaid}
          onChange={(e) => updatePaymentData({ isPaid: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="isPaid" className="text-sm font-medium">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          Money was involved
        </label>
      </div>

      {paymentData.isPaid && (
        <div className="pl-6 space-y-4 border-l-2 border-blue-200 dark:border-blue-800">
          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Direction</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="paymentType"
                  value="given"
                  checked={paymentData.paymentType === 'given'}
                  onChange={(e) => updatePaymentData({ paymentType: e.target.value as 'given' })}
                  className="text-blue-600"
                />
                <span className="text-sm">💸 I paid them</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="paymentType"
                  value="received"
                  checked={paymentData.paymentType === 'received'}
                  onChange={(e) => updatePaymentData({ paymentType: e.target.value as 'received' })}
                  className="text-blue-600"
                />
                <span className="text-sm">💵 They paid me</span>
              </label>
            </div>
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Amount Asked */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount {paymentData.paymentType === 'given' ? 'They Asked' : 'I Asked'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paymentData.amountAsked}
                onChange={(e) => updatePaymentData({ amountAsked: e.target.value })}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                placeholder="0.00"
              />
            </div>

            {/* Amount Given */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount Actually {paymentData.paymentType === 'given' ? 'Paid' : 'Received'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paymentData.amountGiven}
                onChange={(e) => updatePaymentData({ amountGiven: e.target.value })}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                placeholder="0.00"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                value={paymentData.currency}
                onChange={(e) => updatePaymentData({ currency: e.target.value })}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
              >
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select
              value={paymentData.paymentMethod}
              onChange={(e) => updatePaymentData({ paymentMethod: e.target.value as PaymentData['paymentMethod'] })}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="cash">💵 Cash</option>
              <option value="venmo">📱 Venmo</option>
              <option value="cashapp">💚 Cash App</option>
              <option value="paypal">🅿️ PayPal</option>
              <option value="zelle">⚡ Zelle</option>
              <option value="crypto">₿ Crypto</option>
              <option value="gift">🎁 Gift/Items</option>
              <option value="other">🔄 Other</option>
            </select>
          </div>

          {/* Payment Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Payment Details</label>
            <textarea
              value={paymentData.paymentNotes}
              onChange={(e) => updatePaymentData({ paymentNotes: e.target.value })}
              className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
              rows={2}
              placeholder="Additional payment details, negotiations, etc..."
            />
          </div>
        </div>
      )}
    </div>
  );
}