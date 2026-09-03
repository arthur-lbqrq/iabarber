import { supabase } from './supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

export class ErroApi extends Error {}

export async function chamarApi<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ErroApi('Sessão expirada — atualize a página.');

  const resposta = await fetch(`${BACKEND_URL}${caminho}`, {
    ...opcoes,
    headers: {
      ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...opcoes.headers,
    },
  });

  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new ErroApi(corpo.erro ?? `status ${resposta.status}`);
  }
  return corpo as T;
}
