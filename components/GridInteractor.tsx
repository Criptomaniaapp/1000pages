import { useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { PublicKey } from '@solana/web3.js';
import { PIXEL_SIZE, TOTAL_WIDTH_PX, TOTAL_HEIGHT_PX } from '../lib/constants';
import { makeSolanaTransaction } from '../lib/solana';
import PurchaseModal from './PurchaseModal';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { PixelBlock } from '../types/pixelBlock'; // <-- Ahora esta importación funcionará

// --- Interfaz para las Props del Componente ---
interface GridInteractorProps {
  initialBlocks: PixelBlock[];
  referrerAddress: string | null;
  gridImageUrl: string;
}

// --- Popover para mostrar información del bloque ---
const Popover = ({ block }: { block: PixelBlock | null }) => {
  if (!block) return null;
  return (
    <div className="absolute z-10 p-2 text-xs text-white bg-gray-900 border border-gray-700 rounded-md shadow-lg pointer-events-none">
      <p>
        <span className="font-bold">Owner:</span> {block.owner.substring(0, 4)}...{block.owner.substring(block.owner.length - 4)}
      </p>
      <p>
        <span className="font-bold">Link:</span> <a href={block.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 pointer-events-auto">{block.link}</a>
      </p>
    </div>
  );
};

const GridInteractor = ({ initialBlocks, referrerAddress, gridImageUrl }: GridInteractorProps) => {
  const [selection, setSelection] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showModal, setShowModal] = useState(false);
  const [popover, setPopover] = useState<{ visible: boolean; x: number; y: number; content: PixelBlock | null }>({ visible: false, x: 0, y: 0, content: null });
  
  const [paymentMethod, setPaymentMethod] = useState<'solana' | 'stripe' | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const { publicKey, sendTransaction } = useWallet();
  const stripe = useStripe();
  const elements = useElements();

  const getCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = gridRef.current!.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setPopover({ visible: false, x: 0, y: 0, content: null });
    const { x, y } = getCoords(e);
    setIsSelecting(true);
    setStartPos({ x, y });
    setSelection({ x, y, width: 1, height: 1 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSelecting) {
      const { x, y } = getCoords(e);
      const newSelection = {
        x: Math.min(startPos.x, x),
        y: Math.min(startPos.y, y),
        width: Math.abs(startPos.x - x) + 1,
        height: Math.abs(startPos.y - y) + 1,
      };
      setSelection(newSelection);
    } else {
      const { x, y } = getCoords(e);
      const block = initialBlocks.find(b => x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height);
      if (block) {
        setPopover({ visible: true, x: e.clientX, y: e.clientY, content: block });
      } else {
        setPopover({ visible: false, x: 0, y: 0, content: null });
      }
    }
  };

  const handleMouseLeave = () => {
    setPopover({ visible: false, x: 0, y: 0, content: null });
  };
  
  const handleMouseUp = async () => {
    setIsSelecting(false);
    if (selection.width > 0 && selection.height > 0) {
      const res = await fetch('/api/check-area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selection),
      });
      const { available } = await res.json();
      if (available) {
        setShowModal(true);
      } else {
        toast.error('This area is already taken. Please select another one.');
        setSelection({ x: 0, y: 0, width: 0, height: 0 });
      }
    }
  };
  
  const handleSolanaPurchase = async (link: string, imageBase64: string) => {
    if (!publicKey) {
        toast.error("Please connect your wallet.");
        return;
    };
    const referrerPublicKey = referrerAddress ? new PublicKey(referrerAddress) : undefined;
    toast.loading('Preparing transaction...', { id: 'solana' });
    try {
        const { transaction } = await makeSolanaTransaction(publicKey, selection, referrerPublicKey);
        const signature = await sendTransaction(transaction, null as any);
        toast.loading('Saving purchase...', { id: 'solana' });
        await fetch('/api/save-purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...selection, link, imageBase64, owner: publicKey.toBase58(), signature, referrer: referrerAddress }),
        });
        toast.success('Purchase successful!', { id: 'solana' });
        setTimeout(() => window.location.reload(), 5000);
    } catch (error: any) {
        toast.error(`Error: ${error.message}`, { id: 'solana' });
    }
  };

  const resetState = () => {
    setShowModal(false);
    setIsLoading(false);
    setPaymentMethod(null);
    setClientSecret(null);
    setSelection({ x: 0, y: 0, width: 0, height: 0 });
  };

  const handlePurchase = async (link: string, imageBase64: string, imageFile: File) => {
    if (!publicKey) {
      toast.error('Please connect your wallet first.');
      return;
    }
    setIsLoading(true);

    if (paymentMethod === 'solana') {
      await handleSolanaPurchase(link, imageBase64);
    } else if (paymentMethod === 'stripe') {
      await handleStripePurchase(link, imageFile);
    }
    setIsLoading(false);
  };
  
  const handleStripePurchase = async (link: string, imageFile: File) => {
    if (!stripe || !elements || !clientSecret) {
        toast.error("Stripe is not ready.");
        setIsLoading(false);
        return;
    }

    toast.loading('Processing payment...', { id: 'stripe' });
    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: `${window.location.origin}/payment-success`,
        },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
        toast.error(error.message || "An error occurred.", { id: 'stripe' });
    } else {
        toast.error("An unexpected error occurred.", { id: 'stripe' });
    }
    setIsLoading(false);
  };
  
  const initiateStripePayment = async (price: number, link: string, imageFile: File) => {
    if (!publicKey) {
      toast.error('Please connect your wallet first. Your address is needed for the record.');
      return;
    }
    setIsLoading(true);
    toast.loading('Initializing secure payment...', { id: 'stripe-init' });

    const imageBase64 = Buffer.from(await imageFile.arrayBuffer()).toString('base64');
    const imageRes = await fetch('/api/upload-image', {
        method: 'POST',
        body: JSON.stringify({ imageBase64 }),
        headers: { 'Content-Type': 'application/json' }
    });
    if (!imageRes.ok) {
        toast.error("Failed to upload image.", { id: 'stripe-init' });
        setIsLoading(false);
        return;
    }
    const { imageUrl } = await imageRes.json();
    
    const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            amount: price,
            metadata: {
                ...selection,
                link,
                imageUrl,
                ownerWallet: publicKey.toBase58(),
            },
        }),
    });

    if (!res.ok) {
        toast.error("Could not initialize Stripe payment.", { id: 'stripe-init' });
        setIsLoading(false);
        return;
    }

    const { clientSecret } = await res.json();
    setClientSecret(clientSecret);
    setPaymentMethod('stripe');
    toast.dismiss('stripe-init');
    setIsLoading(false);
  };

  return (
    <>
      <div
        ref={gridRef}
        className="relative border-2 border-gray-400 cursor-crosshair mx-auto"
        style={{ width: TOTAL_WIDTH_PX, height: TOTAL_HEIGHT_PX, backgroundImage: `url(${gridImageUrl})` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {popover.visible && (
          <div style={{ position: 'fixed', left: popover.x + 15, top: popover.y + 15 }}>
            <Popover block={popover.content} />
          </div>
        )}
        {isSelecting && (
          <div
            className="absolute border-2 border-dashed border-blue-500 bg-blue-500 bg-opacity-25 pointer-events-none"
            style={{
              left: selection.x * PIXEL_SIZE,
              top: selection.y * PIXEL_SIZE,
              width: selection.width * PIXEL_SIZE,
              height: selection.height * PIXEL_SIZE, // <-- CORRECCIÓN DEL TYPO
            }}
          />
        )}
      </div>

      {showModal && (
        <PurchaseModal
          selection={selection}
          onClose={resetState}
          onPurchase={handlePurchase}
          onInitiateStripe={initiateStripePayment}
          isLoading={isLoading}
          paymentMethod={paymentMethod}
          clientSecret={clientSecret}
          onSetPaymentMethod={setPaymentMethod}
        />
      )}
    </>
  );
};

export default GridInteractor;