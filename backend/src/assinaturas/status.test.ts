import { describe, expect, it } from 'vitest';
import { statusValido } from './status.js';

describe('statusValido', () => {
  it.each(['ativa', 'atrasada', 'cancelada', 'pendente'])('aceita "%s" como status válido', (status) => {
    expect(statusValido(status)).toBe(true);
  });

  it('rejeita o status antigo "expirada" (removido nesta fase)', () => {
    expect(statusValido('expirada')).toBe(false);
  });

  it('rejeita valor vazio, indefinido ou de outro tipo', () => {
    expect(statusValido('')).toBe(false);
    expect(statusValido(undefined)).toBe(false);
    expect(statusValido(123)).toBe(false);
  });
});
