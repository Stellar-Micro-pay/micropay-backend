import crypto from "crypto";

export type FundingSource = "treasury" | "user";

type ApiKeyRecord = {
  apiKey: string;
  userAddress: string;
  source: FundingSource;
  createdAt: string;
  requests: number;
  totalCharged: number;
};

const keysByValue = new Map<string, ApiKeyRecord>();
const keysByUser = new Map<string, ApiKeyRecord>();

export const store = {
  createApiKey(userAddress: string, source: FundingSource): ApiKeyRecord {
    const apiKey = `mp_${crypto.randomBytes(24).toString("hex")}`;
    const record: ApiKeyRecord = {
      apiKey,
      userAddress,
      source,
      createdAt: new Date().toISOString(),
      requests: 0,
      totalCharged: 0
    };
    keysByValue.set(apiKey, record);
    keysByUser.set(userAddress, record);
    return record;
  },
  getByApiKey(apiKey: string): ApiKeyRecord | undefined {
    return keysByValue.get(apiKey);
  },
  getByUser(userAddress: string): ApiKeyRecord | undefined {
    return keysByUser.get(userAddress);
  },
  recordCharge(apiKey: string, amount: number): ApiKeyRecord | undefined {
    const record = keysByValue.get(apiKey);
    if (!record) return undefined;
    record.requests += 1;
    record.totalCharged += amount;
    return record;
  }
};
