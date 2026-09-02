import { useEffect, useState } from 'react';
import { chamarApiAdmin, ErroApi } from '../lib/api';
import type { BarbeariaComContagem } from '../lib/types';
import { NovaBarbeariaModal } from '../components/NovaBarbeariaModal';

export function BarbeariasLista({ onAbrir }: { onAbrir: (id: string) => void }) {
  const [barbearias, setBarbearias] = useState<BarbeariaComContagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const { barbearias } = await chamarApiAdmin<{ barbearias: BarbeariaComContagem[] }>('/api/admin/barbearias');
      setBarbearias(barbearias);
      setErro(null);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Erro desconhecido.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const ativas = barbearias.filter((b) => b.ativo).length;

  return (
    <>
      <header className="cabecalho-painel">
        <div>
          <h1>Barbearias</h1>
          <p className="subtitulo">
            {barbearias.length} {barbearias.length === 1 ? 'cadastrada' : 'cadastradas'}
          </p>
        </div>
        <button className="botao-primario" onClick={() => setModalAberto(true)}>
          Nova barbearia
        </button>
      </header>

      <div className="grade-metricas">
        <div className="card-metrica">
          <span className="rotulo">Total</span>
          <span className="numero">{barbearias.length}</span>
        </div>
        <div className="card-metrica">
          <span className="rotulo">Ativas</span>
          <span className="numero">{ativas}</span>
        </div>
      </div>

      {carregando ? (
        <p>Carregando...</p>
      ) : erro ? (
        <p className="erro">{erro}</p>
      ) : barbearias.length === 0 ? (
        <p>Nenhuma barbearia cadastrada ainda.</p>
      ) : (
        <div className="tabela-scroll">
          <table className="tabela-lista">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Barbeiros</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {barbearias.map((b) => (
                <tr key={b.id} className={`clicavel${!b.ativo ? ' linha-inativa' : ''}`} onClick={() => onAbrir(b.id)}>
                  <td>{b.nome}</td>
                  <td>{b.telefone || '—'}</td>
                  <td>
                    {b.barbeiros_ativos} ativo{b.barbeiros_ativos === 1 ? '' : 's'} ({b.barbeiros_total} total)
                  </td>
                  <td>
                    <span className={`chip ${b.ativo ? 'verde' : 'aco'}`}>
                      <span className="ponto" />
                      {b.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <NovaBarbeariaModal
          onFechar={() => setModalAberto(false)}
          onCriada={() => {
            setModalAberto(false);
            carregar();
          }}
        />
      )}
    </>
  );
}
