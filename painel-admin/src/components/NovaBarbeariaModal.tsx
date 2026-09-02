import { useState, type FormEvent } from 'react';
import { chamarApiAdmin, ErroApi } from '../lib/api';
import type { Barbearia } from '../lib/types';

export function NovaBarbeariaModal({
  onFechar,
  onCriada,
}: {
  onFechar: () => void;
  onCriada: () => void;
}) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await chamarApiAdmin<{ barbearia: Barbearia }>('/api/admin/barbearias', {
        method: 'POST',
        body: JSON.stringify({ nome, telefone: telefone || undefined }),
      });
      onCriada();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : 'Erro desconhecido.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fundo-modal" onClick={onFechar}>
      <form className="cartao-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Nova barbearia</h2>
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da barbearia" required />
        </label>
        <label>
          Telefone (opcional)
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="558199999999" />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <div className="acoes-modal">
          <button type="button" onClick={onFechar} className="botao-secundario">
            Cancelar
          </button>
          <button type="submit" className="botao-primario" disabled={enviando}>
            {enviando ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  );
}
