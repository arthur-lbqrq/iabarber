import { describe, expect, it } from 'vitest';
import { calcularPrecoComDesconto } from './desconto.js';

describe('calcularPrecoComDesconto', () => {
  it('não muda o preço quando não há desconto', () => {
    expect(calcularPrecoComDesconto(4000, 0)).toBe(4000);
  });

  it('aplica o percentual de desconto corretamente', () => {
    expect(calcularPrecoComDesconto(4000, 25)).toBe(3000);
  });

  it('arredonda o desconto pro centavo mais próximo', () => {
    // 10% de 2500 = 250 -> preço final 2250 (sem casas decimais quebradas)
    expect(calcularPrecoComDesconto(2500, 10)).toBe(2250);
  });

  it('nunca deixa o preço final negativo, mesmo com desconto de 100%', () => {
    expect(calcularPrecoComDesconto(3000, 100)).toBe(0);
  });

  it('ignora desconto negativo (dado inconsistente) em vez de aumentar o preço', () => {
    expect(calcularPrecoComDesconto(3000, -10)).toBe(3000);
  });
});
