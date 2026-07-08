'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { checkPaymentStatus } from '../actions';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function PaymentStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  
  const [status, setStatus] = useState<'pending' | 'completed' | 'failed' | 'expired' | 'not_found'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reference) {
      router.push('/onboarding');
      return;
    }

    const pollStatus = async () => {
      try {
        const result = await checkPaymentStatus(reference);
        setStatus(result.status as any);
        
        if (result.status === 'completed') {
          // Success! Redirect after a short delay
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else if (result.status === 'failed' || result.status === 'expired') {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollStatus, 3000);
    pollStatus(); // Initial check

    return () => clearInterval(interval);
  }, [reference, router]);

  if (!reference) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-subtle p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        {status === 'pending' && (
          <div className="space-y-6">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text">Processing Payment</h1>
            <p className="text-text-subtle">
              Please check your phone for the M-Pesa/Tigo Pesa prompt. Enter your PIN to complete the payment.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-text-subtle">
              <Clock className="h-4 w-4" />
              <span>Waiting for confirmation...</span>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-text">Payment Successful!</h1>
            <p className="text-text-subtle">
              Thank you! Your access has been granted. Redirecting you to the event map...
            </p>
          </div>
        )}

        {(status === 'failed' || status === 'expired') && (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-text">Payment Failed</h1>
            <p className="text-text-subtle">
              {status === 'expired' 
                ? 'The payment request has expired.' 
                : 'There was an issue processing your payment.'}
            </p>
            <button
              onClick={() => router.push('/onboarding')}
              className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-hover transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
