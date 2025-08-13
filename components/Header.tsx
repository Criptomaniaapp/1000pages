// components/Header.tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import FaqModal from './FaqModal';
import ReferralModal from './Referral';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

// Componente para el icono de X (Twitter)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
);

// Componente para el icono de Telegram
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.58c-.28 1.13-1.04 1.4-1.74.88l-4.92-3.6-2.38 2.31c-.26.26-.49.49-.94.49z"></path>
  </svg>
);


export default function Header() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFaqModalOpen, setFaqModalOpen] = useState(false);
  const [isReferralModalOpen, setReferralModalOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  const openFaqModal = () => {
    setFaqModalOpen(true);
    setMobileMenuOpen(false);
  };

  const openReferralModal = () => {
    setReferralModalOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-content-wrapper">
          <div className="header-logo">
            <a href="/" aria-label="Back to home">
              <Image src="/logo.png" alt="Million Memecoin Homepage Logo" width={260} height={67} />
            </a>
          </div>

          <div className="header-center">
            <p className="header-message">1,000,000 pixels ~ $1 USDC per pixel</p>
            <nav className="header-nav">
              <a href="/">Home</a>
              <button onClick={openFaqModal} className="nav-button">FAQ</button>
              <button onClick={openReferralModal} className="nav-button">Referrals</button>
              
              {/* Divisor visual */}
              <div className="nav-divider"></div>

              {/* Iconos sociales movidos aquí dentro */}
              <a href="https://x.com/1millionpage" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Visit our X page">
                <XIcon />
              </a>
              <a href="https://t.me/onemillionmemecoin" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Join our Telegram">
                <TelegramIcon />
              </a>
            </nav>
          </div>

          {/* El botón de la billetera ahora está solo en este contenedor */}
          <div className="header-right-controls">
            <div className="header-wallet">
              <WalletMultiButton />
            </div>
          </div>

          <button className="mobile-menu-button" onClick={toggleMobileMenu} aria-label="Open menu">
            <div className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      </header>

      <div className="referral-marquee">
        <div className="marquee-content">
          <span>
            Earn a 20% commission on every purchase! Use your referral link. ✨
          </span>
          <span>
            Earn a 20% commission on every purchase! Use your referral link. ✨
          </span>
          <span>
            Earn a 20% commission on every purchase! Use your referral link. ✨
          </span>
          <span>
            Earn a 20% commission on every purchase! Use your referral link. ✨
          </span>
          <span>
            Earn a 20% commission on every purchase! Use your referral link. ✨
          </span>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-nav-overlay">
          <nav className="mobile-nav">
            <div className="mobile-nav-top">
              <a href="/" onClick={toggleMobileMenu}>Home</a>
              <button onClick={openFaqModal} className="nav-button">FAQ</button>
              <button onClick={openReferralModal} className="nav-button">Referrals</button>
            </div>
            <div className="mobile-nav-bottom">
              <div className="mobile-socials">
                <a href="https://x.com/1millionpage" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Visit our X page">
                  <XIcon />
                </a>
                <a href="https://t.me/onemillionmemecoin" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Join our Telegram">
                  <TelegramIcon />
                </a>
              </div>
              <div className="mobile-wallet-container">
                  <WalletMultiButton />
              </div>
            </div>
          </nav>
        </div>
      )}

      <FaqModal isOpen={isFaqModalOpen} onClose={() => setFaqModalOpen(false)} />
      <ReferralModal isOpen={isReferralModalOpen} onClose={() => setReferralModalOpen(false)} />
    </>
  );
}
