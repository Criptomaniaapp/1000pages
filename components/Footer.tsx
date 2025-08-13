// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content-wrapper">
        <div className="footer-text">
          <p>© 2025 One Million Memecoin. All rights reserved.</p>
          <p>Images are © of their respective owners. We are not responsible for external content.</p>
        </div>
        <div className="footer-links">
          <Link href="/terms" className="footer-link">Terms of Use</Link>
          <a 
            href="https://t.me/onemillionmemecoinpage" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="footer-link"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
