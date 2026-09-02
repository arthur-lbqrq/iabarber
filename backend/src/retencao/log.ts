import { supabase } from '../supabase/client.js';

// Não manda lembrete de novo pro mesmo cliente se já mandou um nos últimos N dias —
// é o que evita duplicar disparo em execuções seguidas do cron.
const COOLDOWN_DIAS = 14;

export async function jaEnviouRecentemente(clienteId: string): Promise<boolean> {
  const desde = new Date(Date.now() - COOLDOWN_DIAS * 86_400_000).toISOString();
  const { data } = await supabase
    .from('mensagens_retencao_enviadas')
    .select('id')
    .eq('cliente_id', clienteId)
    .gte('enviado_em', desde)
    .limit(1)
    .maybeSingle();
  return data !== null;
}

export async function registrarEnvio(barbeariaId: string, clienteId: string): Promise<void> {
  await supabase.from('mensagens_retencao_enviadas').insert({ barbearia_id: barbeariaId, cliente_id: clienteId });
}
