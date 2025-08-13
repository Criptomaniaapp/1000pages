// lib/solana.ts
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';

// --- CONFIGURACIÓN ---
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
if (!SOLANA_RPC_URL) {
  throw new Error('NEXT_PUBLIC_SOLANA_RPC_URL not set in .env');
}
export const connection = new Connection(SOLANA_RPC_URL);

const RECEIVER_WALLET_STR = process.env.NEXT_PUBLIC_RECEIVER_WALLET;
if (!RECEIVER_WALLET_STR) {
  throw new Error('NEXT_PUBLIC_RECEIVER_WALLET not set in .env');
}
const recipientPublicKey = new PublicKey(RECEIVER_WALLET_STR);

const USDC_MINT_STR = process.env.NEXT_PUBLIC_USDC_MINT;
if (!USDC_MINT_STR) {
  throw new Error('NEXT_PUBLIC_USDC_MINT not set in .env');
}
const usdcMintPublicKey = new PublicKey(USDC_MINT_STR);

/**
 * Crea una transacción para transferir USDC, dividiendo el pago si se proporciona un referente.
 * @param ownerPublicKey - La PublicKey del comprador.
 * @param amount - La cantidad TOTAL de USDC a transferir (ej: 25).
 * @param referralWalletAddress - La dirección de la billetera del referente (opcional).
 * @returns Una VersionedTransaction lista para ser firmada.
 */
export async function createUsdcTransfer(
  ownerPublicKey: PublicKey,
  amount: number,
  referralWalletAddress?: string | null
): Promise<VersionedTransaction> {
  try {
    const instructions = [];
    const ownerTokenAccountAddress = await getAssociatedTokenAddress(usdcMintPublicKey, ownerPublicKey);
    const recipientTokenAccountAddress = await getAssociatedTokenAddress(usdcMintPublicKey, recipientPublicKey);

    // Comprobar si las cuentas de token (ATA) existen
    const ownerAtaInfo = await connection.getAccountInfo(ownerTokenAccountAddress);
    if (!ownerAtaInfo) {
      instructions.push(createAssociatedTokenAccountInstruction(ownerPublicKey, ownerTokenAccountAddress, ownerPublicKey, usdcMintPublicKey));
    }

    const recipientAtaInfo = await connection.getAccountInfo(recipientTokenAccountAddress);
    if (!recipientAtaInfo) {
      instructions.push(createAssociatedTokenAccountInstruction(ownerPublicKey, recipientTokenAccountAddress, recipientPublicKey, usdcMintPublicKey));
    }

    // Lógica de división de pagos
    if (referralWalletAddress) {
      const referrerPublicKey = new PublicKey(referralWalletAddress);
      const referrerTokenAccountAddress = await getAssociatedTokenAddress(usdcMintPublicKey, referrerPublicKey);
      
      const referrerAtaInfo = await connection.getAccountInfo(referrerTokenAccountAddress);
      if (!referrerAtaInfo) {
        instructions.push(createAssociatedTokenAccountInstruction(ownerPublicKey, referrerTokenAccountAddress, referrerPublicKey, usdcMintPublicKey));
      }

      // Calcular los montos
      const mainAmount = amount * 0.80; // 80% para el destinatario principal
      const referralAmount = amount * 0.20; // 20% para el referente

      // Instrucción para el destinatario principal
      instructions.push(
        createTransferInstruction(
          ownerTokenAccountAddress,
          recipientTokenAccountAddress,
          ownerPublicKey,
          mainAmount * 1_000_000
        )
      );

      // Instrucción para el referente
      instructions.push(
        createTransferInstruction(
          ownerTokenAccountAddress,
          referrerTokenAccountAddress,
          ownerPublicKey,
          referralAmount * 1_000_000
        )
      );
    } else {
      // Lógica sin referente (100% al destinatario principal)
      instructions.push(
        createTransferInstruction(
          ownerTokenAccountAddress,
          recipientTokenAccountAddress,
          ownerPublicKey,
          amount * 1_000_000
        )
      );
    }

    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    const messageV0 = new TransactionMessage({
      payerKey: ownerPublicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    return transaction;

  } catch (error) {
    console.error('Error creating USDC transfer transaction:', error);
    throw new Error('Could not create the transaction.');
  }
}
