import { NextApiRequest, NextApiResponse } from 'next';
import { Stripe } from 'stripe';
import { buffer } from 'micro';
import { savePurchaseToDB } from '../../../lib/savePurchase'; // Usaremos una función refactorizada

export const config = {
  api: {
    bodyParser: false, // Esencial para que el webhook de Stripe funcione
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log('PaymentIntent succeeded:', paymentIntent.id);

    // Extraer metadatos de la compra
    const { x, y, width, height, imageUrl, link, ownerWallet } = paymentIntent.metadata;

    try {
      // Llamar a la función unificada para guardar la compra
      await savePurchaseToDB({
        x: parseInt(x),
        y: parseInt(y),
        width: parseInt(width),
        height: parseInt(height),
        link,
        image_url: imageUrl,
        owner: ownerWallet, // Guardamos la wallet, aunque el pago fue con Stripe
        signature: paymentIntent.id, // Usamos el ID de Stripe como firma única
      });
      console.log(`Successfully saved purchase for Stripe payment ${paymentIntent.id}`);
    } catch (error) {
      console.error(`Failed to save purchase for Stripe payment ${paymentIntent.id}:`, error);
      // Aquí podrías enviar una alerta para manejar el caso manualmente
      return res.status(500).json({ error: 'Failed to process purchase after payment.' });
    }
  } else {
    console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}