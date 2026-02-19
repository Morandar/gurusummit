import { MYSQL_API_BASE_URL } from '@/lib/backendConfig';

export interface MySqlAuthUser {
  id: string;
  personalNumber: string;
  type: 'participant' | 'booth' | 'admin';
  firstName?: string;
  lastName?: string;
  position?: string;
  boothId?: number | string;
}

interface MySqlAuthResponse {
  success: boolean;
  user?: MySqlAuthUser;
  message?: string;
}

export const mysqlApiLogin = async (identifier: string, password: string): Promise<MySqlAuthUser | null> => {
  if (!MYSQL_API_BASE_URL) {
    return null;
  }

  try {
    const response = await fetch(`${MYSQL_API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as MySqlAuthResponse;
    if (!payload.success || !payload.user) {
      return null;
    }

    return payload.user;
  } catch {
    return null;
  }
};
