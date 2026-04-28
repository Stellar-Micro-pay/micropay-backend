import { NextFunction, Request, Response } from "express";
import { store } from "./store";

export type AuthedRequest = Request & {
  auth?: {
    apiKey: string;
    userAddress: string;
  };
};

export function requireApiKey(req: AuthedRequest, res: Response, next: NextFunction): void {
  const apiKey = req.header("x-api-key");
  if (!apiKey) {
    res.status(401).json({ error: "missing_api_key" });
    return;
  }
  const record = store.getByApiKey(apiKey);
  if (!record) {
    res.status(401).json({ error: "invalid_api_key" });
    return;
  }
  req.auth = { apiKey: record.apiKey, userAddress: record.userAddress };
  next();
}
