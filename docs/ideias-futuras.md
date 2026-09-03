# Ideias futuras

Registro de ideias levantadas mas **não decididas/implementadas** — diferente de
`docs/decisoes.md` (quando existir), que é pra decisões já tomadas.

## Bento no Instagram (DM)

Perguntado em 2026-09-03: dá pra rodar a mesma IA (Bento) respondendo mensagens
diretas do Instagram, além do WhatsApp?

**Resposta: sim, é possível, mas é um caminho técnico diferente do WhatsApp:**

- **Não existe atalho não-oficial equivalente ao Evolution API/Baileys pro
  Instagram.** A única via viável é a API oficial da Meta (Instagram Messaging API,
  parte do Graph API — mesma família da WhatsApp Business API oficial, que o
  projeto já documenta como migração futura antes de vender pra clientes reais).
- Isso exige: conta comercial do Instagram vinculada a uma Página do Facebook, um
  app na Meta, e aprovação de revisão do app pra mandar mensagem além de um
  punhado de contas de teste (processo com prazo, não é imediato).
- **O que já facilita:** a lógica da IA (`ai/claude.ts`, tools, agendamento) já é
  desacoplada de canal — ela recebe um identificador + texto, devolve texto. Não
  precisa reescrever a inteligência, só a "borda".
- **O que exigiria trabalho real:**
  1. Novo webhook (`webhook/instagram.ts` ou similar) parseando o formato de
     payload da Meta (diferente do formato da Evolution API).
  2. Novo cliente de envio de mensagem (equivalente a `enviarMensagemTexto`, mas
     pra API do Instagram).
  3. **O ponto mais estrutural:** hoje `clientes` é identificado por `telefone`
     (chave única por barbearia, é como toda tool resolve "quem é esse cliente").
     Instagram não dá número de telefone, só um ID opaco (IGSID). Precisaria
     generalizar esse conceito — algo como uma coluna `canal` +
     `identificador_externo` em vez de assumir telefone sempre — o que toca
     `criarAgendamento.ts`, `buscarAgendamentoCliente.ts`,
     `buscarBarbeiroPorTelefone.ts` (ou um equivalente) e a lógica de modo
     admin/cliente em `ai/claude.ts`.

**Não implementado.** Quando/se decidir seguir, o próximo passo é o mesmo padrão já
usado nas outras funcionalidades grandes deste projeto: eu proponho um plano por
etapas antes de mexer em código.
