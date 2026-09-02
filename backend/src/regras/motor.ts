import { supabase } from '../supabase/client.js';
import { consultarHorariosDisponiveis } from '../tools/consultarHorarios.js';
import { criarAgendamento } from '../tools/criarAgendamento.js';
import { cancelarAgendamento } from '../tools/cancelarAgendamento.js';
import { buscarProximoAgendamento } from '../tools/buscarAgendamentoCliente.js';
import { BARBEARIA_PADRAO } from '../config/barbearia.js';

async function montarMensagemMenu(barbeariaId: string): Promise<string> {
  const { data: barbearia } = await supabase
    .from('barbearias')
    .select('nome')
    .eq('id', barbeariaId)
    .single();

  return `Olá! Aqui é o Bento, assistente de testes da ${barbearia?.nome ?? 'barbearia'}
(modo regras simples, sem IA ainda)

Comandos:
- *servicos* — ver serviços e preços
- *horarios* ou *horarios amanha* — ver horários livres
- *agendar DD/MM HH:MM* — agendar um corte (ex: agendar 10/09 14:30)
- *cancelar* — cancelar seu próximo agendamento`;
}

function formatarPrecoReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 'YYYY-MM-DD' em horário local — não usar toISOString() aqui, que converte pra UTC
// e pode virar o dia errado dependendo da hora local (mesma convenção de consultarHorarios.ts).
function formatarDataLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// 'DD/MM' -> próxima ocorrência dessa data (ano atual, ou o próximo ano se já passou).
function proximaDataParaDiaMes(diaMesTexto: string): Date {
  const [dia, mes] = diaMesTexto.split('/').map(Number);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  let data = new Date(hoje.getFullYear(), mes - 1, dia);
  if (data.getTime() < hoje.getTime()) {
    data = new Date(hoje.getFullYear() + 1, mes - 1, dia);
  }
  return data;
}

export async function decidirResposta(telefone: string, textoOriginal: string): Promise<string> {
  const texto = textoOriginal.trim().toLowerCase();
  const { barbeariaId, barbeiroId, servicoPadraoId } = BARBEARIA_PADRAO;

  if (/^servi[cç]os$/.test(texto)) {
    const { data: servicos } = await supabase
      .from('servicos')
      .select('nome, duracao_minutos, preco_centavos')
      .eq('barbearia_id', barbeariaId)
      .eq('ativo', true);

    if (!servicos || servicos.length === 0) return 'Nenhum serviço cadastrado ainda.';

    return servicos
      .map((s) => `• ${s.nome} — ${s.duracao_minutos}min — ${formatarPrecoReais(s.preco_centavos)}`)
      .join('\n');
  }

  const matchHorarios = texto.match(/^hor[áa]rios?(?:\s+(hoje|amanh[ãa]))?$/);
  if (matchHorarios) {
    const ehAmanha = matchHorarios[1]?.startsWith('amanh') ?? false;
    const dataAlvo = new Date();
    if (ehAmanha) dataAlvo.setDate(dataAlvo.getDate() + 1);
    const dataISO = formatarDataLocal(dataAlvo);

    const slots = await consultarHorariosDisponiveis({
      barbeiroId,
      servicoId: servicoPadraoId,
      data: dataISO,
    });

    if (slots.length === 0) {
      return `Sem horários livres pra ${ehAmanha ? 'amanhã' : 'hoje'}. Tente "horarios amanha" ou peça outro dia direto com "agendar".`;
    }
    return `Horários livres pra ${ehAmanha ? 'amanhã' : 'hoje'} (${dataISO}):\n${slots.join(', ')}`;
  }

  const matchAgendar = texto.match(/^agendar\s+(\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2})$/);
  if (matchAgendar) {
    const [, diaMes, hora] = matchAgendar;
    const dataAlvo = proximaDataParaDiaMes(diaMes);
    const [h, m] = hora.split(':').map(Number);
    dataAlvo.setHours(h, m, 0, 0);

    const resultado = await criarAgendamento({
      barbeariaId,
      barbeiroId,
      servicoId: servicoPadraoId,
      clienteTelefone: telefone,
      inicioISO: dataAlvo.toISOString(),
    });

    if (resultado.ok) {
      return `Agendado! Corte no dia ${diaMes} às ${hora}. Pra cancelar, mande "cancelar".`;
    }
    if (resultado.motivo === 'horario_ocupado') {
      return 'Esse horário já está ocupado. Mande "horarios" pra ver os livres.';
    }
    return 'Não consegui agendar — serviço não encontrado. Avise a barbearia.';
  }

  if (/^cancelar$/.test(texto)) {
    const proximo = await buscarProximoAgendamento(barbeariaId, telefone);
    if (!proximo) return 'Você não tem nenhum agendamento futuro pra cancelar.';

    await cancelarAgendamento(proximo.id);
    return 'Agendamento cancelado.';
  }

  return montarMensagemMenu(barbeariaId);
}
