import { PaymentPlan } from '../types';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'canceled';
  clientSecret: string;
}

export interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  dueDate: Date;
  paidAt?: Date;
  downloadUrl?: string;
}

export class PaymentSubscriptionModule {
  private stripePublicKey: string;
  private paypalClientId: string;
  private apiBaseUrl: string;
  private authToken: string | null = null;

  constructor(config: {
    stripePublicKey: string;
    paypalClientId: string;
    apiBaseUrl: string;
  }) {
    this.stripePublicKey = config.stripePublicKey;
    this.paypalClientId = config.paypalClientId;
    this.apiBaseUrl = config.apiBaseUrl;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Payment Method Management
   */

  /**
   * Get user's saved payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    if (!this.authToken) {
      throw new Error('User must be authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/payment/methods`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      return data.paymentMethods;
    } catch (error) {
      console.error('Fetch payment methods error:', error);
      return this.getMockPaymentMethods();
    }
  }

  /**
   * Add new payment method
   */
  async addPaymentMethod(paymentMethodData: {
    type: 'card' | 'paypal';
    cardNumber?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cvc?: string;
    paypalEmail?: string;
  }): Promise<PaymentMethod> {
    if (!this.authToken) {
      throw new Error('User must be authenticated');
    }

    try {
      if (paymentMethodData.type === 'card') {
        return await this.addCreditCard(paymentMethodData);
      } else if (paymentMethodData.type === 'paypal') {
        return await this.addPayPalAccount(paymentMethodData);
      } else {
        throw new Error('Unsupported payment method type');
      }
    } catch (error) {
      console.error('Add payment method error:', error);
      throw new Error('Failed to add payment method');
    }
  }

  /**
   * Add credit card via Stripe
   */
  private async addCreditCard(cardData: {
    cardNumber?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cvc?: string;
  }): Promise<PaymentMethod> {
    // In a real implementation, you would:
    // 1. Use Stripe Elements to securely collect card data
    // 2. Create a payment method with Stripe
    // 3. Attach it to the customer

    const response = await fetch(`${this.apiBaseUrl}/payment/methods/card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({
        cardNumber: cardData.cardNumber,
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        cvc: cardData.cvc,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add credit card');
    }

    const data = await response.json();
    return data.paymentMethod;
  }

  /**
   * Add PayPal account
   */
  private async addPayPalAccount(paypalData: {
    paypalEmail?: string;
  }): Promise<PaymentMethod> {
    const response = await fetch(`${this.apiBaseUrl}/payment/methods/paypal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({
        email: paypalData.paypalEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add PayPal account');
    }

    const data = await response.json();
    return data.paymentMethod;
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    if (!this.authToken) {
      throw new Error('User must be authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/payment/methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }
    } catch (error) {
      console.error('Delete payment method error:', error);
      throw new Error('Failed to delete payment method');
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    if (!this.authToken) {
      throw new Error('User must be authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/payment/methods/${paymentMethodId}/default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to set default payment method');
      }
    } catch (error) {
      console.error('Set default payment method error:', error);
      throw new Error('Failed to set default payment method');
    }
  }

  /**
   * Subscription Management
   */

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(): Promise<PaymentPlan[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription/plans`);

      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }

      const data = await response.json();
      return data.plans;
    } catch (error) {
      console.error('Fetch plans error:', error);
      return this.getMockSubscriptionPlans();
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(
    planId: string,
    paymentMethodId: string
  ): Promise<{
    subscription: Subscription;
    paymentIntent?: PaymentIntent;
  }> {
    if (!this.authToken) {
      throw new Error('User must be authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          planId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subscription');
      }

      const data = await response.json();
      
      return {
        subscription: {
          ...data.subscription,
          currentPeriodStart: new Date(data.subscription.currentPeriodStart),
          currentPeriodEnd: new Date(data.subscription.currentPeriodEnd),
        },
        paymentIntent: data.paymentIntent,
      };
    } catch (error) {
      console.error('Create subscription error:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Get current subscription
   */
  async getCurrentSubscription(): Promise<Subscription | null> {
    if (!this.authToken) {
      throw new Error('User must be authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription/current`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (response.status === 404) {
        return null; // No active subscription
      }

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      
      return {
        ...data.subscription,
        currentPeriodStart: new Date(data.subscription.currentPeriodStart),
        currentPeriodEnd: new Date(data.subscription.currentPeriodEnd),
      };
    } catch (error) {
      console.error('Fetch subscription error:', error);
      return null;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    newPlanId: string
  ): Promise<Subscription> {
    if (!this.authToken) {
      throw new Error('User must be authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          planId: newPlanId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update subscription');
      }

      const data = await response.json();
      
      return {
        ...data.subscription,
        currentPeriodStart: new Date(data.subscription.currentPeriodStart),
        currentPeriodEnd: new Date(data.subscription.currentPeriodEnd),
      };
    } catch (error) {
      console.error('Update subscription error:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Subscription> {
    if (!this.authToken) {
      throw new Error('User must be authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          cancelAtPeriodEnd,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel subscription');
      }

      const data = await response.json();
      
      return {
        ...data.subscription,
        currentPeriodStart: new Date(data.subscription.currentPeriodStart),
        currentPeriodEnd: new Date(data.subscription.currentPeriodEnd),
      };
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    if (!this.authToken) {
      throw new Error('User must be authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription/${subscriptionId}/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reactivate subscription');
      }

      const data = await response.json();
      
      return {
        ...data.subscription,
        currentPeriodStart: new Date(data.subscription.currentPeriodStart),
        currentPeriodEnd: new Date(data.subscription.currentPeriodEnd),
      };
    } catch (error) {
      console.error('Reactivate subscription error:', error);
      throw new Error('Failed to reactivate subscription');
    }
  }

  /**
   * Invoice Management
   */

  /**
   * Get invoice history
   */
  async getInvoices(): Promise<Invoice[]> {
    if (!this.authToken) {
      throw new Error('User must be authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/billing/invoices`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      
      return data.invoices.map((invoice: any) => ({
        ...invoice,
        dueDate: new Date(invoice.dueDate),
        paidAt: invoice.paidAt ? new Date(invoice.paidAt) : undefined,
      }));
    } catch (error) {
      console.error('Fetch invoices error:', error);
      return this.getMockInvoices();
    }
  }

  /**
   * Download invoice
   */
  async downloadInvoice(invoiceId: string): Promise<string> {
    if (!this.authToken) {
      throw new Error('User must be authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/billing/invoices/${invoiceId}/download`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const data = await response.json();
      return data.downloadUrl;
    } catch (error) {
      console.error('Download invoice error:', error);
      throw new Error('Failed to download invoice');
    }
  }

  /**
   * Payment Processing
   */

  /**
   * Process one-time payment
   */
  async processOneTimePayment(
    amount: number,
    currency: string,
    paymentMethodId: string,
    description: string
  ): Promise<PaymentIntent> {
    if (!this.authToken) {
      throw new Error('User must be authenticated');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          amount,
          currency,
          paymentMethodId,
          description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment processing failed');
      }

      const data = await response.json();
      return data.paymentIntent;
    } catch (error) {
      console.error('Process payment error:', error);
      throw new Error('Payment processing failed');
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/payment/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment confirmation failed');
      }

      const data = await response.json();
      return data.paymentIntent;
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw new Error('Payment confirmation failed');
    }
  }

  /**
   * Utility Methods
   */

  /**
   * Calculate prorated amount for subscription change
   */
  async calculateProration(
    currentPlanId: string,
    newPlanId: string
  ): Promise<{
    proratedAmount: number;
    immediateCharge: number;
    nextInvoiceAmount: number;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/subscription/calculate-proration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          currentPlanId,
          newPlanId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate proration');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Calculate proration error:', error);
      throw new Error('Failed to calculate proration');
    }
  }

  /**
   * Validate payment method
   */
  async validatePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/payment/methods/${paymentMethodId}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Validate payment method error:', error);
      return false;
    }
  }

