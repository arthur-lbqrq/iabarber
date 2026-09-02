import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Logo } from './Logo';

export type Aba = 'agenda' | 'conversas' | 'clientes' | 'equipe' | 'servicos' | 'horarios';

const ITENS: { aba: Aba; rotulo: string }[] = [
  { aba: 'agenda', rotulo: 'Agenda' },
  { aba: 'conversas', rotulo: 'Conversas' },
  { aba: 'clientes', rotulo: 'Clientes' },
  { aba: 'equipe', rotulo: 'Equipe' },
  { aba: 'servicos', rotulo: 'Serviços' },
  { aba: 'horarios', rotulo: 'Horários' },
];

export function Sidebar({ aba, onMudarAba }: { aba: Aba; onMudarAba: (aba: Aba) => void }) {
  const [menuAberto, setMenuAberto] = useState(false);

  function selecionar(novaAba: Aba) {
    onMudarAba(novaAba);
    setMenuAberto(false);
  }

  return (
    <>
      <header className="barra-mobile">
        <button className="botao-menu" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
          <span />
          <span />
          <span />
        </button>
        <div className="logo-sidebar">
          <Logo tamanho={22} />
          <span>Corte Certo</span>
        </div>
      </header>

      {menuAberto && <div className="fundo-menu-mobile" onClick={() => setMenuAberto(false)} />}

      <aside className={`sidebar${menuAberto ? ' aberto' : ''}`}>
        <div className="logo-sidebar">
          <Logo tamanho={24} />
          <span>Corte Certo</span>
        </div>

        <nav className="nav-sidebar">
          {ITENS.map((item) => (
            <button
              key={item.aba}
              className={aba === item.aba ? 'ativo' : ''}
              onClick={() => selecionar(item.aba)}
            >
              {item.rotulo}
            </button>
          ))}
        </nav>

        <button onClick={() => supabase.auth.signOut()} className="link-acao" style={{ textAlign: 'left' }}>
          Sair
        </button>

        <div className="pill-whatsapp">
          <span className="ponto" />
          WhatsApp conectado
        </div>
      </aside>
    </>
  );
}
