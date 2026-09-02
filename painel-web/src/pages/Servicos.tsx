import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Barbeiro, Servico } from '../lib/types';

function formatarPrecoReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function Servicos({ barbeiro }: { barbeiro: Barbeiro }) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nomeNovo, setNomeNovo] = useState('');
  const [duracaoNova, setDuracaoNova] = useState(30);
  const [precoNovo, setPrecoNovo] = useState(0);
  const [variavelNovo, setVariavelNovo] = useState(false);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('servicos')
      .select('id, nome, duracao_minutos, preco_centavos, preco_variavel, ativo')
      .order('nome', { ascending: true });

    if (error) setErro(error.message);
    else setServicos((data ?? []) as Servico[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function adicionar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const { error } = await supabase.from('servicos').insert({
      barbearia_id: barbeiro.barbearia_id,
      nome: nomeNovo,
      duracao_minutos: duracaoNova,
      preco_centavos: Math.round(precoNovo * 100),
      preco_variavel: variavelNovo,
    });

    if (error) setErro(error.message);
    else {
      setNomeNovo('');
      setDuracaoNova(30);
      setPrecoNovo(0);
      setVariavelNovo(false);
      await carregar();
    }
  }

  async function salvarEdicao(servico: Servico) {
    const { error } = await supabase
      .from('servicos')
      .update({
        duracao_minutos: servico.duracao_minutos,
        preco_centavos: servico.preco_centavos,
        preco_variavel: servico.preco_variavel,
        ativo: servico.ativo,
      })
      .eq('id', servico.id);

    if (error) setErro(error.message);
    else {
      setEditandoId(null);
      await carregar();
    }
  }

  function atualizarCampoLocal(id: string, campos: Partial<Servico>) {
    setServicos((atual) => atual.map((s) => (s.id === id ? { ...s, ...campos } : s)));
  }

  return (
    <>
      <header className="cabecalho-painel">
        <div>
          <h1>Serviços</h1>
          <p className="subtitulo">
            {servicos.length} {servicos.length === 1 ? 'cadastrado' : 'cadastrados'}
          </p>
        </div>
      </header>

      <form onSubmit={adicionar} className="form-horario">
        <input
          type="text"
          placeholder="Nome do serviço"
          value={nomeNovo}
          onChange={(e) => setNomeNovo(e.target.value)}
          required
          style={{ minWidth: 160 }}
        />
        <input
          type="number"
          min={5}
          step={5}
          value={duracaoNova}
          onChange={(e) => setDuracaoNova(Number(e.target.value))}
          title="Duração em minutos"
          style={{ width: 80 }}
        />
        <span>min</span>
        <input
          type="number"
          min={0}
          step={0.5}
          value={precoNovo}
          onChange={(e) => setPrecoNovo(Number(e.target.value))}
          title="Preço em reais"
          style={{ width: 90 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--aco)' }}>
          <input
            type="checkbox"
            checked={variavelNovo}
            onChange={(e) => setVariavelNovo(e.target.checked)}
          />
          a partir de
        </label>
        <button type="submit">Adicionar</button>
      </form>

      {erro && <p className="erro">{erro}</p>}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <div className="tabela-scroll">
          <table className="tabela-lista">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Duração</th>
              <th>Preço</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {servicos.map((s) => {
              const editando = editandoId === s.id;
              return (
                <tr key={s.id} className={!s.ativo ? 'linha-inativa' : ''}>
                  <td>{s.nome}</td>
                  <td>
                    {editando ? (
                      <input
                        type="number"
                        value={s.duracao_minutos}
                        onChange={(e) =>
                          atualizarCampoLocal(s.id, { duracao_minutos: Number(e.target.value) })
                        }
                        style={{ width: 70 }}
                      />
                    ) : (
                      `${s.duracao_minutos}min`
                    )}
                  </td>
                  <td>
                    {editando ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number"
                          step={0.5}
                          value={s.preco_centavos / 100}
                          onChange={(e) =>
                            atualizarCampoLocal(s.id, {
                              preco_centavos: Math.round(Number(e.target.value) * 100),
                            })
                          }
                          style={{ width: 80 }}
                        />
                        <label style={{ fontSize: 12, color: 'var(--aco)' }}>
                          <input
                            type="checkbox"
                            checked={s.preco_variavel}
                            onChange={(e) =>
                              atualizarCampoLocal(s.id, { preco_variavel: e.target.checked })
                            }
                          />{' '}
                          a partir de
                        </label>
                      </span>
                    ) : (
                      <>
                        {s.preco_variavel ? 'a partir de ' : ''}
                        {formatarPrecoReais(s.preco_centavos)}
                      </>
                    )}
                  </td>
                  <td>
                    {editando ? (
                      <label style={{ fontSize: 12, color: 'var(--aco)' }}>
                        <input
                          type="checkbox"
                          checked={s.ativo}
                          onChange={(e) => atualizarCampoLocal(s.id, { ativo: e.target.checked })}
                        />{' '}
                        ativo
                      </label>
                    ) : (
                      <span className={`chip ${s.ativo ? 'verde' : 'aco'}`}>
                        <span className="ponto" />
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    )}
                  </td>
                  <td>
                    {editando ? (
                      <button onClick={() => salvarEdicao(s)} className="link-acao">
                        salvar
                      </button>
                    ) : (
                      <button onClick={() => setEditandoId(s.id)} className="link-acao">
                        editar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </>
  );
}
