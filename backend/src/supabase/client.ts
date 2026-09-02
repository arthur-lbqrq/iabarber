import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { env } from '../config/env.js';

// Service role key: o backend bypassa RLS de propósito, porque ele mesmo resolve
// a barbearia certa a partir do número de WhatsApp de destino antes de consultar
// ou gravar qualquer coisa. RLS aqui protege o painel web (login do barbeiro),
// não este caminho.
//
// Node 20 não tem WebSocket nativo, e o cliente realtime do supabase-js exige um
// mesmo sem usarmos realtime — por isso o transport explícito via pacote `ws`.
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false },
  // cast: os tipos do pacote `ws` não batem exatamente com o que o supabase-js espera
  realtime: { transport: WebSocket as never },
});
