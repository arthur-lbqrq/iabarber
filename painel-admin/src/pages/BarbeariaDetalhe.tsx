import { useEffect, useState } from 'react';
import { chamarApiAdmin, ErroApi } from '../lib/api';
import type { Barbearia, BarbeiroAdmin } from '../lib/types';
import { NovoBarbeiroModal } from '../components/NovoBarbeiroModal';

interface Detalhe {
  barbearia: Barbearia;
  barbeiros: BarbeiroAdmin[];
  servicos_total: number;
  agendamentos_total: number;
}

export function BarbeariaDetalhe({ id, onVoltar }: { id: string; onVoltar: () => void }) {
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [telefoneEdicao, setTelefoneEdicao] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await chamarApiAdmin<Detalhe>(`/api/admin/barbearias/${id}`);
      setDetalhe(dados);
      setNomeEdicao(dados.barbearia.nome);
      setTelefoneEdicao(dados.barbearia.telefone ?? '');
      setErro(null);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Erro desconhecido.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function alternarAtivo() {
    if (!detalhe) return;
    await chamarApiAdmin(`/api/admin/barbearias/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo: !detalhe.barbearia.ativo }),
    });
    await carregar();
  }

  async function salvarEdicao() {
    await chamarApiAdmin(`/api/admin/barbearias/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ nome: nomeEdicao, telefone: telefoneEdicao || null }),
    });
    setEditando(false);
    await carregar();
  }

  async function alternarBarbeiroAtivo(barbeiro: BarbeiroAdmin) {
    await chamarApiAdmin(`/api/admin/barbearias/${id}/barbeiros/${barbeiro.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo: !barbeiro.ativo }),
    });
    await carregar();
  }

  if (carregando) return <p>Carregando...</p>;
  if (erro) return <p className="erro">{erro}</p>;
  if (!detalhe) return null;

  const { barbearia, barbeiros, servicos_total, agendamentos_total } = detalhe;

  return (
    <>
      <button onClick={onVoltar} className="link-acao">
        ← Todas as barbearias
      </button>

      <header className="cabecalho-painel">
        <div>
          {editando ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <input value={nomeEdicao} onChange={(e) => setNomeEdicao(e.target.value)} placeholder="Nome" />
              <input
                value={telefoneEdicao}
                onChange={(e) => setTelefoneEdicao(e.target.value)}
                placeholder="Telefone (opcional)"
              />
            </div>
          ) : (
            <>
              <h1>{barbearia.nome}</h1>
              <p className="subtitulo">{barbearia.telefone || 'Sem telefone cadastrado'}</p>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editando ? (
            <>
              <button className="botao-secundario" onClick={() => setEditando(false)}>
                Cancelar
              </button>
              <button className="botao-primario" onClick={salvarEdicao}>
                Salvar
              </button>
            </>
          ) : (
            <>
              <button className="botao-secundario" onClick={() => setEditando(true)}>
                Editar
              </button>
              <button className="botao-secundario" onClick={alternarAtivo}>
                {barbearia.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="grade-metricas">
        <div className="card-metrica">
          <span className="rotulo">Status</span>
          <span className={`chip ${barbearia.ativo ? 'verde' : 'aco'}`} style={{ width: 'fit-content' }}>
            <span className="ponto" />
            {barbearia.ativo ? 'Ativa' : 'Inativa'}
          </span>
        </div>
        <div className="card-metrica">
          <span className="rotulo">Serviços</span>
          <span className="numero">{servicos_total}</span>
        </div>
        <div className="card-metrica">
          <span className="rotulo">Agendamentos</span>
          <span className="numero">{agendamentos_total}</span>
        </div>
      </div>

      <section>
        <div className="cabecalho-secao" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Barbeiros ({barbeiros.length})</h2>
          <button className="link-acao" onClick={() => setModalAberto(true)}>
            + adicionar barbeiro
          </button>
        </div>

        {barbeiros.length === 0 ? (
          <p className="nota-discreta">Nenhum barbeiro cadastrado ainda.</p>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela-lista">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone (modo admin)</th>
                  <th>Login</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {barbeiros.map((b) => (
                  <tr key={b.id} className={!b.ativo ? 'linha-inativa' : ''}>
                    <td>{b.nome}</td>
                    <td>{b.telefone || '—'}</td>
                    <td>
                      <span className={`chip ${b.user_id ? 'verde' : 'aco'}`}>
                        <span className="ponto" />
                        {b.user_id ? 'Configurado' : 'Não configurado'}
                      </span>
                    </td>
                    <td>
                      <span className={`chip ${b.ativo ? 'verde' : 'aco'}`}>
                        <span className="ponto" />
                        {b.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <button className="link-acao" onClick={() => alternarBarbeiroAtivo(b)}>
                        {b.ativo ? 'desativar' : 'ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalAberto && (
        <NovoBarbeiroModal
          barbeariaId={id}
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
