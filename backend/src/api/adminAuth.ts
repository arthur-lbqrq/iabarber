import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../supabase/client.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: { id: string; nome: string };
    }
  }
}

// Protege as rotas /api/admin/* — só quem tem uma sessão válida do Supabase Auth E
// está cadastrado na tabela `admins` (admin do Corte Certo, cross-tenant — diferente
// de `barbeiros`, que é escopado a uma barbearia) passa.
export async function exigirAdminCorteCerto(req: Request, res: Response, next: NextFunction) {
  const cabecalho = req.headers.authorization;
  const token = cabecalho?.startsWith('Bearer ') ? cabecalho.slice('Bearer '.length) : null;
  if (!token) {
    res.status(401).json({ erro: 'token_ausente' });
    return;
  }

  const { data: sessao, error } = await supabase.auth.getUser(token);
  if (error || !sessao.user) {
    res.status(401).json({ erro: 'token_invalido' });
    return;
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('id, nome')
    .eq('user_id', sessao.user.id)
    .maybeSingle();

  if (!admin) {
    res.status(403).json({ erro: 'nao_e_admin' });
    return;
  }

  req.admin = admin;
  next();
}
