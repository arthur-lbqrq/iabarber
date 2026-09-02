# Handoff: Corte Certo — Identidade visual e aplicações

## Visão geral
Identidade visual de **Corte Certo**, produto de agendamento automático via WhatsApp com IA para barbearias no Brasil. O bundle contém o board de marca completo (logotipo, ícone/avatar, cor, tipografia, tom de voz) e duas aplicações de referência: o **painel web escuro** do dono da barbearia e uma **conversa simulada de WhatsApp** com a voz da marca.

Posicionamento: masculino, preciso, moderno — sem clichê vintage de barbearia. A IA é o motor invisível; a marca vende atendimento impecável e agenda cheia.

## Sobre os arquivos de design
Os arquivos deste bundle são **referências de design feitas em HTML** — protótipos que mostram aparência e comportamento pretendidos, **não código de produção para copiar**. A tarefa é **recriar esses designs no ambiente já existente do codebase** (React, Vue, SwiftUI, nativo etc.), usando seus padrões e bibliotecas. Se ainda não existe ambiente, escolha o framework mais adequado e implemente ali.

`Corte Certo - Identidade.dc.html` depende de `support.js` (runtime do ambiente de design). Abra o HTML direto no navegador para ver o design; ignore o runtime na implementação.

## Fidelidade
**Alta fidelidade (hifi).** Cores, tipografia, espaçamento e estados estão finais. O painel e a conversa devem ser recriados fielmente (valores exatos abaixo). O board de marca (seções 01–04) é documentação, não tela de produto — não precisa ser implementado, serve como fonte de verdade dos tokens.

## Design tokens

### Cores
| Papel | Hex | Uso |
| --- | --- | --- |
| Grafite | `#1B1B1F` | Base dominante (~70% da superfície), fundo de cards e painel |
| Grafite fundo | `#131317` | Fundo da página, um passo abaixo do card |
| Superfície elevada | `#202027` | Cards de métrica dentro do painel |
| Superfície nav | `#161619` | Sidebar do painel |
| Item ativo nav | `#22222A` | Fundo do item de menu selecionado |
| Borda | `#2A2A31` | Borda padrão de card |
| Borda interna | `#26262D` | Divisórias de linha e borda de sidebar |
| Borda hover | `#3A3A44` / `#2F2F38` | Botão secundário, borda de ícone |
| Aço | `#6E7681` | Texto secundário, ícones inativos, legendas |
| Aço claro | `#8A9099` | Texto de célula secundária no painel |
| Cinza-texto | `#A9AEB6` | Parágrafo de apoio sobre grafite |
| Gelo | `#F5F5F3` | Texto principal sobre escuro; fundo claro da conversa |
| Verde-sinal | `#0FBFA0` | **Só estado**: confirmado, concluído, conectado. Nunca em botão |
| Verde-sinal texto | `#42D9BE` | Texto do chip verde sobre fundo escuro |
| Verde-sinal tinta | `rgba(15,191,160,.13)` fundo, `rgba(15,191,160,.30)` borda | Chip "Confirmado" |
| Azul-ação | `#2D6CDF` | **Só ação**: botões primários e links. Hover `#4680EA`, link hover `#5C8FEA` |
| Terracota | `#E07A5F` | Alerta/cancelamento. Texto `#E4907A`, fundo `rgba(224,122,95,.12)`, borda `rgba(224,122,95,.28)` |
| Aço tinta | `rgba(110,118,129,.16)` fundo, `#34343D` borda | Chip "Aguardando" |

Regra crítica: **azul só clica, verde só informa.** Nunca um botão verde — evita confundir "confirmar" com "confirmado". Terracota é a única cor fora da paleta base, existe para não usar vermelho puro.

Cores da conversa (fundo claro):
- Fundo do chat `#F5F5F3`; barra de composição `#F0F0EC` com topo `#E0E0DB`
- Bolha recebida `#FFFFFF`, texto `#1B1B1F`, sombra `0 1px 1px rgba(27,27,31,.08)`
- Bolha da marca `#D6F4EC`, texto `#123C36`, timestamp `#5E8A82`
- Separador de data: fundo `#E6E6E2`, texto `#6E7681`
- Botão de envio: círculo `#0FBFA0` 34px, seta `#0B2B26` traço 2.4
- Botões de resposta rápida: fundo `#FFFFFF`, borda `#D8DDE4`, texto azul `#2D6CDF` (primário) ou `#6E7681` (secundário); hover `#EEF3FC` / `#ECECE8`

