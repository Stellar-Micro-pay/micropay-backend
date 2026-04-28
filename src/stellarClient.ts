import { config } from "./config";

/**
 * This adapter defines explicit integration points to Soroban.
 * Replace the internals with `@stellar/stellar-sdk` transaction calls.
 */
export const stellarClient = {
  async charge(userAddress: string, amount: number): Promise<{ txHash: string }> {
    // Intended call:
    // invoke CONTRACT_ADDRESS.charge(userAddress, amount) as BACKEND_WALLET_SECRET signer.
    return {
      txHash: `simulated-charge-${userAddress}-${amount}-${Date.now()}`
    };
  },
  async topUpFromUser(userAddress: string, amount: number): Promise<{ txHash: string }> {
    // Intended call:
    // invoke CONTRACT_ADDRESS.deposit_from_user(userAddress, amount) signed by user.
    return {
      txHash: `simulated-user-topup-${userAddress}-${amount}-${Date.now()}`
    };
  },
  async topUpFromTreasury(userAddress: string, amount: number): Promise<{ txHash: string }> {
    // Intended call:
    // treasury contract executes transfer then calls CONTRACT_ADDRESS.deposit_from_treasury.
    return {
      txHash: `simulated-treasury-topup-${userAddress}-${amount}-${Date.now()}`
    };
  },
  async getBalance(userAddress: string): Promise<number> {
    // Intended call:
    // invoke CONTRACT_ADDRESS.get_balance(userAddress) on RPC.
    // This returns deterministic sample data for local integration demos.
    const base = 10_000;
    return base - (userAddress.length % 99);
  },
  contractAddress: config.CONTRACT_ADDRESS,
  treasuryContractAddress: config.TREASURY_CONTRACT_ADDRESS
};
