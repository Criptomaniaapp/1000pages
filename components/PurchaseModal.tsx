import { useState, ChangeEvent } from 'react';
import { PaymentElement } from '@stripe/react-stripe-js';

// Tipos para las props del componente
interface PurchaseModalProps {
  selection: { x: number; y: number; width: number; height: number };
  onClose: () => void;
  onPurchase: (link: string, imageBase64: string, imageFile: File) => Promise<void>;
  onInitiateStripe: (price: number, link: string, imageFile: File) => Promise<void>;
  isLoading: boolean;
  paymentMethod: 'solana' | 'stripe' | null;
  clientSecret: string | null;
  // --- AÑADE ESTA LÍNEA ---
  onSetPaymentMethod: (method: 'solana' | 'stripe') => void;
}

const PurchaseModal = ({
  selection,
  onClose,
  onPurchase,
  onInitiateStripe,
  isLoading,
  paymentMethod,
  onSetPaymentMethod, // Recibimos la nueva prop
}: PurchaseModalProps) => {
  const [link, setLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState('');
  const [error, setError] = useState<string | null>(null);

  const price = selection.width * selection.height;

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
        setError('Invalid file type. Please use PNG, JPG, or GIF.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('File is too large. Maximum size is 2MB.');
        return;
      }
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        const base64String = (reader.result as string).split(',')[1];
        setImageBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link || (!imageFile && paymentMethod !== 'stripe')) {
      setError('Please provide a link and an image.');
      return;
    }
    setError(null);
    if (paymentMethod === 'solana' && imageFile) {
      await onPurchase(link, imageBase64, imageFile);
    } else if (paymentMethod === 'stripe' && imageFile) {
      await onPurchase(link, imageBase64, imageFile);
    }
  };

  const handleInitiateStripe = async () => {
    if (!link || !imageFile) {
      setError('Please provide a link and an image first.');
      return;
    }
    await onInitiateStripe(price, link, imageFile);
  };
  
  const handleSolanaButtonClick = () => {
    if (!link || !imageFile) {
      setError('Please provide a link and an image.');
      return;
    }
    // --- CORRECCIÓN CLAVE AQUÍ ---
    onSetPaymentMethod('solana'); // Llama a la función del padre
    // Creamos un evento falso para que handleSubmit se dispare justo después
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  const renderStripeView = () => (
    <div className="p-6">
      <h3 className="text-lg font-medium text-white mb-4">Confirm Your Payment</h3>
      <p className="text-sm text-gray-400 mb-4">
        Securely complete your payment for ${price}.00 with Stripe.
      </p>
      <form onSubmit={handleSubmit}>
        <PaymentElement />
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : `Pay $${price}.00`}
          </button>
        </div>
      </form>
    </div>
  );

  const renderInitialView = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-white mb-2">Buy Your Digital Space</h2>
      <p className="text-gray-400 mb-4">
        You are purchasing a {selection.width}x{selection.height} block area for ${price}.00.
      </p>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-4">
          <div>
            <label htmlFor="link" className="block text-sm font-medium text-gray-300 mb-1">
              Link URL
            </label>
            <input
              type="url"
              id="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://my-awesome-project.com"
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-1">
              Image (PNG, JPG, GIF - Max 2MB)
            </label>
            <input
              type="file"
              id="image"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
              required
            />
            {preview && (
              <div className="mt-4 border border-gray-600 rounded-md p-2">
                <img src={preview} alt="Image preview" className="max-h-32 mx-auto" />
              </div>
            )}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        <div className="mt-6 border-t border-gray-700 pt-4">
          <p className="text-center font-semibold text-white mb-3">Choose Payment Method</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSolanaButtonClick} // Usar la nueva función
              disabled={isLoading || !link || !imageFile}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed"
            >
              Pay with Solana
            </button>
            <button
              type="button"
              onClick={handleInitiateStripe}
              disabled={isLoading || !link || !imageFile}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed"
            >
              Pay with Card (Stripe)
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
        <div className="relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">&times;</button>
          {paymentMethod === 'stripe' ? renderStripeView() : renderInitialView()}
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;