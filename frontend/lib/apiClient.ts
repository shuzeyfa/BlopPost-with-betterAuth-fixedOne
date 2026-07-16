import { authClient } from "./authClient";

// Returns an Authorization header with the Better Auth session token.
// The Express backend validates this token against the shared MongoDB
// "session" collection (see requireAuth in backend/server.js).
export async function authHeader(): Promise<Record<string, string>> {
  const session = await authClient.getSession();
  const token = session?.data?.session?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
