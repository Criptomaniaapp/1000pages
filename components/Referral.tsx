// components/ReferralModal.tsx
'use client';
import { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReferralModal: FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const { publicKey } = useWallet();
  const [referralLink, setReferralLink] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy');

  useEffect(() => {
    if (publicKey && isOpen) { // Check isOpen to only run when modal is visible
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      setReferralLink(`${baseUrl}?ref=${publicKey.toBase58()}`);
    } else {
      setReferralLink('');
    }
  }, [publicKey, isOpen]);

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink).then(() => {
        setCopyButtonText('Copied!');
        setTimeout(() => setCopyButtonText('Copy'), 2000);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="referral-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Referral Program</h2>
        <p>Share your link and earn 20% of every purchase made through it!</p>
        
        {publicKey ? (
          <div className="referral-box">
            <p>Your unique referral link:</p>
            <div className="input-group">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="referral-input"
                placeholder="Your referral link"
                title="Your unique referral link"
              />
              <button onClick={handleCopyLink} className="copy-button">
                {copyButtonText}
              </button>
            </div>
          </div>
        ) : (
          <p className="referral-connect-wallet">Connect your wallet to generate your referral link.</p>
        )}
      </div>
    </div>
  );
};

export default ReferralModal;
