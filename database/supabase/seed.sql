-- Dados da barbearia piloto (validação real, não é mais dado fictício de teste).
-- Nome da barbearia ainda é placeholder ("Barbearia Piloto") — ninguém te passou o
-- nome real ainda; troque aqui quando tiver.

insert into barbearias (id, nome, telefone) values
  ('00000000-0000-0000-0000-000000000001', 'Barbearia Piloto', '558100000000');

-- Telefones de Igor e Tinho são placeholders — trocar pelos números reais deles
-- antes de ativar o modo admin de verdade (é por esse telefone que o backend
-- reconhece que quem está mandando mensagem é um admin, não um cliente).
insert into barbeiros (id, barbearia_id, nome, telefone) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Igor', '558100000010'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Tinho', '558100000011');

-- preco_variavel = true quando o valor é "a partir de" (pode mudar na hora do atendimento)
insert into servicos (id, barbearia_id, nome, duracao_minutos, preco_centavos, preco_variavel) values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Barboterapia',    30,  2000, false),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Bigode',           15,   500, false),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'Botox',            60,  4000, true),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'Cabelo e Barba',   60,  4000, false),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'Corte de cabelo',  45,  2500, false),
  ('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'Hidratação',       15,  1000, false),
  ('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', 'Limpeza de pele',  15,  1500, false),
  ('00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', 'Luzes',           120,  6000, false),
  ('00000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', 'Pigmentação',      30,  3000, true),
  ('00000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', 'Platinado',       150, 10000, true),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'Progressiva',      60,  5000, true),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'Relaxamento',      30,  2500, true),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'Sobrancelha',      15,  1000, false);

-- Horário de funcionamento: segunda a sexta 9h-18h, sábado 9h-12h, domingo fechado.
-- (0=domingo .. 6=sábado) — igual pros dois barbeiros por enquanto.
insert into horarios_disponiveis (barbearia_id, barbeiro_id, dia_semana, hora_inicio, hora_fim)
select '00000000-0000-0000-0000-000000000001', barbeiro.id, dia.numero, '09:00', '18:00'
from (values
  ('00000000-0000-0000-0000-000000000010'::uuid),
  ('00000000-0000-0000-0000-000000000011'::uuid)
) as barbeiro(id)
cross join generate_series(1, 5) as dia(numero);

insert into horarios_disponiveis (barbearia_id, barbeiro_id, dia_semana, hora_inicio, hora_fim)
select '00000000-0000-0000-0000-000000000001', barbeiro.id, 6, '09:00', '12:00'
from (values
  ('00000000-0000-0000-0000-000000000010'::uuid),
  ('00000000-0000-0000-0000-000000000011'::uuid)
) as barbeiro(id);

insert into clientes (id, barbearia_id, telefone, nome) values
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '558199999999', 'Cliente Teste');

insert into planos (id, barbearia_id, nome, preco_centavos, periodicidade, descricao) values
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Mensal Corte', 8000, 'mensal', '1 corte por semana');
