import { describe, expect, it } from 'vitest';
import { formatarMensagemRetencao } from './mensagem.js';

describe('formatarMensagemRetencao', () => {
  it('usa o primeiro nome do cliente quando tem', () => {
    const texto = formatarMensagemRetencao('Arthur', 'Barbearia Piloto');
    expect(texto).toContain('Oi, Arthur!');
    expect(texto).toContain('Barbearia Piloto');
  });

  it('funciona sem nome do cliente (só telefone cadastrado)', () => {
    const texto = formatarMensagemRetencao(null, 'Barbearia Piloto');
    expect(texto).toContain('Oi!');
    expect(texto).not.toContain('null');
  });

  it('nunca usa o emoji de poste de barbeiro (proibido pela marca)', () => {
    const texto = formatarMensagemRetencao('Arthur', 'Barbearia Piloto');
    expect(texto).not.toContain('💈');
  });
});
