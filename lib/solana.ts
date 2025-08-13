import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createTransferInstruction, // Importar directamente para evitar 'await import'
} from '@solana/spl-token';
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
} from '@solana/web3.js';

// --- CONSTANTES ---
export const SHOP_WALLET_ADDRESS = new PublicKey(
  '14PujRChawVVUR3TDo1q327dkDvFdAFZ4HfMMAurxaY' // Reemplaza esto con tu dirección de wallet de Solana
);
const USDC_MINT_ADDRESS = new PublicKey(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // Dirección de USDC en Mainnet
);
const REFERRER_FEE_BPS = 2000; // 20% en basis points

// --- FUNCIÓN PARA CREAR LA TRANSACCIÓN ---
export async function makeSolanaTransaction(
  buyer: PublicKey,
  selection: { x: number; y: number; width: number; height: number },
  referrer?: PublicKey
): Promise<{ transaction: Transaction; referrer?: PublicKey }> {
  const connection = new Connection(clusterApiUrl('mainnet-beta'));
  const price = selection.width * selection.height;
  const fee = referrer ? price * (REFERRER_FEE_BPS / 10000) : 0;
  const shopAmount = price - fee;

  const buyerUSDCTokenAccount = await getAssociatedTokenAddress(
    USDC_MINT_ADDRESS,
    buyer
  );

  const transaction = new Transaction();

  const buyerAccountInfo = await connection.getAccountInfo(
    buyerUSDCTokenAccount
  );
  if (!buyerAccountInfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        buyer,
        buyerUSDCTokenAccount,
        buyer,
        USDC_MINT_ADDRESS
      )
    );
  }

  transaction.add(
    createTransferInstruction(
      buyerUSDCTokenAccount,
      await getAssociatedTokenAddress(USDC_MINT_ADDRESS, SHOP_WALLET_ADDRESS),
      buyer,
      shopAmount * 1_000_000
    )
  );

  if (referrer && fee > 0) {
    transaction.add(
      createTransferInstruction(
        buyerUSDCTokenAccount,
        await getAssociatedTokenAddress(USDC_MINT_ADDRESS, referrer),
        buyer,
        fee * 1_000_000
      )
    );
  }

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = buyer;

  return { transaction, referrer };
}

// --- FUNCIÓN DE VERIFICACIÓN (CORREGIDA) ---
export async function verifySignature(
  signature: string,
  buyer: PublicKey,
  price: number,
  referrer?: PublicKey
): Promise<boolean> {
  const connection = new Connection(clusterApiUrl('mainnet-beta'));
  const tx = await connection.getParsedTransaction(signature, 'confirmed');

  if (!tx) {
    console.error('Transaction not found.');
    return false;
  }

  const fee = referrer ? price * (REFERRER_FEE_BPS / 10000) : 0;
  const shopAmount = (price - fee) * 1_000_000;
  const referrerAmount = fee * 1_000_000;

  const tokenTransfers = tx.meta?.innerInstructions
    ?.flatMap((i) => i.instructions)
    .filter(
      (ix) =>
        'parsed' in ix &&
        ix.program === 'spl-token' &&
        ix.parsed.type === 'transfer'
    )
    .map((ix: any) => ix.parsed.info);

  if (!tokenTransfers || tokenTransfers.length === 0) {
    console.error('No token transfers found in transaction.');
    return false;
  }

  // --- CORRECCIÓN CLAVE AQUÍ ---
  // Para usar await dentro de .some(), debemos manejar las promesas.
  // La forma más limpia es usar un bucle `for...of` en lugar de `.some`.

  let shopPaymentVerified = false;
  const buyerTokenAddress = (await getAssociatedTokenAddress(USDC_MINT_ADDRESS, buyer)).toBase58();
  const shopTokenAddress = (await getAssociatedTokenAddress(USDC_MINT_ADDRESS, SHOP_WALLET_ADDRESS)).toBase58();

  for (const t of tokenTransfers) {
    if (
      t.source === buyerTokenAddress &&
      t.destination === shopTokenAddress &&
      parseInt(t.amount, 10) >= shopAmount
    ) {
      shopPaymentVerified = true;
      break; // Salimos del bucle una vez que lo encontramos
    }
  }

  if (!shopPaymentVerified) {
    console.error('Shop payment verification failed.');
    return false;
  }

  if (referrer) {
    let referrerPaymentVerified = false;
    const referrerTokenAddress = (await getAssociatedTokenAddress(USDC_MINT_ADDRESS, referrer)).toBase58();
    for (const t of tokenTransfers) {
      if (
        t.destination === referrerTokenAddress &&
        parseInt(t.amount, 10) >= referrerAmount
      ) {
        referrerPaymentVerified = true;
        break;
      }
    }
    if (!referrerPaymentVerified) {
      console.error('Referrer payment verification failed.');
      return false;
    }
  }

  console.log('Signature verified successfully!');
  return true;
}