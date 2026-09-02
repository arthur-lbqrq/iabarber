import { describe, expect, it } from 'vitest';
import { calcularSlotsLivres } from './consultarHorarios.js';

const DIA = '2026-09-10'; // quinta-feira, só uma data fixa qualquer pro teste
const JANELA_9_AS_12 = [{ hora_inicio: '09:00', hora_fim: '12:00' }];

describe('calcularSlotsLivres', () => {
  it('sem agendamentos, gera slots a cada 15min cobrindo toda a janela', () => {
    const slots = calcularSlotsLivres(DIA, JANELA_9_AS_12, [], 30);
    expect(slots[0]).toBe('09:00');
    expect(slots).toContain('11:30'); // último slot de 30min que ainda cabe até 12:00
    expect(slots).not.toContain('11:45'); // esse já estouraria as 12:00
  });

  it('remove exatamente o horário que colide com um agendamento existente', () => {
    const ocupados = [{ inicio: `${DIA}T10:00:00`, fim: `${DIA}T10:30:00` }];
    const slots = calcularSlotsLivres(DIA, JANELA_9_AS_12, ocupados, 30);

    expect(slots).not.toContain('10:00');
    expect(slots).toContain('09:30'); // serviço de 30min termina 10:00, exatamente quando o ocupado começa — sem colisão
    expect(slots).toContain('10:30'); // começa exatamente quando o ocupado termina — sem colisão
  });

  it('bloqueia qualquer slot que colida parcialmente, não só o exato', () => {
    // agendamento das 10:00 às 10:45; um serviço de 30min às 09:45 terminaria 10:15,
    // sobrepondo os primeiros 15min do agendamento existente — tem que ser bloqueado.
    const ocupados = [{ inicio: `${DIA}T10:00:00`, fim: `${DIA}T10:45:00` }];
    const slots = calcularSlotsLivres(DIA, JANELA_9_AS_12, ocupados, 30);

    expect(slots).not.toContain('09:45');
    expect(slots).not.toContain('10:15');
    expect(slots).toContain('09:30'); // termina 10:00, não sobrepõe
  });

  it('nenhum slot livre quando não há janela de trabalho naquele dia', () => {
    expect(calcularSlotsLivres(DIA, [], [], 30)).toEqual([]);
  });

  it('não sugere slot cuja duração do serviço estoura o fim da janela', () => {
    const slots = calcularSlotsLivres(DIA, JANELA_9_AS_12, [], 180); // 3h, janela só tem 3h exatas
    expect(slots).toEqual(['09:00']); // só cabe um, começando no início da janela
  });
});
