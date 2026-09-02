import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Cliente } from '../lib/types';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, telefone, created_at')
        .order('nome', { ascending: true, nullsFirst: false });

      if (error) setErro(error.message);
      else setClientes((data ?? []) as Cliente[]);
      setCarregando(false);
    }
    carregar();
  }, []);

  const filtrados = clientes.filter((c) => {
    const alvo = busca.trim().toLowerCase();
    if (!alvo) return true;
    return c.nome?.toLowerCase().includes(alvo) || c.telefone.includes(alvo);
  });

  return (
    <>
      <header className="cabecalho-painel">
        <div>
          <h1>Clientes</h1>
          <p className="subtitulo">
            {clientes.length} {clientes.length === 1 ? 'cadastrado' : 'cadastrados'}
          </p>
        </div>
      </header>

      <input
        type="text"
        placeholder="Buscar por nome ou telefone..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="campo-busca"
      />

      {carregando ? (
        <p>Carregando...</p>
      ) : erro ? (
        <p className="erro">Erro ao carregar clientes: {erro}</p>
      ) : filtrados.length === 0 ? (
        <p>Nenhum cliente encontrado.</p>
      ) : (
        <div className="tabela-scroll">
          <table className="tabela-lista">
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp</th>
                <th>Cliente desde</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id}>
                  <td>{c.nome || '—'}</td>
                  <td>{c.telefone}</td>
                  <td>{formatarData(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
