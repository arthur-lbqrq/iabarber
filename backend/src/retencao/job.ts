import { supabase } from '../supabase/client.js';
import { BARBEARIA_PADRAO } from '../config/barbearia.js';
import { buscarAtendimentosRealizados, buscarClientesComAgendamentoFuturo } from '../indicadores/dados.js';
import { calcularRecompraPorCliente } from '../indicadores/recompra.js';
import { precisaLembreteDeRetencao } from './regra.js';
import { formatarMensagemRetencao } from './mensagem.js';
import { jaEnviouRecentemente, registrarEnvio } from './log.js';
import { enviarMensagemTexto } from '../webhook/evolutionClient.js';

// Duas travas de rate limiting, propositalmente conservadoras — a Evolution API não é
// oficial, e um pico de mensagens saindo de uma vez é o tipo de padrão que aumenta
// risco de bloqueio do número: manda no máximo N por execução, com um intervalo entre
// cada uma (ritmo mais parecido com alguém digitando, não um disparo em massa).
const LIMITE_ENVIOS_POR_EXECUCAO = 20;
const INTERVALO_ENTRE_ENVIOS_MS = 4000;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ResultadoJobRetencao {
  candidatos: number;
  enviados: number;
  puladosPorCooldown: number;
}

export async function rodarJobRetencao(): Promise<ResultadoJobRetencao> {
  const barbeariaId = BARBEARIA_PADRAO.barbeariaId;

  const { data: barbearia } = await supabase.from('barbearias').select('nome').eq('id', barbeariaId).single();
  const nomeBarbearia = barbearia?.nome ?? 'barbearia';

  const [atendimentos, comFuturo] = await Promise.all([
    buscarAtendimentosRealizados(barbeariaId),
    buscarClientesComAgendamentoFuturo(barbeariaId),
  ]);

  const status = calcularRecompraPorCliente(atendimentos);
  const candidatos = status.filter((s) => precisaLembreteDeRetencao(s) && !comFuturo.has(s.clienteId));

  let enviados = 0;
  let puladosPorCooldown = 0;

  for (const candidato of candidatos.slice(0, LIMITE_ENVIOS_POR_EXECUCAO)) {
    if (await jaEnviouRecentemente(candidato.clienteId)) {
      puladosPorCooldown += 1;
      continue;
    }

    const { data: cliente } = await supabase
      .from('clientes')
      .select('nome, telefone')
      .eq('id', candidato.clienteId)
      .single();
    if (!cliente) continue;

    const texto = formatarMensagemRetencao(cliente.nome, nomeBarbearia);

    try {
      await enviarMensagemTexto(cliente.telefone, texto);
      await registrarEnvio(barbeariaId, candidato.clienteId);
      enviados += 1;
    } catch (erro) {
      console.error(`[retencao] falha ao enviar pra ${cliente.telefone}:`, erro);
    }

    await esperar(INTERVALO_ENTRE_ENVIOS_MS);
  }

  return { candidatos: candidatos.length, enviados, puladosPorCooldown };
}
