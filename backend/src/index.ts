import express from 'express';
import { env } from './config/env.js';
import { whatsappWebhookRouter } from './webhook/whatsapp.js';
import { conversasRouter } from './api/conversas.js';

// CORS mínimo, sem dependência nova — só pro painel web (dev local/rede local)
// conseguir chamar as rotas /api/*. A Evolution API não passa por aqui (chama
// direto, sem navegador no meio).
const ORIGENS_PERMITIDAS = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
];

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const origem = req.headers.origin;
  if (origem && (ORIGENS_PERMITIDAS.some((padrao) => padrao.test(origem)) || env.frontendOrigins.includes(origem))) {
    res.setHeader('Access-Control-Allow-Origin', origem);
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(whatsappWebhookRouter);
app.use(conversasRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(env.port, () => {
  console.log(`iabarber-backend ouvindo na porta ${env.port}`);
});
