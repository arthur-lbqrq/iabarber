import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Logo } from '../components/Logo';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    setCarregando(false);
    if (error) setErro(error.message);
  }

  return (
    <div className="tela-login">
      <form onSubmit={handleSubmit} className="cartao-login">
        <div className="logo-login">
          <Logo tamanho={28} />
          <span>Corte Certo</span>
        </div>
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