### Tipografia
- **Títulos:** Sora — 600 para display/lockup/rótulo, 500 para título de seção. Google Fonts, pesos 400/500/600/700.
- **Texto:** Inter — 400/500/600.
- Escala: 56 (H1 board) / 52 (display) / 34 (wordmark) / 32 (número de métrica) / 26 (H2) / 24 (título do painel) / 17 (corpo) / 15 / 14 (corpo do painel) / 13 (legenda) / 12 (metadado) / 11 (timestamp).
- Tracking negativo obrigatório em Sora: `-0.02em` em títulos de seção, `-0.03em` a `-0.04em` em display, wordmark e números grandes. É o que dá o ar de precisão.
- `line-height`: 1.0–1.05 em display, 1.45 em bolhas de conversa, 1.55–1.65 em corpo.
- Números de métrica e horários: `font-variant-numeric: tabular-nums`.
- Rótulos em caixa alta usam `letter-spacing: .1em`, 12px, weight 600, cor Aço.

### Espaçamento, raio e sombra
- Raio: 999px (chip/pill), 12–14px (card), 11px (card de métrica), 9px (botão), 8px (item de nav), 13px no ícone 48px de viewBox (≈27% — app icon grande usa 44px sobre 176px), 12px 12px 12px 3px nas bolhas (cauda no canto do remetente).
- Gaps: 96px entre seções do board, 28px dentro de seção, 20px entre cards, 12–14px em grades internas, 9px entre bolhas.
- Padding: 64px 56px 96px na página; 40px 32px em card de logo; 24–36px em card de conteúdo; 26px 28px no conteúdo do painel; 22px 16px na sidebar; 9px 12px na bolha.
- Sombra: `0 18px 40px rgba(0,0,0,.45)` só no app icon grande. Em fundo escuro, elevação é borda + escurecimento ambiente — não empilhar sombras.

## Logotipo e ícone

### A marca
Traço único e geométrico: uma **bolha de conversa** contendo um **checkmark cujas duas hastes se cruzam no pivô** — a tesoura fechando vira confirmação. Sem realismo, sem ornamento. Proibido: navalha, poste de barbeiro, tesoura desenhada, serifa, script, marrom/couro, gradiente roxo-azul, robô, circuito.

SVG (viewBox `0 0 48 48`, `fill="none"`):
```svg
<path d="M17 10 H31 A9 9 0 0 1 40 19 V26 A9 9 0 0 1 31 35 H21 L12 42 L14 35 A9 9 0 0 1 8 26 V19 A9 9 0 0 1 17 10 Z"
      stroke="#F5F5F3" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M16.5 20.5 L23.5 30.5" stroke="#0FBFA0" stroke-width="2.8" stroke-linecap="round"/>
<path d="M32.5 15 L19.5 30.5" stroke="#0FBFA0" stroke-width="2.8" stroke-linecap="round"/>
<circle cx="21.3" cy="27.6" r="1.5" fill="#1B1B1F"/> <!-- o "parafuso": mesma cor do fundo -->
```

Escalonamento do traço (o desenho engrossa quando encolhe):
| Tamanho | stroke bolha | stroke hastes | parafuso |
| --- | --- | --- | --- |
| ≥52px | 2.6 | 2.8 | sim, r=1.5–1.6 |
| 36–38px | 3.0 | 3.2 | sim |
| 24–26px | 3.4 | 3.6 | **não** |
| 17–20px | 4.0 | 4.2 | não |

Tamanho mínimo do ícone: 20px. Área de respiro ao redor do logo: sempre a altura da bolha do ícone.

Inversões permitidas: mark inteiro em `#1B1B1F` sobre Gelo; mark inteiro em `#0B2B26` sobre Verde-sinal. Em monocromático, as hastes assumem a cor da bolha.

### Variações do logotipo
1. **Principal** — ícone 52px + "Corte Certo" em Sora 600, 34px, `-0.035em`, gap 16px. Uso padrão.
2. **Dois pesos** — wordmark isolado: "Corte" em 600 (`#F5F5F3`) + " Certo" em 400 (`#6E7681`), 34px, `-0.035em`. A quebra de peso separa as palavras sem espaço extra nem cor.
3. **Empilhado monocromático** — ícone 40px acima de "Corte / Certo" em Sora 600, 26px, `-0.03em`, `line-height:1.05`, uma cor só. Para espaços estreitos, gravação, bordado.

