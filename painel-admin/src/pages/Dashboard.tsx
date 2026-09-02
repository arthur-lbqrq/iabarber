import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { chamarApiAdmin, ErroApi } from '../lib/api';
import { Logo } from '../components/Logo';
import { BarbeariasLista } from './BarbeariasLista';
import { BarbeariaDetalhe } from './BarbeariaDetalhe';

export function Dashboard() {
  const [admin, setAdmin] = useState<{ id: string; nome: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [barbeariaAberta, setBarbeariaAberta] = useState<string | null>(null);

  useEffect(() => {
    async function verificarAdmin() {
      try {
        const { admin } = await chamarApiAdmin<{ admin: { id: string; nome: string } }>('/api/admin/me');
        setAdmin(admin);
      } catch (e) {
        // Sessão válida no Supabase Auth, mas não é um admin do Corte Certo (ex.: é
        // login de barbeiro) — desloga em vez de travar numa tela sem saída, mesmo
        // padrão usado no painel-web pra sessão obsoleta.
        if (e instanceof ErroApi) {
          setErro('Essa conta não tem acesso ao painel de admin.');
        }
        await supabase.auth.signOut();
      }
    }
    verificarAdmin();
  }, []);

  if (erro) return <p className="erro" style={{ padding: 24 }}>{erro}</p>;
  if (!admin) return <p style={{ padding: 24 }}>Confirmando acesso...</p>;

  return (
    <div className="app-admin">
      <header className="topo-admin">
        <div className="logo-topo">
          <Logo tamanho={22} />
          <span>Corte Certo</span>
          <span className="selo">admin</span>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="link-acao">
          Sair ({admin.nome})
        </button>
      </header>

      <div className="conteudo-admin">
        {barbeariaAberta ? (
          <BarbeariaDetalhe id={barbeariaAberta} onVoltar={() => setBarbeariaAberta(null)} />
        ) : (
          <BarbeariasLista onAbrir={setBarbeariaAberta} />
        )}
      </div>
    </div>
  );
}
