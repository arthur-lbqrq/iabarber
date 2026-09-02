import { useState, type FormEvent } from 'react';
import { chamarApiAdmin, ErroApi } from '../lib/api';
import type { BarbeiroAdmin } from '../lib/types';

export function NovoBarbeiroModal({
  barbeariaId,
  onFechar,
  onCriado,
}: {
  barbeariaId: string;
  onFechar: () => void;
  onCriado: () => void;
}) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await chamarApiAdmin<{ barbeiro: BarbeiroAdmin }>(`/api/admin/barbearias/${barbeariaId}/barbeiros`, {
        method: 'POST',
        body: JSON.stringify({ nome, telefone: telefone || undefined, email, senha }),
      });
      onCriado();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Erro desconhecido.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fundo-modal" onClick={onFechar}>
      <form className="cartao-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Adicionar barbeiro</h2>
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" required />
        </label>
        <label>
          Telefone (opcional, pro modo admin no WhatsApp)
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="558199999999" />
        </label>
        <label>
          E-mail de login
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Senha (mínimo 6 caracteres)
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} required />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <div className="acoes-modal">
          <button type="button" onClick={onFechar} className="botao-secundario">
            Cancelar
          </button>
          <button type="submit" className="botao-primario" disabled={enviando}>
            {enviando ? 'Criando...' : 'Adicionar'}
          </button>
        </div>
      </form>
    </div>
  );
}