Nome alternativo documentado (rota "IA explícita"): `Barber.IA` / `Corte.IA`, com o sufixo `.IA` em Verde-sinal sobre wordmark em Aço. Recomendação: ficar com **Corte Certo**.

## Telas

### 1. Painel web — Agenda (dashboard escuro)
**Propósito:** o dono da barbearia vê o dia, o volume de confirmações e os próximos horários; cria agendamento manual quando precisa.

**Layout:** card de raio 14px, borda `#2A2A31`, altura mínima 560px, largura de design ≥720px. Flex horizontal: sidebar fixa de 196px + área de conteúdo flexível (`min-width:0`, padding 26px 28px, gap 22px em coluna).

**Sidebar** (`#161619`, borda direita `#26262D`, padding 22px 16px, gap 26px):
- Lockup compacto: ícone 24px (stroke 3.4/3.6, sem parafuso) + nome em Sora 600, 14px, `-0.02em`, gap 10px, padding lateral 6px.
- Nav em coluna, gap 2px: Agenda (ativo), Conversas, Clientes, Equipe, Ajustes. Item: padding 9px 10px, raio 8px, 14px. Ativo: fundo `#22222A`, texto `#F5F5F3`, weight 500. Inativo: texto `#8A9099`; hover fundo `#1E1E24` + texto `#F5F5F3`.
- Rodapé (`margin-top:auto`): pill "WhatsApp conectado" — fundo `rgba(15,191,160,.09)`, borda `rgba(15,191,160,.22)`, raio 9px, padding 10px, ponto 7px `#0FBFA0`, texto 12px `#42D9BE`.

**Cabeçalho do conteúdo:** à esquerda "Terça, 1 de setembro" (Sora 600, 24px, `-0.03em`) + "Barbearia Corte Alto · Vila Madalena" (13px, `#6E7681`). À direita botão primário "Novo agendamento" (fundo `#2D6CDF`, texto `#F5F5F3`, Sora 600 13px, padding 10px 16px, raio 9px, hover `#4680EA`).

**Cards de métrica:** grade `repeat(auto-fit, minmax(120px, 1fr))`, gap 12px, 4 cards. Cada card: fundo `#202027`, borda `#2A2A31`, raio 11px, padding 16px 16px 18px, coluna com gap 8px — rótulo 12px `#6E7681`, número Sora 600 32px `-0.04em` tabular, legenda 12px `#8A9099`.

| Rótulo | Número | Legenda | Nota |
| --- | --- | --- | --- |
| Hoje | 27 | agendamentos | |
| Confirmados | 24 | 89% da agenda | número em `#0FBFA0` |
| Faltas evitadas | 6 | no mês, via lembrete | |
| Resposta média | 8s | 24 h por dia | |

**Lista "Próximos horários":** cabeçalho com título Sora 600 15px `-0.01em` e link "Ver dia inteiro" (13px `#2D6CDF`, hover `#5C8FEA`), padding-bottom 10px. Linhas em grade `58px 1fr 1.2fr auto`, gap 14px, padding 12px 4px, `border-top: 1px solid #26262D`, 14px.

| Hora (`#6E7681`, tabular) | Cliente (weight 500) | Serviço (`#8A9099`) | Estado |
| --- | --- | --- | --- |
| 09:30 | Rafael Marques | Corte + barba · Diego | Confirmado |
| 10:15 | Tiago Bastos | Degradê · Alan | Confirmado |
| 11:00 | Léo Andrade | Corte · Diego | Aguardando |
| 11:45 | Marcos Vieira | Barba · Alan | Confirmado |
| 13:30 | Pedro Sant'Ana | Corte + sobrancelha · Diego | Remarcou |

**Chips de estado:** inline-flex, gap 6px, raio 999px, padding 4px 10px, 12px weight 500, com ponto de 5px na cor cheia.
- Confirmado — fundo `rgba(15,191,160,.13)`, texto `#42D9BE`, ponto `#0FBFA0`
- Aguardando — fundo `rgba(110,118,129,.16)`, texto `#A9AEB6`, ponto `#6E7681`
- Cancelado/Remarcou — fundo `rgba(224,122,95,.12)`, texto `#E4907A`, ponto `#E07A5F`

(Na seção 03 do board os chips aparecem em versão maior: padding 6px 12px, 13px, gap 7px, ponto 6px, com borda visível.)

### 2. Conversa de WhatsApp (aplicação da marca)
**Propósito:** demonstrar voz da marca e o fluxo agendar → confirmar → lembrar. Largura de design ~340px (mínimo 300px), dentro de card grafite com padding 20px.

