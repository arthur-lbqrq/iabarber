import { useEffect, useState, type FormEvent } from 'react';
import { chamarApi, ErroApi } from '../lib/api';
import type { ConfiguracaoIA, NumeroBloqueado } from '../lib/types';

function ConfiguracaoDaIA() {
  const [config, setConfig] = useState<ConfiguracaoIA | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    chamarApi<{ configuracao: ConfiguracaoIA }>('/api/configuracao-ia')
      .then(({ configuracao }) => setConfig(configuracao))
      .catch((e) => setErro(e instanceof ErroApi ? e.message : 'Erro desconhecido.'))
      .finally(() => setCarregando(false));
  }, []);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!config) return;
    setErro(null);
    setSalvo(false);
    setSalvando(true);
    try {
      const { configuracao } = await chamarApi<{ configuracao: ConfiguracaoIA }>('/api/configuracao-ia', {
        method: 'PATCH',
        body: JSON.stringify({
          ia_nome: config.iaNome,
          ia_tom_voz: config.iaTomVoz || null,
          retencao_automatica_ativa: config.retencaoAutomaticaAtiva,
          retencao_mensagem_template: config.retencaoMensagemTemplate || null,
          retencao_janela_dias: config.retencaoJanelaDias,
          atendimento_24h: config.atendimento24h,
          atendimento_hora_inicio: config.atendimentoHoraInicio.slice(0, 5),
          atendimento_hora_fim: config.atendimentoHoraFim.slice(0, 5),
        }),
      });
      setConfig(configuracao);
      setSalvo(true);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Erro desconhecido.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <p>Carregando...</p>;
  if (!config) return <p className="erro">{erro ?? 'Não foi possível carregar a configuração.'}</p>;

  return (
    <form onSubmit={salvar} className="form-config">
      <label>
        Nome da IA
        <input value={config.iaNome} onChange={(e) => setConfig({ ...config, iaNome: e.target.value })} required />
      </label>

      <label>
        Tom de voz (opcional)
        <textarea
          value={config.iaTomVoz ?? ''}
          onChange={(e) => setConfig({ ...config, iaTomVoz: e.target.value })}
          placeholder='Ex: "seja bem descontraído, pode usar gírias"'
          rows={2}
        />
      </label>

      <label className="linha">
        <input
          type="checkbox"
          checked={config.atendimento24h}
          onChange={(e) => setConfig({ ...config, atendimento24h: e.target.checked })}
        />
        Atender 24h (desmarque pra definir um horário)
      </label>

      {!config.atendimento24h && (
        <div className="linha-campos">
          <label>
            Início do atendimento
            <input
              type="time"
              value={config.atendimentoHoraInicio.slice(0, 5)}
              onChange={(e) => setConfig({ ...config, atendimentoHoraInicio: e.target.value })}
            />
          </label>
          <label>
            Fim do atendimento
            <input
              type="time"
              value={config.atendimentoHoraFim.slice(0, 5)}
              onChange={(e) => setConfig({ ...config, atendimentoHoraFim: e.target.value })}
            />
          </label>
        </div>
      )}

      <hr />

      <label className="linha">
        <input
          type="checkbox"
          checked={config.retencaoAutomaticaAtiva}
          onChange={(e) => setConfig({ ...config, retencaoAutomaticaAtiva: e.target.checked })}
        />
        Retenção automática ligada (manda WhatsApp sozinho pra cliente que está sumindo)
      </label>

      <label>
        <span>
          Mensagem de retenção (opcional — usa os tokens <code>{'{nome}'}</code> e{' '}
          <code>{'{barbearia}'}</code>)
        </span>
        <textarea
          value={config.retencaoMensagemTemplate ?? ''}
          onChange={(e) => setConfig({ ...config, retencaoMensagemTemplate: e.target.value })}
          placeholder="Deixe em branco pra usar o texto padrão"
          rows={3}
        />
      </label>

      <label style={{ maxWidth: 220 }}>
        Avisar quantos dias antes/depois da data prevista de retorno
        <input
          type="number"
          min={0}
          value={config.retencaoJanelaDias}
          onChange={(e) => setConfig({ ...config, retencaoJanelaDias: Number(e.target.value) })}
        />
      </label>

      {erro && <p className="erro">{erro}</p>}
      {salvo && <p style={{ color: 'var(--verde-sinal-texto)', fontSize: 13 }}>Salvo!</p>}

      <button type="submit" className="botao-primario" disabled={salvando} style={{ alignSelf: 'flex-start' }}>
        {salvando ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </form>
  );
}

function NumerosBloqueados() {
  const [numeros, setNumeros] = useState<NumeroBloqueado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [telefoneNovo, setTelefoneNovo] = useState('');
  const [motivoNovo, setMotivoNovo] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const { numeros_bloqueados } = await chamarApi<{ numeros_bloqueados: NumeroBloqueado[] }>(
        '/api/numeros-bloqueados',
      );
      setNumeros(numeros_bloqueados);
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

  async function adicionar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await chamarApi('/api/numeros-bloqueados', {
        method: 'POST',
        body: JSON.stringify({ telefone: telefoneNovo, motivo: motivoNovo || undefined }),
      });
      setTelefoneNovo('');
      setMotivoNovo('');
      await carregar();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Erro desconhecido.');
    } finally {
      setEnviando(false);
    }
  }

  async function remover(id: string) {
    try {
      await chamarApi(`/api/numeros-bloqueados/${id}`, { method: 'DELETE' });
      await carregar();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Erro desconhecido.');
    }
  }

  return (
    <>
      <p className="nota-discreta">
        A Bento nunca responde mensagens desses números — nem gasta chamada de IA nem
        manda resposta nenhuma. Útil pra bloquear contatos pessoais enquanto o número
        conectado ainda não é dedicado só pro atendimento.
      </p>

      <form onSubmit={adicionar} className="form-horario">
        <input
          type="text"
          placeholder="Telefone (ex: 558199999999)"
          value={telefoneNovo}
          onChange={(e) => setTelefoneNovo(e.target.value)}
          required
          style={{ minWidth: 180 }}
        />
        <input
          type="text"
          placeholder="Motivo (opcional)"
          value={motivoNovo}
          onChange={(e) => setMotivoNovo(e.target.value)}
          style={{ minWidth: 160 }}
        />
        <button type="submit" disabled={enviando}>
          {enviando ? 'Bloqueando...' : 'Bloquear'}
        </button>
      </form>

      {erro && <p className="erro">{erro}</p>}

      {carregando ? (
        <p>Carregando...</p>
      ) : numeros.length === 0 ? (
        <p className="nota-discreta">Nenhum número bloqueado.</p>
      ) : (
        <ul className="lista-horarios">
          {numeros.map((n) => (
            <li key={n.id}>
              <span>
                {n.telefone}
                {n.motivo ? ` — ${n.motivo}` : ''}
              </span>
              <button onClick={() => remover(n.id)} className="botao-remover">
                desbloquear
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function Configuracoes() {
  return (
    <>
      <header className="cabecalho-painel">
        <div>
          <h1>Configurações</h1>
          <p className="subtitulo">Ajustes de como a Bento responde no WhatsApp</p>
        </div>
      </header>

      <section>
        <div className="cabecalho-secao">
          <h2>Configuração da IA</h2>
        </div>
        <ConfiguracaoDaIA />
      </section>

      <section>
        <div className="cabecalho-secao">
          <h2>Números bloqueados</h2>
        </div>
        <NumerosBloqueados />
      </section>
    </>
  );
}
