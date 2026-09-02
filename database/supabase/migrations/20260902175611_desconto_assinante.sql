-- Primeira regra de negócio de assinatura implementada: assinante ativo tem desconto
-- no serviço. Precisa de duas colunas: o desconto configurado no plano, e o preço
-- final gravado no próprio agendamento (não dá pra confiar só em servicos.preco_centavos
-- depois — o preço do serviço pode mudar no futuro e o agendamento tem que manter o
-- valor real cobrado naquele momento, com ou sem desconto).

alter table planos add column desconto_percentual int not null default 0
  check (desconto_percentual >= 0 and desconto_percentual <= 100);

comment on column planos.desconto_percentual is
  'Desconto aplicado no preço do serviço pra quem tem assinatura ativa desse plano.';

alter table agendamentos add column preco_centavos int;

comment on column agendamentos.preco_centavos is
  'Preço realmente cobrado nesse agendamento (já com desconto de assinatura, se houver) — snapshot no momento da criação, não recalculado depois.';