Moldura: raio 12px, borda `#26262D`, altura mínima 520px, coluna.

**Cabeçalho** (fundo `#1B1B1F`, padding 12px 14px, gap 11px, borda inferior `#26262D`): avatar circular 38px `#26262D` com o ícone 26px; nome "Barbearia Corte Alto" (Sora 600 14px) e status "responde na hora" (11px `#0FBFA0`).

**Corpo** (fundo `#F5F5F3`, padding 16px 14px, gap 9px, coluna):
- Separador "ontem" centralizado.
- Recebida: "Fala! Tem horário amanhã de manhã?"
- Marca: "Oi, Rafael! Tenho **9h30** e **11h** com o Diego. Qual fica melhor?" — 09:12 ✓✓
- Recebida: "9h30 tá ótimo"
- Marca: "Fechado. Corte + barba, amanhã 9h30 com o Diego. Se precisar mudar, é só me falar por aqui." — 09:13 ✓✓
- Separador "hoje".
- Marca: "Bom dia, Rafael! Seu horário é hoje às 9h30. Confirma pra mim?" — 07:00 ✓✓
- Respostas rápidas alinhadas à esquerda, gap 7px: **Confirmar** (texto azul) e **Remarcar** (texto aço).

Bolha recebida: `align-self:flex-start`, max-width 78%, raio `12px 12px 12px 3px`. Bolha da marca: `align-self:flex-end`, max-width 82%, raio `12px 12px 3px 12px`, timestamp alinhado à direita, 10px, `margin-top:3px`.

**Barra de composição:** placeholder "Mensagem" em pill branca (raio 999px, padding 9px 14px, 13px `#9AA0A8`) + botão de envio circular verde 34px.

## Interações e comportamento
- Hovers: botão primário `#2D6CDF → #4680EA`; botão secundário borda `#3A3A44 → #6E7681`; link `#2D6CDF → #5C8FEA`; item de nav ganha fundo `#1E1E24`; resposta rápida azul `#FFF → #EEF3FC`, cinza `#FFF → #ECECE8`.
- Foco de teclado: anel de 2px em `#2D6CDF` com offset de 2px em todo elemento interativo. Nunca o azul padrão do navegador.
- Seleção de texto: `::selection` com `rgba(15,191,160,.28)`.
- Estados de agendamento: Aguardando → Confirmado (chip troca de aço para verde quando o cliente responde "Confirmar") → Remarcou/Cancelado (terracota). A transição do chip é a única animação necessária: fade de cor ~150ms.
- Responsivo: painel e conversa ficam lado a lado quando cabe (painel exige ≥720px); abaixo disso a conversa quebra para a linha seguinte. Nada de scroll horizontal — verificar `scrollWidth === clientWidth` nas linhas da agenda.

## Estado
Para o painel: data selecionada; lista de agendamentos (`{hora, cliente, serviço, profissional, status}`); métricas derivadas (total do dia, confirmados + %, faltas evitadas no mês, tempo médio de resposta); status da conexão do WhatsApp (conectado/desconectado — o pill vira terracota quando cai).
Para a conversa: fila de mensagens (`{autor, texto, hora, entregue/lida}`) e o estado do agendamento associado, que muda ao clicar em Confirmar/Remarcar.

## Tom de voz
Direto, caloroso, confiável. Primeiro nome sempre. Frase curta. **Uma pergunta por mensagem.** Nunca dizer que é um robô — e nunca fingir que não é, se perguntarem.

- Sim: "Oi, Rafael! Tenho 9h30 e 11h amanhã. Qual fica melhor pra você?"
- Não: "Olá! Sou o assistente virtual da barbearia. Digite 1 para agendar."

## Assets
Nenhuma imagem externa. O mark é SVG inline (código acima). Fontes: **Sora** e **Inter** via Google Fonts (`Sora:wght@400;500;600;700` + `Inter:wght@400;500;600`) — substituir por self-host no codebase de produção. Sem ícones de biblioteca: a seta do botão de envio é SVG inline (`M3.5 12 L20 12 M13.5 5.5 L20 12 L13.5 18.5`, stroke 2.4, caps/joins redondos).

## Arquivos
- `Corte Certo - Identidade.dc.html` — board completo: 01 Logotipo, 02 Ícone e avatar, 03 Cor em uso, 04 Tipografia, 05 Aplicação (painel + conversa), rodapé com regras de uso.
- `support.js` — runtime do ambiente de design; necessário só para abrir o HTML localmente, irrelevante para a implementação.
