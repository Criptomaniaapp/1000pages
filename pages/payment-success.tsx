import { useEffect, useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { useRouter } from 'next/router';

const PaymentSuccess = () => {
  const stripe = useStripe();
  const router = useRouter();
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = new URLSearchParams(window.location.search).get('payment_intent_client_secret');
    if (!clientSecret) return;

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('Payment successful! Your space on the grid has been secured. Redirecting...');
          setTimeout(() => router.push('/'), 5000);
          break;
        case 'processing':
          setMessage('Payment is processing. We will update you when it is complete.');
          break;
        case 'requires_payment_method':
          setMessage('Payment failed. Please try another payment method.');
          break;
        default:
          setMessage('Something went wrong.');
          break;
      }
    });
  }, [stripe, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h1>Thank You!</h1>
      <p>{message}</p>
    </div>
  );
};

export default PaymentSuccess;