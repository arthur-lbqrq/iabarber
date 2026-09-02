import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface MembroEquipe {
  id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
  user_id: string | null;
}

export function Equipe() {
  const [equipe, setEquipe] = useState<MembroEquipe[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from('barbeiros')
        .select('id, nome, telefone, ativo, user_id')
        .order('nome', { ascending: true });

      if (error) setErro(error.message);
      else setEquipe((data ?? []) as MembroEquipe[]);
      setCarregando(false);
    }
    carregar();
  }, []);

  return (
    <>
      <header className="cabecalho-painel">
        <div>
          <h1>Equipe</h1>
          <p className="subtitulo">
            {equipe.length} {equipe.length === 1 ? 'profissional' : 'profissionais'}
          </p>
        </div>
      </header>

      <p className="nota-discreta">
        Novos membros da equipe (login no painel e modo admin no WhatsApp) precisam ser
        cadastrados por quem administra o sistema — ainda não dá pra criar por aqui.
      </p>

      {carregando ? (
        <p>Carregando...</p>
      ) : erro ? (
        <p className="erro">Erro ao carregar equipe: {erro}</p>
      ) : (
        <div className="tabela-scroll">
          <table className="tabela-lista">
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp (modo admin)</th>
                <th>Login no painel</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {equipe.map((membro) => (
                <tr key={membro.id}>
                  <td>{membro.nome}</td>
                  <td>{membro.telefone || '—'}</td>
                  <td>
                    <span className={`chip ${membro.user_id ? 'verde' : 'aco'}`}>
                      <span className="ponto" />
                      {membro.user_id ? 'Configurado' : 'Não configurado'}
                    </span>
                  </td>
                  <td>
                    <span className={`chip ${membro.ativo ? 'verde' : 'aco'}`}>
                      <span className="ponto" />
                      {membro.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
