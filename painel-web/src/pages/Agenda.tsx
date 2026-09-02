import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { NOMES_DIA_SEMANA, type Barbeiro } from '../lib/types';
import { NovoAgendamentoModal } from '../components/NovoAgendamentoModal';

function hoje(): Date {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  return data;
}

function fimDoDia(data: Date): Date {
  const fim = new Date(data);
  fim.setHours(23, 59, 59, 999);
  return fim;
}

function somarDias(data: Date, dias: number): Date {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

function mesmoDia(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

// Formato "yyyy-mm-dd" pro <input type="date"> usando o horário local — usar
// toISOString() aqui converteria pra UTC e podia acertar o dia errado (Brasil é
// UTC-3), mesma pegadinha já documentada no motor de regras.
function paraInputDate(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarDataCabecalho(data: Date): string {
  const diaSemana = NOMES_DIA_SEMANA[data.getDay()];
  const mes = data.toLocaleDateString('pt-BR', { month: 'long' });
  return `${diaSemana}, ${data.getDate()} de ${mes}`;
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

// Grade fixa de 8h às 20h: cobre com folga o expediente real dos dois barbeiros
// (seg-sex 9h-18h, sáb 9h-12h) sem precisar calcular dinamicamente a partir de
// horarios_disponiveis — mais simples e já é o mesmo intervalo usado antes como
// "horário de atendimento".
const GRADE_HORA_INICIO = 8;
const GRADE_HORA_FIM = 20;
const PX_POR_HORA = 64;
// Altura real do .cabecalho-coluna (9px de padding em cima/embaixo + texto + borda) —
// os rótulos de hora do eixo à esquerda precisam desse deslocamento pra alinhar com a
// grade das colunas, já que elas têm um cabeçalho acima e o eixo não.
const ALTURA_CABECALHO_COLUNA = 37;

interface AgendamentoDaAgenda {
  id: string;
  inicio: string;
  fim: string;
  status: string;
  barbeiro_id: string;
  clientes: { nome: string | null; telefone: string } | null;
  servicos: { nome: string } | null;
}

export function Agenda({ barbeiro }: { barbeiro: Barbeiro }) {
  const [nomeBarbearia, setNomeBarbearia] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoDaAgenda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [barbeiroDoModal, setBarbeiroDoModal] = useState(barbeiro.id);

  const ehHoje = mesmoDia(dataSelecionada, hoje());

  const carregar = useCallback(async () => {
    setCarregando(true);

    const [{ data: barbearia }, { data: listaBarbeiros }, { data: lista, error }] = await Promise.all([
      supabase.from('barbearias').select('nome').eq('id', barbeiro.barbearia_id).single(),
      supabase
        .from('barbeiros')
        .select('id, barbearia_id, nome, telefone, ativo')
        .eq('barbearia_id', barbeiro.barbearia_id)
        .eq('ativo', true)
        .order('nome'),
      supabase
        .from('agendamentos')
        // Agenda mostra a barbearia inteira, não só o barbeiro logado — antes filtrava
        // por barbeiro_id e agendamentos de outros profissionais somem da visão.
        .select('id, inicio, fim, status, barbeiro_id, clientes(nome, telefone), servicos(nome)')
        .eq('barbearia_id', barbeiro.barbearia_id)
        .gte('inicio', dataSelecionada.toISOString())
        .lte('inicio', fimDoDia(dataSelecionada).toISOString())
        .order('inicio', { ascending: true }),
    ]);

    if (barbearia) setNomeBarbearia(barbearia.nome);
    if (listaBarbeiros) setBarbeiros(listaBarbeiros as Barbeiro[]);
    if (error) setErro(error.message);
    else setAgendamentos((lista ?? []) as unknown as AgendamentoDaAgenda[]);
    setCarregando(false);
  }, [barbeiro.barbearia_id, dataSelecionada]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const total = agendamentos.length;
  const confirmados = agendamentos.filter((a) => a.status === 'confirmado').length;
  const pctConfirmados = total > 0 ? Math.round((confirmados / total) * 100) : 0;

  function abrirModal(idBarbeiro: string) {
    setBarbeiroDoModal(idBarbeiro);
    setModalAberto(true);
  }

  return (
    <>
      <header className="cabecalho-painel">
        <div>
          <h1>{formatarDataCabecalho(dataSelecionada)}</h1>
          <p className="subtitulo">{nomeBarbearia}</p>
        </div>
        <div className="nav-data">
          <button onClick={() => setDataSelecionada((d) => somarDias(d, -1))} aria-label="Dia anterior">
            ‹
          </button>
          {!ehHoje && (
            <button className="botao-hoje" onClick={() => setDataSelecionada(hoje())}>
              Hoje
            </button>
          )}
          <input
            type="date"
            value={paraInputDate(dataSelecionada)}
            onChange={(e) => {
              const [ano, mes, dia] = e.target.value.split('-').map(Number);
              setDataSelecionada(new Date(ano, mes - 1, dia));
            }}
          />
          <button onClick={() => setDataSelecionada((d) => somarDias(d, 1))} aria-label="Próximo dia">
            ›
          </button>
        </div>
        <button className="botao-primario" onClick={() => abrirModal(barbeiro.id)}>
          Novo agendamento
        </button>
      </header>

      <div className="grade-metricas">
        <div className="card-metrica">
          <span className="rotulo">{ehHoje ? 'Hoje' : 'Nesse dia'}</span>
          <span className="numero">{total}</span>
          <span className="legenda">agendamentos</span>
        </div>
        <div className="card-metrica">
          <span className="rotulo">Confirmados</span>
          <span className="numero verde">{confirmados}</span>
          <span className="legenda">{total > 0 ? `${pctConfirmados}% da agenda` : '—'}</span>
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
          <h2>Agenda do dia</h2>
        </div>

        {carregando ? (
          <p>Carregando agenda...</p>
        ) : erro ? (
          <p className="erro">Erro ao carregar agenda: {erro}</p>
        ) : barbeiros.length === 0 ? (
          <p>Nenhum profissional ativo cadastrado.</p>
        ) : (
          <CalendarioDia
            barbeiros={barbeiros}
            agendamentos={agendamentos}
            ehHoje={ehHoje}
            onNovoAgendamento={abrirModal}
          />
        )}
      </section>

      {modalAberto && (
        <NovoAgendamentoModal
          barbeariaId={barbeiro.barbearia_id}
          barbeiros={barbeiros}
          barbeiroIdInicial={barbeiroDoModal}
          dataInicial={paraInputDate(dataSelecionada)}
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

function CalendarioDia({
  barbeiros,
  agendamentos,
  ehHoje,
  onNovoAgendamento,
}: {
  barbeiros: Barbeiro[];
  agendamentos: AgendamentoDaAgenda[];
  ehHoje: boolean;
  onNovoAgendamento: (idBarbeiro: string) => void;
}) {
  const horas: number[] = [];
  for (let h = GRADE_HORA_INICIO; h <= GRADE_HORA_FIM; h++) horas.push(h);
  const alturaGrade = (GRADE_HORA_FIM - GRADE_HORA_INICIO) * PX_POR_HORA;

  const agendamentosPorBarbeiro = new Map<string, AgendamentoDaAgenda[]>();
  for (const ag of agendamentos) {
    const lista = agendamentosPorBarbeiro.get(ag.barbeiro_id) ?? [];
    lista.push(ag);
    agendamentosPorBarbeiro.set(ag.barbeiro_id, lista);
  }

  const agora = new Date();
  const horaAgoraDecimal = agora.getHours() + agora.getMinutes() / 60;
  const mostrarLinhaAgora = ehHoje && horaAgoraDecimal >= GRADE_HORA_INICIO && horaAgoraDecimal < GRADE_HORA_FIM;
  const offsetLinhaAgora = (horaAgoraDecimal - GRADE_HORA_INICIO) * PX_POR_HORA;

  return (
    <div className="calendario-dia">
      <div className="eixo-horas" style={{ height: alturaGrade + ALTURA_CABECALHO_COLUNA }}>
        {horas.map((h) => (
          <span
            key={h}
            className="rotulo-hora"
            style={{ top: ALTURA_CABECALHO_COLUNA + (h - GRADE_HORA_INICIO) * PX_POR_HORA }}
          >
            {String(h).padStart(2, '0')}:00
          </span>
        ))}
      </div>

      {barbeiros.map((b) => (
        <div key={b.id} className="coluna-barbeiro">
          <div className="cabecalho-coluna">
            <span>{b.nome}</span>
            <button type="button" onClick={() => onNovoAgendamento(b.id)} aria-label={`Novo agendamento com ${b.nome}`}>
              +
            </button>
          </div>
          <div className="grade-coluna" style={{ height: alturaGrade }}>
            {horas.slice(0, -1).map((h) => (
              <div key={h} className="linha-hora" style={{ top: (h - GRADE_HORA_INICIO) * PX_POR_HORA }} />
            ))}
            {mostrarLinhaAgora && <div className="linha-agora" style={{ top: offsetLinhaAgora }} />}
            {(agendamentosPorBarbeiro.get(b.id) ?? []).map((ag) => {
              const inicio = new Date(ag.inicio);
              const fim = new Date(ag.fim);
              const horaDecimalInicio = inicio.getHours() + inicio.getMinutes() / 60;
              const offsetTopo = Math.max(0, (horaDecimalInicio - GRADE_HORA_INICIO) * PX_POR_HORA);
              const duracaoMinutos = (fim.getTime() - inicio.getTime()) / 60_000;
              const altura = Math.max(32, (duracaoMinutos / 60) * PX_POR_HORA);
              const chip = CHIP_POR_STATUS[ag.status] ?? { classe: 'verde', rotulo: ag.status };
              const nomeCliente = ag.clientes?.nome || ag.clientes?.telefone || '—';
              const nomeServico = ag.servicos?.nome ?? '—';
              return (
                <div
                  key={ag.id}
                  className={`bloco-agendamento ${chip.classe}`}
                  style={{ top: offsetTopo, height: altura }}
                  title={`${formatarHora(ag.inicio)} · ${nomeCliente} · ${nomeServico} · ${chip.rotulo}`}
                >
                  <span className="bloco-linha1">
                    <span className="bloco-hora">{formatarHora(ag.inicio)}</span>
                    <span className="bloco-cliente">{nomeCliente}</span>
                  </span>
                  <span className="bloco-servico">{nomeServico}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
