export interface Barbearia {
  id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
  created_at: string;
}

export interface BarbeariaComContagem extends Barbearia {
  barbeiros_total: number;
  barbeiros_ativos: number;
}

export interface BarbeiroAdmin {
  id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
  user_id: string | null;
}
