export type BackendMode = 'supabase' | 'mysql_api';

const normalizeMode = (value: string): BackendMode => {
  const mode = value.trim().toLowerCase();
  return mode === 'mysql_api' ? 'mysql_api' : 'supabase';
};

export const BACKEND_MODE: BackendMode = normalizeMode(
  String(import.meta.env.VITE_BACKEND_MODE || 'supabase')
);

export const MYSQL_API_BASE_URL = String(import.meta.env.VITE_MYSQL_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '');
