export interface Barbeiro {
  id: string;
  barbearia_id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
}

export interface AgendamentoDoDia {
  id: string;
  inicio: string;
  fim: string;
  status: string;
  clientes: { nome: string | null; telefone: string } | null;
  servicos: { nome: string } | null;
}

export interface HorarioDisponivel {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
}

export interface Cliente {
  id: string;
  nome: string | null;
  telefone: string;
  created_at: string;
}

export interface Servico {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco_centavos: number;
  preco_variavel: boolean;
  ativo: boolean;
}

export const NOMES_DIA_SEMANA = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];
