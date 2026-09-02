import express from 'express';
import { env } from './config/env.js';
import { whatsappWebhookRouter } from './webhook/whatsapp.js';

const app = express();
app.use(express.json());
app.use(whatsappWebhookRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(env.port, () => {
  console.log(`iabarber-backend ouvindo na porta ${env.port}`);
});
