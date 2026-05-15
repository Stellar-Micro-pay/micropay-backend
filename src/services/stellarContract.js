/**
 * stellarContract.js
 *
 * Wraps all Stellar / Soroban smart contract interactions.
 *
 * In testnet / production this calls the real deployed micropay contract.
 * In development (MOCK_CONTRACT=true) it uses an in-memory balance store so you
 * can run the backend without a live Stellar node.
 */

const {
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  Address,
} = require("@stellar/stellar-sdk");
const logger = require("./logger");

const MOCK = process.env.MOCK_CONTRACT === "true" || !process.env.ADMIN_SECRET_KEY;

// ─── Mock store (dev only) ────────────────────────────────────────────────────
const mockBalances = new Map(); // walletAddress → stroops

function mockDeposit(walletAddress, amount) {
  const prev = mockBalances.get(walletAddress) || 0;
  mockBalances.set(walletAddress, prev + amount);
  logger.debug(`[MOCK] deposit ${walletAddress} +${amount}`);
}

function mockCharge(walletAddress, amount) {
  const balance = mockBalances.get(walletAddress) || 0;
  if (balance < amount) throw new Error("insufficient balance");
  mockBalances.set(walletAddress, balance - amount);
  logger.debug(`[MOCK] charge  ${walletAddress} -${amount}`);
  return "mock-tx-" + Date.now();
}

function mockBalance(walletAddress) {
  return mockBalances.get(walletAddress) || 0;
}

// ─── Stellar RPC helpers ──────────────────────────────────────────────────────
function getServer() {
  return new SorobanRpc.Server(
    process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org"
  );
}

function getNetwork() {
  return process.env.STELLAR_NETWORK === "mainnet"
    ? Networks.PUBLIC
    : Networks.TESTNET;
}

async function invokeContract(method, args) {
  const adminKeypair = Keypair.fromSecret(process.env.ADMIN_SECRET_KEY);
  const server       = getServer();
  const contract     = new Contract(process.env.MICROPAY_CONTRACT_ADDRESS);
  const account      = await server.getAccount(adminKeypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetwork(),
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  preparedTx.sign(adminKeypair);

  const sendResult = await server.sendTransaction(preparedTx);
  if (sendResult.status === "ERROR") {
    throw new Error(`Submit failed: ${sendResult.errorResult}`);
  }

  // Poll until confirmed
  let getResult;
  do {
    await new Promise((r) => setTimeout(r, 2000));
    getResult = await server.getTransaction(sendResult.hash);
  } while (getResult.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND);

  if (getResult.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed: ${getResult.status}`);
  }

  return { txHash: sendResult.hash, result: getResult.returnValue };
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function depositFromUser(walletAddress, amountStroops) {
  if (MOCK) { mockDeposit(walletAddress, amountStroops); return "mock"; }
  const args = [
    new Address(walletAddress).toScVal(),
    nativeToScVal(amountStroops, { type: "i128" }),
  ];
  const { txHash } = await invokeContract("deposit_from_user", args);
  return txHash;
}

async function chargeUser(walletAddress, amountStroops) {
  if (MOCK) return mockCharge(walletAddress, amountStroops);
  const args = [
    new Address(walletAddress).toScVal(),
    nativeToScVal(amountStroops, { type: "i128" }),
  ];
  const { txHash } = await invokeContract("charge", args);
  return txHash;
}

async function getBalance(walletAddress) {
  if (MOCK) return mockBalance(walletAddress);
  const server   = getServer();
  const contract = new Contract(process.env.MICROPAY_CONTRACT_ADDRESS);
  const adminKey  = Keypair.fromSecret(process.env.ADMIN_SECRET_KEY);
  const account   = await server.getAccount(adminKey.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetwork(),
  })
    .addOperation(
      contract.call(
        "get_balance",
        new Address(walletAddress).toScVal()
      )
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Balance query failed: ${sim.error}`);
  }

  // Return value is i128 scval
  const raw = sim.result?.retval;
  if (!raw) return 0;
  const scInt = raw.value();
  return Number(scInt);
}

module.exports = { depositFromUser, chargeUser, getBalance };
