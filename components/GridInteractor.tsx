// components/GridInteractor.tsx
'use client';
import { FC, useState, useEffect, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createUsdcTransfer } from '../lib/solana';
import { PixelBlock } from '../types/pixelBlock';
import { useRouter } from 'next/router';

// Pequeño componente para la animación de carga (SVG)
const Loader = () => (
  <svg className="spinner" width="65" height="65" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
     <circle className="path" fill="none" strokeWidth="6" strokeLinecap="round" cx="33" cy="33" r="30"></circle>
  </svg>
);

interface GridInteractorProps {
  initialBlocks: PixelBlock[];
  referrerAddress: string | null;
  gridImageUrl: string;
}

const GridInteractor: FC<GridInteractorProps> = ({ initialBlocks, referrerAddress, gridImageUrl }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const router = useRouter();
  
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedArea, setSelectedArea] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPixels, setCurrentPixels] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridImage, setGridImage] = useState<HTMLImageElement | null>(null);
  const isProcessing = useRef(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const hoveredBlockRef = useRef<PixelBlock | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  // Nuevo estado para los mensajes del modal
  const [purchaseStatusMessage, setPurchaseStatusMessage] = useState('');

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;
    const gridStep = 10;
    for (let i = 0; i <= 1000; i += gridStep) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1000);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1000, i);
      ctx.stroke();
    }
  };

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    if (!ctx || !gridImageUrl) return;

    const img = new window.Image();
    img.src = gridImageUrl;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, 1000, 1000);
      ctx.drawImage(img, 0, 0, 1000, 1000);
      drawGrid(ctx);
      setGridImage(img);
    };
    img.onerror = () => {
      console.error("Failed to load grid image from URL:", gridImageUrl);
    }
  }, [gridImageUrl]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const handleMouseDown = (e: MouseEvent) => {
      const ctx = canvasElement.getContext('2d');
      if (!ctx) return;

      e.preventDefault();
      const rect = canvasElement.getBoundingClientRect();
      const scaleX = 1000 / rect.width;
      const scaleY = 1000 / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);

      const clickedBlock = blocks.find(
        (block) =>
          x >= block.x_start &&
          x <= block.x_start + block.width &&
          y >= block.y_start &&
          y <= block.y_start + block.height
      );

      if (clickedBlock && clickedBlock.link) {
        window.open(clickedBlock.link, '_blank', 'noopener,noreferrer');
        return;
      }
      
      if (!startPoint.current) {
        startPoint.current = { x, y };
        setErrorMessage('Select the end point with another click');
        if (gridImage) {
          ctx.clearRect(0, 0, 1000, 1000);
          ctx.drawImage(gridImage, 0, 0, 1000, 1000);
          drawGrid(ctx);
          ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
          ctx.fillRect(x, y, 1, 1);
        }
      } else {
        let w = Math.abs(x - startPoint.current.x);
        let h = Math.abs(y - startPoint.current.y);
        let minX = Math.min(startPoint.current.x, x);
        let minY = Math.min(startPoint.current.y, y);
        w = Math.min(w, 1000 - minX);
        h = Math.min(h, 1000 - minY);
        const pixels = w * h;
        setCurrentPixels(pixels);
        if (pixels < 25) {
          setErrorMessage('Minimum selection: 25 pixels (e.g., 5x5)');
          setTimeout(() => setErrorMessage(null), 3000);
          startPoint.current = null;
          if (gridImage) {
            ctx.clearRect(0, 0, 1000, 1000);
            ctx.drawImage(gridImage, 0, 0, 1000, 1000);
            drawGrid(ctx);
          }
          return;
        }
        fetchAreaCheck(minX, minY, w, h);
        startPoint.current = null;
        if (gridImage) {
          ctx.clearRect(0, 0, 1000, 1000);
          ctx.drawImage(gridImage, 0, 0, 1000, 1000);
          drawGrid(ctx);
          ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
          ctx.fillRect(minX, minY, w, h);
        }
      }
    };

    canvasElement.addEventListener('mousedown', handleMouseDown);
    return () => canvasElement.removeEventListener('mousedown', handleMouseDown);
  }, [gridImage, blocks]);
  
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasElement.getBoundingClientRect();
      const scaleX = 1000 / rect.width;
      const scaleY = 1000 / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);

      const currentBlock = blocks.find(
        (block) =>
          x >= block.x_start &&
          x <= block.x_start + block.width &&
          y >= block.y_start &&
          y <= block.y_start + block.height
      );

      if (currentBlock && currentBlock.image_url) {
        canvasElement.style.cursor = 'pointer';
        if (hoveredBlockRef.current?.id !== currentBlock.id) {
          hoveredBlockRef.current = currentBlock;
          showLargerImage(currentBlock.image_url, e);
        }
      } else {
        canvasElement.style.cursor = 'default';
        if (hoveredBlockRef.current) {
          hoveredBlockRef.current = null;
          hideLargerImage();
        }
      }
    };

    const handleMouseLeave = () => {
        canvasElement.style.cursor = 'default';
        if (hoveredBlockRef.current) {
            hoveredBlockRef.current = null;
            hideLargerImage();
        }
    };

    canvasElement.addEventListener('mousemove', handleMouseMove);
    canvasElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvasElement.removeEventListener('mousemove', handleMouseMove);
      canvasElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [blocks]);

  async function fetchAreaCheck(x: number, y: number, w: number, h: number) {
    if (isProcessing.current) return;
    isProcessing.current = true;
    try {
      const res = await fetch('/api/check-area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, w, h }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || 'This area has already been purchased');
        setTimeout(() => setErrorMessage(null), 5000);
        if (gridImage) {
            const ctx = canvasRef.current?.getContext('2d');
            if(ctx) {
                ctx.clearRect(0, 0, 1000, 1000);
                ctx.drawImage(gridImage, 0, 0, 1000, 1000);
                drawGrid(ctx);
            }
        }
        return;
      }
      setSelectedArea({ x, y, w, h });
      setIsModalOpen(true);
    } catch (error: any) {
      setErrorMessage('Error connecting to the server');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      isProcessing.current = false;
    }
  }

  async function handleBuy() {
    if (!publicKey || !sendTransaction || !selectedArea || !imageFile || !link) {
      setErrorMessage('Connect your wallet, upload an image, and provide a link');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setIsBuying(true);
    setErrorMessage(null);
    setPurchaseStatusMessage('Please approve the transaction in your wallet...');

    const pixels = selectedArea.w * selectedArea.h;
    try {
      const tx = await createUsdcTransfer(publicKey, pixels, referrerAddress);
      
      const signature = await sendTransaction(tx, connection);
      setPurchaseStatusMessage('Processing transaction on the blockchain...');
      
      await connection.confirmTransaction(signature, 'confirmed');
      
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('area', JSON.stringify(selectedArea));
      formData.append('wallet', publicKey.toString());
      formData.append('link', link);
      
      setPurchaseStatusMessage('Finalizing purchase...');
      const saveRes = await fetch('/api/save-purchase', { method: 'POST', body: formData });
      if (!saveRes.ok) {
        const text = await saveRes.text();
        throw new Error(`API Error: ${saveRes.status} - ${text.substring(0, 100)}...`);
      }
      
      const data = await saveRes.json();
      if (data.success) {
        setPurchaseStatusMessage('Purchase successful! Creating grid... This may take up to 40 seconds. The page will reload automatically. Thank you for your patience!');
        
        setTimeout(() => {
            window.location.reload();
        }, 40000); // 30 segundos de espera
      }
    } catch (error: any) {
      console.error('Full transaction error object:', error);
      
      let detailedError = `Transaction error: ${error.message}`;
      if (error.name === 'WalletSendTransactionError' || error.message.includes('rejected')) {
          detailedError = `Wallet Error: The transaction was rejected. Please ensure you have enough SOL for transaction fees and try again.`;
      }
      
      setErrorMessage(detailedError);
      // En caso de error, cerramos el modal y reseteamos el estado de compra
      setTimeout(() => {
        setIsModalOpen(false);
        setIsBuying(false);
        setPurchaseStatusMessage('');
        setErrorMessage(null);
      }, 6000);
    }
  }

  const showLargerImage = (imageUrl: string, event: MouseEvent) => {
    const popover = document.getElementById('popover');
    if (!popover || !imageUrl) return;

    const img = new Image();
    img.src = imageUrl;
    img.onerror = () => console.error('Error loading image:', imageUrl);
    img.onload = () => {
      const width = img.naturalWidth * 0.50;
      const height = img.naturalHeight * 0.50;
      popover.innerHTML = `<img src="${imageUrl}" alt="Enlarged image" style="width: ${width}px; height: ${height}px;" />`;
      popover.style.display = 'block';
      popover.style.left = `${event.clientX + 10}px`;
      popover.style.top = `${event.clientY + 10}px`;
    };
  };

  const hideLargerImage = () => {
    const popover = document.getElementById('popover');
    if (popover) {
      popover.style.display = 'none';
      popover.innerHTML = '';
    }
  };

  return (
    <div className="grid-container">
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={1000}
          height={1000}
          style={{ border: '1px solid black', imageRendering: 'pixelated' }}
        ></canvas>
      </div>
      {currentPixels > 0 && <p>Selecting {currentPixels} pixels</p>}
      {errorMessage && (
        <div className={errorMessage.includes('successful') ? 'success-notification' : 'error-notification'}>
          {errorMessage}
        </div>
      )}
      <div id="popover" className="popover"></div>
      {isModalOpen && selectedArea && (
        <div className="modal-overlay" onClick={() => !isBuying && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {isBuying ? (
              // Vista de estado de procesamiento
              <div className="modal-status-view">
                <Loader />
                <p className="status-message">{purchaseStatusMessage}</p>
              </div>
            ) : (
              // Vista de formulario de compra
              <>
                <h2>Confirm Purchase</h2>
                <p>Pixels selected: {selectedArea.w * selectedArea.h}</p>
                <p>Amount to pay: {selectedArea.w * selectedArea.h} USDC</p>
                <label htmlFor="image-upload-modal" style={{ display: 'block', margin: '10px 0' }}>
                  Upload the image for your pixel group (PNG/JPG):
                  <input
                    id="image-upload-modal"
                    type="file"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    title="Select an image for your pixel area"
                    accept="image/png, image/jpeg"
                  />
                </label>
                <label htmlFor="link-input" style={{ display: 'block', margin: '10px 0' }}>
                  Link for your pixel area:
                  <input
                    id="link-input"
                    className="link-input"
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    title="Enter the link for your pixel area"
                    placeholder="https://example.com"
                    required
                  />
                </label>
                <button onClick={handleBuy} disabled={!imageFile || !link}>
                  Purchase
                </button>
                <button onClick={() => setIsModalOpen(false)} style={{ marginLeft: '10px', background: 'gray' }}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GridInteractor;
