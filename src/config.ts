import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(8080),
  CONTRACT_ADDRESS: z.string().min(10),
  TREASURY_CONTRACT_ADDRESS: z.string().min(10),
  BACKEND_WALLET_PUBLIC: z.string().min(10),
  BACKEND_WALLET_SECRET: z.string().min(10),
  NETWORK_PASSPHRASE: z.string().min(5),
  RPC_URL: z.string().url(),
  REQUEST_COST_STROOPS: z.coerce.number().int().positive().default(100)
});

export const config = ConfigSchema.parse(process.env);
