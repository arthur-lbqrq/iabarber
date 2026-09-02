import { supabase } from '../lib/supabaseClient';
import { Logo } from './Logo';

export type Aba = 'agenda' | 'horarios';

const ITENS_EM_BREVE = ['Conversas', 'Clientes', 'Equipe'];

export function Sidebar({ aba, onMudarAba }: { aba: Aba; onMudarAba: (aba: Aba) => void }) {
  return (
    <aside className="sidebar">
      <div className="logo-sidebar">
        <Logo tamanho={24} />
        <span>Corte Certo</span>
      </div>

      <nav className="nav-sidebar">
        <button className={aba === 'agenda' ? 'ativo' : ''} onClick={() => onMudarAba('agenda')}>
          Agenda
        </button>
        {ITENS_EM_BREVE.map((item) => (
          <button key={item} disabled title="Em breve">
            {item}
          </button>
        ))}
        <button
          className={aba === 'horarios' ? 'ativo' : ''}
          onClick={() => onMudarAba('horarios')}
        >
          Horários
        </button>
      </nav>

      <button onClick={() => supabase.auth.signOut()} className="link-acao" style={{ textAlign: 'left' }}>
        Sair
      </button>

      <div className="pill-whatsapp">
        <span className="ponto" />
        WhatsApp conectado
      </div>
    </aside>
  );
}
