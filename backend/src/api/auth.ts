import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../supabase/client.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      barbeiro?: { id: string; nome: string };
    }
  }
}

// Protege as rotas /api/* — só quem tem uma sessão válida do Supabase Auth E está
// cadastrado como barbeiro (o mesmo requisito pra logar no painel web) passa.
export async function exigirBarbeiroLogado(req: Request, res: Response, next: NextFunction) {
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

  const { data: barbeiro } = await supabase
    .from('barbeiros')
    .select('id, nome')
    .eq('user_id', sessao.user.id)
    .maybeSingle();

  if (!barbeiro) {
    res.status(403).json({ erro: 'nao_e_barbeiro' });
    return;
  }

  req.barbeiro = barbeiro;
  next();
}
