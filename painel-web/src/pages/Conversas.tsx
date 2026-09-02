import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Conversa {
  clienteId: string;
  nome: string | null;
  telefone: string;
  ultimaMensagem: string | null;
  fromMe: boolean | null;
  atualizadoEm: string | null;
}

function formatarQuando(iso: string | null): string {
  if (!iso) return '';
  const data = new Date(iso);
  const hoje = new Date();
  const ehHoje = data.toDateString() === hoje.toDateString();
  return ehHoje
    ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : data.toLocaleDateString('pt-BR');
}

export function Conversas() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const { data: sessao } = await supabase.auth.getSession();
      const token = sessao.session?.access_token;
      if (!token) {
        setErro('Sessão expirada — atualize a página.');
        setCarregando(false);
        return;
      }

      try {
        const resposta = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resposta.ok) throw new Error(`status ${resposta.status}`);
        const corpo = await resposta.json();
        setConversas(corpo.conversas ?? []);
      } catch (e) {
        setErro(
          e instanceof Error
            ? `Não consegui falar com o backend (${e.message}). Ele está rodando?`
            : 'Erro desconhecido.',
        );
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  return (
    <>
      <header className="cabecalho-painel">
        <div>
          <h1>Conversas</h1>
          <p className="subtitulo">Últimas mensagens com clientes no WhatsApp</p>
        </div>
      </header>

      {carregando ? (
        <p>Carregando...</p>
      ) : erro ? (
        <p className="erro">{erro}</p>
      ) : conversas.length === 0 ? (
        <p>Nenhuma conversa com cliente cadastrado ainda.</p>
      ) : (
        <ul className="lista-conversas">
          {conversas.map((c) => (
            <li key={c.clienteId}>
              <div className="conversa-info">
                <span className="conversa-nome">{c.nome || c.telefone}</span>
                <span className="conversa-preview">
                  {c.ultimaMensagem ? (
                    <>
                      {c.fromMe && <strong>Você: </strong>}
                      {c.ultimaMensagem}
                    </>
                  ) : (
                    <em>Sem mensagens ainda</em>
                  )}
                </span>
              </div>
              <span className="conversa-quando">{formatarQuando(c.atualizadoEm)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
