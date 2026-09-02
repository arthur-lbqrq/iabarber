import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { NOMES_DIA_SEMANA, type AgendamentoDoDia, type Barbeiro } from '../lib/types';
import { NovoAgendamentoModal } from '../components/NovoAgendamentoModal';

function inicioDoDia(): Date {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  return data;
}

function fimDoDia(): Date {
  const data = new Date();
  data.setHours(23, 59, 59, 999);
  return data;
}

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarDataCabecalho(): string {
  const agora = new Date();
  const diaSemana = NOMES_DIA_SEMANA[agora.getDay()];
  const mes = agora.toLocaleDateString('pt-BR', { month: 'long' });
  return `${diaSemana}, ${agora.getDate()} de ${mes}`;
}

// "Confirmado"/"Concluído" usam verde (estado positivo/resolvido); "Cancelado" e
// "Não compareceu" usam terracota. Não existe estado "Aguardando" no nosso modelo —
// todo agendamento criado já nasce confirmado, então esse chip do design de
// referência não se aplica ao que o sistema realmente faz hoje.
const CHIP_POR_STATUS: Record<string, { classe: string; rotulo: string }> = {
  confirmado: { classe: 'verde', rotulo: 'Confirmado' },
  concluido: { classe: 'verde', rotulo: 'Concluído' },
  cancelado: { classe: 'terracota', rotulo: 'Cancelado' },
  no_show: { classe: 'terracota', rotulo: 'Não compareceu' },
};

export function Agenda({ barbeiro }: { barbeiro: Barbeiro }) {
  const [nomeBarbearia, setNomeBarbearia] = useState('');
  const [agendamentos, setAgendamentos] = useState<AgendamentoDoDia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);

    const [{ data: barbearia }, { data: lista, error }] = await Promise.all([
      supabase.from('barbearias').select('nome').eq('id', barbeiro.barbearia_id).single(),
      supabase
        .from('agendamentos')
        .select('id, inicio, fim, status, clientes(nome, telefone), servicos(nome)')
        .eq('barbeiro_id', barbeiro.id)
        .gte('inicio', inicioDoDia().toISOString())
        .lte('inicio', fimDoDia().toISOString())
        .order('inicio', { ascending: true }),
    ]);

    if (barbearia) setNomeBarbearia(barbearia.nome);
    if (error) setErro(error.message);
    else setAgendamentos((lista ?? []) as unknown as AgendamentoDoDia[]);
    setCarregando(false);
  }, [barbeiro.barbearia_id, barbeiro.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totalHoje = agendamentos.length;
  const confirmados = agendamentos.filter((a) => a.status === 'confirmado').length;
  const pctConfirmados = totalHoje > 0 ? Math.round((confirmados / totalHoje) * 100) : 0;

  return (
    <>
      <header className="cabecalho-painel">
        <div>
          <h1>{formatarDataCabecalho()}</h1>
          <p className="subtitulo">{nomeBarbearia}</p>
        </div>
        <button className="botao-primario" onClick={() => setModalAberto(true)}>
          Novo agendamento
        </button>
      </header>

      <div className="grade-metricas">
        <div className="card-metrica">
          <span className="rotulo">Hoje</span>
          <span className="numero">{totalHoje}</span>
          <span className="legenda">agendamentos</span>
        </div>
        <div className="card-metrica">
          <span className="rotulo">Confirmados</span>
          <span className="numero verde">{confirmados}</span>
          <span className="legenda">{totalHoje > 0 ? `${pctConfirmados}% da agenda` : '—'}</span>
        </div>
        <div className="card-metrica">
          <span className="rotulo">Faltas evitadas</span>
          <span className="numero indisponivel">—</span>
          <span className="legenda">em breve, via lembrete</span>
        </div>
        <div className="card-metrica">
          <span className="rotulo">Resposta média</span>
          <span className="numero indisponivel">—</span>
          <span className="legenda">em breve</span>
        </div>
      </div>

      <section>
        <div className="cabecalho-secao">
          <h2>Próximos horários</h2>
        </div>

        {carregando ? (
          <p>Carregando agenda...</p>
        ) : erro ? (
          <p className="erro">Erro ao carregar agenda: {erro}</p>
        ) : agendamentos.length === 0 ? (
          <p>Nenhum agendamento pra hoje.</p>
        ) : (
          <table className="tabela-agenda">
            <tbody>
              {agendamentos.map((ag) => {
                const chip = CHIP_POR_STATUS[ag.status] ?? { classe: 'verde', rotulo: ag.status };
                return (
                  <tr key={ag.id}>
                    <td className="hora">{formatarHora(ag.inicio)}</td>
                    <td className="cliente">{ag.clientes?.nome || ag.clientes?.telefone || '—'}</td>
                    <td className="servico">{ag.servicos?.nome ?? '—'}</td>
                    <td>
                      <span className={`chip ${chip.classe}`}>
                        <span className="ponto" />
                        {chip.rotulo}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {modalAberto && (
        <NovoAgendamentoModal
          barbeiro={barbeiro}
          onFechar={() => setModalAberto(false)}
          onCriado={() => {
            setModalAberto(false);
            carregar();
          }}
        />
      )}
    </>
  );
}
