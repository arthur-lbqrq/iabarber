import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Barbeiro } from '../lib/types';
import { Sidebar, type Aba } from '../components/Sidebar';
import { MeusHorarios } from '../components/MeusHorarios';
import { Agenda } from './Agenda';

export function Dashboard({ user }: { user: User }) {
  const [barbeiro, setBarbeiro] = useState<Barbeiro | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>('agenda');

  useEffect(() => {
    async function carregarBarbeiro() {
      const { data, error } = await supabase
        .from('barbeiros')
        .select('id, barbearia_id, nome, telefone, ativo')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        setErro(error.message);
        return;
      }

      // Sessão sem barbeiro correspondente (comum em dev depois de um `supabase db
      // reset`, que recria o usuário de auth com outro id): a sessão guardada no
      // navegador ficou obsoleta. Em vez de travar numa tela de erro sem saída,
      // desloga e deixa a pessoa entrar de novo com a sessão atual.
      if (!data) {
        await supabase.auth.signOut();
        return;
      }

      setBarbeiro(data as Barbeiro);
    }
    carregarBarbeiro();
  }, [user.id]);

  if (erro) return <p className="erro">Erro ao carregar seu perfil: {erro}</p>;
  if (!barbeiro) return <p>Carregando...</p>;

  return (
    <div className="painel">
      <Sidebar aba={aba} onMudarAba={setAba} />

      <div className="conteudo-painel">
        {aba === 'agenda' && <Agenda barbeiro={barbeiro} />}
        {aba === 'horarios' && (
          <>
            <header className="cabecalho-painel">
              <div>
                <h1>Meus horários</h1>
                <p className="subtitulo">{barbeiro.nome}</p>
              </div>
            </header>
            <section>
              <MeusHorarios barbeiro={barbeiro} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
