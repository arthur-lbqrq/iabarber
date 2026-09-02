import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { NOMES_DIA_SEMANA, type Barbeiro, type HorarioDisponivel } from '../lib/types';

export function MeusHorarios({ barbeiro }: { barbeiro: Barbeiro }) {
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [diaSemana, setDiaSemana] = useState('2');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFim, setHoraFim] = useState('19:00');

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('horarios_disponiveis')
      .select('id, dia_semana, hora_inicio, hora_fim')
      .eq('barbeiro_id', barbeiro.id)
      .order('dia_semana', { ascending: true });

    if (error) setErro(error.message);
    else setHorarios((data ?? []) as HorarioDisponivel[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbeiro.id]);

  async function adicionar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const { error } = await supabase.from('horarios_disponiveis').insert({
      barbearia_id: barbeiro.barbearia_id,
      barbeiro_id: barbeiro.id,
      dia_semana: Number(diaSemana),
      hora_inicio: horaInicio,
      hora_fim: horaFim,
    });

    if (error) setErro(error.message);
    else await carregar();
  }

  async function remover(id: string) {
    const { error } = await supabase.from('horarios_disponiveis').delete().eq('id', id);
    if (error) setErro(error.message);
    else await carregar();
  }

  return (
    <div>
      <form onSubmit={adicionar} className="form-horario">
        <select value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)}>
          {NOMES_DIA_SEMANA.map((nome, indice) => (
            <option key={indice} value={indice}>
              {nome}
            </option>
          ))}
        </select>
        <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
        <span>até</span>
        <input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
        <button type="submit">Adicionar</button>
      </form>

      {erro && <p className="erro">{erro}</p>}

      {carregando ? (
        <p>Carregando horários...</p>
      ) : horarios.length === 0 ? (
        <p>Nenhum horário cadastrado ainda.</p>
      ) : (
        <ul className="lista-horarios">
          {horarios.map((h) => (
            <li key={h.id}>
              {NOMES_DIA_SEMANA[h.dia_semana]}: {h.hora_inicio.slice(0, 5)} às{' '}
              {h.hora_fim.slice(0, 5)}
              <button onClick={() => remover(h.id)} className="botao-remover">
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
