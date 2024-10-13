import crypto from "node:crypto";

const hashToken = (token: string | number): string => {
  return crypto.createHash("sha256").update(token.toString()).digest("hex");
};

export default hashToken;
