// components/FaqModal.tsx
'use client';
import { FC } from 'react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const faqs = [
  {
    question: 'What is The Million Memecoin Homepage?',
    answer: "It's a digital canvas of one million pixels where anyone can buy a block of pixels, upload an image, and link it to their website. It's a modern tribute to the iconic \"Million Dollar Homepage,\" but for the Solana memecoin ecosystem.",
  },
  {
    question: 'How much does a pixel cost?',
    answer: 'Each pixel costs $1 USDC. The minimum purchase is a 25-pixel block (5x5), so the minimum purchase is $25 USDC.',
  },
  {
    question: 'How do I buy pixels?',
    answer: 'Connect your Solana wallet (like Phantom or Solflare), click on the canvas to select the area you want, upload your image, add your link, and approve the transaction. Your pixels will appear instantly!',
  },
  {
    question: 'What kind of image and link can I use?',
    answer: "You can upload images in PNG or JPG format. Your link can point to any website, such as your memecoin project's page, your social media, or your portfolio.",
  },
  {
    question: 'Are the pixels permanent?',
    answer: 'Yes, once you buy your pixels, your image and link will remain on the canvas indefinitely, immortalized in memecoin history.',
  },
  {
    question: 'How does the referral program work?',
    answer: 'It\'s simple! Connect your wallet and go to the "Referrals" section to get your unique link. Share it with others, and for every pixel purchase made through your link, you will automatically receive a 20% commission of the sale amount in USDC directly to your wallet.',
  },
  // CAMBIO: Nueva pregunta y respuesta sobre el cambio de link
  {
    question: 'Can I change the link on my pixels after purchase?',
    answer: 'Of course! There is an administrative fee of $5 USDC to change the web address for your pixels. Please send an email to support@onemillionmemecoinpage.com with your request and the wallet address you used for the purchase so we can identify your pixels.',
  },
];

const FaqModal: FC<FaqModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="faq-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Frequently Asked Questions (FAQ)</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details key={index} className="faq-item">
              <summary className="faq-question">{faq.question}</summary>
              <p className="faq-answer">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FaqModal;
