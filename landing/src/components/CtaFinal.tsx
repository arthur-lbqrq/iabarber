import { useState, type FormEvent } from 'react';

function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length === 0) return '';
  let saida = `(${digitos.slice(0, 2)}`;
  if (digitos.length > 2) saida += `) ${digitos.slice(2, 3)}`;
  if (digitos.length > 3) saida += ` ${digitos.slice(3, 7)}`;
  if (digitos.length > 7) saida += `-${digitos.slice(7, 11)}`;
  return saida;
}

export function CtaFinal() {
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(evento: FormEvent) {
    evento.preventDefault();
    const digitos = telefone.replace(/\D/g, '');

    if (digitos.length !== 11) {
      setErro(true);
      return;
    }

    setErro(false);
    setEnviado(true);
  }

  return (
    <section id="contato" className="secao-cta-final">
      <div className="container grade">
        <div>
          <h2>Quer ver funcionando no seu número?</h2>
          <p className="sub">
            Deixa o WhatsApp da barbearia. A gente liga o atendimento hoje mesmo e você acompanha
            as primeiras conversas acontecendo.
          </p>
        </div>

        <form className="form-cta" onSubmit={handleSubmit}>
          {enviado ? (
            <p className="confirmacao">
              Recebemos seu número. Alguém da equipe fala com você ainda hoje.
            </p>
          ) : (
            <>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="(11) 9 0000-0000"
                value={telefone}
                className={erro ? 'invalido' : ''}
                onChange={(e) => {
                  setTelefone(formatarTelefone(e.target.value));
                  setErro(false);
                }}
              />
              {erro && <span className="erro-campo">Digite um número de WhatsApp válido com DDD.</span>}
              <button type="submit" className="botao-primario">
                Quero ligar o meu
              </button>
            </>
          )}
          <p className="micro">
            Sem contrato de fidelidade. Se não gostar, é só desconectar — seu número continua seu.
          </p>
        </form>
      </div>
    </section>
  );
}
