import axios from 'axios';

/**
 * ClickPesa Tanzania Mobile Money Gateway
 * 
 * Handles Vodacom M-Pesa, Tigo Pesa, Airtel Money, Halotel.
 * Expected phone format: 255XXXXXXXXX (no +, no leading 0)
 */

const CLICKPESA_API_URL = process.env.CLICKPESA_API_URL;
const CLICKPESA_API_KEY = process.env.CLICKPESA_API_KEY;

if (!CLICKPESA_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn('CLICKPESA_API_KEY is missing in production environment');
}

export type ClickPesaStatus = 'pending' | 'completed' | 'failed' | 'expired';

export interface ClickPesaChargeResponse {
  reference: string;
  status: ClickPesaStatus;
  redirect_url?: string;
  error?: string;
}

export const clickpesa = {
  /**
   * Initiate a mobile money charge
   */
  charge: async (params: {
    phoneNumber: string;
    amount: number;
    description: string;
    externalId: string;
  }): Promise<ClickPesaChargeResponse> => {
    try {
      // In a real implementation, we would call ClickPesa API
      // For this project, we'll simulate the response if API key is missing
      if (!CLICKPESA_API_KEY) {
        console.log('[ClickPesa Simulation] Charging:', params);
        return {
          reference: `sim_${Math.random().toString(36).substring(7)}`,
          status: 'pending',
        };
      }

      const response = await axios.post(
        `${CLICKPESA_API_URL}/charges`,
        {
          amount: params.amount,
          currency: 'TZS',
          phone: params.phoneNumber,
          description: params.description,
          external_id: params.externalId,
          webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        },
        {
          headers: {
            Authorization: `Bearer ${CLICKPESA_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        reference: response.data.reference,
        status: response.data.status,
      };
    } catch (error: any) {
      console.error('ClickPesa charge error:', error.response?.data || error.message);
      return {
        reference: '',
        status: 'failed',
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Verify a payment status
   */
  verify: async (reference: string): Promise<ClickPesaStatus> => {
    try {
      if (!CLICKPESA_API_KEY) {
        // Mocking verification
        return 'pending';
      }

      const response = await axios.get(`${CLICKPESA_API_URL}/charges/${reference}`, {
        headers: {
          Authorization: `Bearer ${CLICKPESA_API_KEY}`,
        },
      });

      return response.data.status;
    } catch (error: any) {
      console.error('ClickPesa verify error:', error.response?.data || error.message);
      return 'failed';
    }
  },
};
