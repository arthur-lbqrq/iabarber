import { Router } from 'express';
import { supabase } from '../supabase/client.js';
import { exigirBarbeiroLogado } from './auth.js';

export const numerosBloqueadosRouter = Router();
numerosBloqueadosRouter.use('/api/numeros-bloqueados', exigirBarbeiroLogado);

numerosBloqueadosRouter.get('/api/numeros-bloqueados', async (req, res) => {
  const { data, error } = await supabase
    .from('numeros_bloqueados')
    .select('id, telefone, motivo, created_at')
    .eq('barbearia_id', req.barbeiro!.barbearia_id)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ erro: error.message });
    return;
  }
  res.json({ numeros_bloqueados: data });
});

numerosBloqueadosRouter.post('/api/numeros-bloqueados', async (req, res) => {
  const { telefone, motivo } = req.body as { telefone?: string; motivo?: string };
  if (!telefone?.trim()) {
    res.status(400).json({ erro: 'telefone_obrigatorio' });
    return;
  }

  const { data, error } = await supabase
    .from('numeros_bloqueados')
    .insert({
      barbearia_id: req.barbeiro!.barbearia_id,
      telefone: telefone.trim(),
      motivo: motivo?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    res.status(error.code === '23505' ? 409 : 500).json({ erro: error.message });
    return;
  }
  res.status(201).json({ numero_bloqueado: data });
});

numerosBloqueadosRouter.delete('/api/numeros-bloqueados/:id', async (req, res) => {
  const { error } = await supabase
    .from('numeros_bloqueados')
    .delete()
    .eq('id', req.params.id)
    .eq('barbearia_id', req.barbeiro!.barbearia_id);

  if (error) {
    res.status(500).json({ erro: error.message });
    return;
  }
  res.status(204).end();
});
