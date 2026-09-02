import { supabase } from '../supabase/client.js';
import { enviarMensagemTexto } from '../webhook/evolutionClient.js';

interface FalarComAtendenteParams {
  barbeariaId: string;
  clienteTelefone: string;
  motivo?: string;
}

// Extraída como função pura pra ser testável sem precisar mockar Supabase/Evolution API.
export function formatarMensagemAtendente(clienteTelefone: string, motivo?: string): string {
  return motivo
    ? `Bento: cliente ${clienteTelefone} pediu falar com atendente — "${motivo}"`
    : `Bento: cliente ${clienteTelefone} pediu falar com um atendente.`;
}

export async function falarComAtendente({
  barbeariaId,
  clienteTelefone,
  motivo,
}: FalarComAtendenteParams): Promise<{ ok: true; atendentesAvisados: number }> {
  const { data: barbeiros } = await supabase
    .from('barbeiros')
    .select('telefone')
    .eq('barbearia_id', barbeariaId)
    .eq('ativo', true)
    .not('telefone', 'is', null);

  const destinatarios = (barbeiros ?? [])
    .map((b) => b.telefone)
    .filter((telefone): telefone is string => Boolean(telefone));

  const texto = formatarMensagemAtendente(clienteTelefone, motivo);

  const resultados = await Promise.allSettled(destinatarios.map((numero) => enviarMensagemTexto(numero, texto)));
  const atendentesAvisados = resultados.filter((r) => r.status === 'fulfilled').length;

  return { ok: true, atendentesAvisados };
}
