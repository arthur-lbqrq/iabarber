import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Barbeiro } from '../lib/types';

const CODIGO_CONFLITO_HORARIO = '23P01'; // exclusion_violation (choque com outro agendamento)

interface Servico {
  id: string;
  nome: string;
  duracao_minutos: number;
}

export function NovoAgendamentoModal({
  barbeariaId,
  barbeiros,
  barbeiroIdInicial,
  dataInicial,
  onFechar,
  onCriado,
}: {
  barbeariaId: string;
  barbeiros: Barbeiro[];
  barbeiroIdInicial: string;
  dataInicial?: string;
  onFechar: () => void;
  onCriado: () => void;
}) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicoId, setServicoId] = useState('');
  const [barbeiroId, setBarbeiroId] = useState(barbeiroIdInicial);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [data, setData] = useState(() => dataInicial ?? new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState('09:00');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase
      .from('servicos')
      .select('id, nome, duracao_minutos')
      .eq('barbearia_id', barbeariaId)
      .eq('ativo', true)
      .then(({ data }) => {
        setServicos(data ?? []);
        if (data && data.length > 0) setServicoId(data[0].id);
      });
  }, [barbeariaId]);

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    const servico = servicos.find((s) => s.id === servicoId);
    if (!servico) {
      setErro('Escolha um serviço.');
      setEnviando(false);
      return;
    }

    const inicio = new Date(`${data}T${hora}:00`);
    const fim = new Date(inicio.getTime() + servico.duracao_minutos * 60_000);

    const { data: cliente, error: erroCliente } = await supabase
      .from('clientes')
      .upsert(
        { barbearia_id: barbeariaId, telefone: clienteTelefone, nome: clienteNome },
        { onConflict: 'barbearia_id,telefone' },
      )
      .select('id')
      .single();

    if (erroCliente || !cliente) {
      setErro(erroCliente?.message ?? 'Não foi possível salvar o cliente.');
      setEnviando(false);
      return;
    }

    const { error: erroAgendamento } = await supabase.from('agendamentos').insert({
      barbearia_id: barbeariaId,
      barbeiro_id: barbeiroId,
      cliente_id: cliente.id,
      servico_id: servicoId,
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
    });

    setEnviando(false);

    if (erroAgendamento) {
      if (erroAgendamento.code === CODIGO_CONFLITO_HORARIO) {
        setErro('Esse horário já está ocupado.');
      } else {
        setErro(erroAgendamento.message);
      }
      return;
    }

    onCriado();
  }

  return (
    <div className="fundo-modal" onClick={onFechar}>
      <form
        className="cartao-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>Novo agendamento</h2>

        <label>
          Cliente
          <input
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            placeholder="Nome"
            required
          />
        </label>
        <label>
          WhatsApp do cliente
          <input
            value={clienteTelefone}
            onChange={(e) => setClienteTelefone(e.target.value)}
            placeholder="558199999999"
            required
          />
        </label>
        <label>
          Profissional
          <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)}>
            {barbeiros.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Serviço
          <select value={servicoId} onChange={(e) => setServicoId(e.target.value)}>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} ({s.duracao_minutos}min)
              </option>
            ))}
          </select>
        </label>
        <div className="linha-campos">
          <label>
            Data
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </label>
          <label>
            Hora
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
          </label>
        </div>

        {erro && <p className="erro">{erro}</p>}

        <div className="acoes-modal">
          <button type="button" onClick={onFechar} className="botao-secundario">
            Cancelar
          </button>
          <button type="submit" className="botao-primario" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Agendar'}
          </button>
        </div>
      </form>
    </div>
  );
}
