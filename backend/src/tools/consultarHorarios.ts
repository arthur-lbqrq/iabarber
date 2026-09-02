import { supabase } from '../supabase/client.js';

const INTERVALO_SLOTS_MINUTOS = 15;

interface ConsultarHorariosParams {
  barbeiroId: string;
  servicoId: string;
  data: string; // 'YYYY-MM-DD'
}

interface Agendamento {
  inicio: string;
  fim: string;
}

// Sem coluna de fuso horário na barbearia ainda, as datas/horas são tratadas no
// fuso horário local do processo Node — revisar quando houver barbearia fora do Brasil.
export async function consultarHorariosDisponiveis({
  barbeiroId,
  servicoId,
  data,
}: ConsultarHorariosParams): Promise<string[]> {
  const { data: servico, error: erroServico } = await supabase
    .from('servicos')
    .select('duracao_minutos')
    .eq('id', servicoId)
    .single();
  if (erroServico || !servico) {
    throw new Error(`Serviço não encontrado: ${servicoId}`);
  }

  const diaSemana = new Date(`${data}T00:00:00`).getDay();

  const { data: janelas, error: erroJanelas } = await supabase
    .from('horarios_disponiveis')
    .select('hora_inicio, hora_fim')
    .eq('barbeiro_id', barbeiroId)
    .eq('dia_semana', diaSemana);
  if (erroJanelas) throw erroJanelas;
  if (!janelas || janelas.length === 0) return [];

  const inicioDoDia = new Date(`${data}T00:00:00`);
  const fimDoDia = new Date(`${data}T23:59:59`);

  const { data: agendamentos, error: erroAgendamentos } = await supabase
    .from('agendamentos')
    .select('inicio, fim')
    .eq('barbeiro_id', barbeiroId)
    .eq('status', 'confirmado')
    .gte('inicio', inicioDoDia.toISOString())
    .lte('inicio', fimDoDia.toISOString());
  if (erroAgendamentos) throw erroAgendamentos;

  const ocupados = (agendamentos ?? []) as Agendamento[];
  const duracaoMs = servico.duracao_minutos * 60_000;
  const passoMs = INTERVALO_SLOTS_MINUTOS * 60_000;

  const slotsDisponiveis: string[] = [];

  for (const janela of janelas) {
    const inicioJanela = new Date(`${data}T${janela.hora_inicio}`);
    const fimJanela = new Date(`${data}T${janela.hora_fim}`);

    for (
      let inicioSlot = inicioJanela;
      inicioSlot.getTime() + duracaoMs <= fimJanela.getTime();
      inicioSlot = new Date(inicioSlot.getTime() + passoMs)
    ) {
      const fimSlot = new Date(inicioSlot.getTime() + duracaoMs);

      const colide = ocupados.some((ag) => {
        const agInicio = new Date(ag.inicio).getTime();
        const agFim = new Date(ag.fim).getTime();
        return inicioSlot.getTime() < agFim && fimSlot.getTime() > agInicio;
      });

      if (!colide) {
        slotsDisponiveis.push(
          inicioSlot.toTimeString().slice(0, 5), // 'HH:MM'
        );
      }
    }
  }

  return slotsDisponiveis;
}