  /**
   * Mock data for demo purposes
   */
  private getMockPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'pm_mock_card',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
      },
      {
        id: 'pm_mock_paypal',
        type: 'paypal',
        isDefault: false,
      },
    ];
  }

  private getMockSubscriptionPlans(): PaymentPlan[] {
    return [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        features: [
          '3 projects maximum',
          '5 minute video limit',
          'Watermarked videos',
          'Basic templates',
        ],
        maxProjects: 3,
        maxVideoLength: 300,
        watermark: true,
      },
      {
        id: 'pro_monthly',
        name: 'Pro Monthly',
        price: 19.99,
        features: [
          'Unlimited projects',
          'No video length limit',
          'No watermark',
          'Premium templates',
          'Priority support',
        ],
        maxProjects: Infinity,
        maxVideoLength: Infinity,
        watermark: false,
      },
      {
        id: 'pro_yearly',
        name: 'Pro Yearly',
        price: 199.99,
        features: [
          'Unlimited projects',
          'No video length limit',
          'No watermark',
          'Premium templates',
          'Priority support',
          '2 months free',
        ],
        maxProjects: Infinity,
        maxVideoLength: Infinity,
        watermark: false,
      },
    ];
  }

  private getMockInvoices(): Invoice[] {
    return [
      {
        id: 'inv_mock_1',
        subscriptionId: 'sub_mock',
        amount: 19.99,
        currency: 'usd',
        status: 'paid',
        dueDate: new Date('2024-01-01'),
        paidAt: new Date('2024-01-01'),
      },
      {
        id: 'inv_mock_2',
        subscriptionId: 'sub_mock',
        amount: 19.99,
        currency: 'usd',
        status: 'open',
        dueDate: new Date('2024-02-01'),
      },
    ];
  }
}
