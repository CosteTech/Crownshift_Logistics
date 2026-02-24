// Flutterwave payment skeleton (Node/Express or Cloud Function)
// This file is a template. Add FLW_SECRET_KEY to your server environment variables.
//
// Endpoints:
// POST /create-payment -> creates payment (client should call to get payment link or payload)
// POST /webhook -> receives Flutterwave payment webhooks (verify signature)
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-XXXXXXXX';

app.post('/create-payment', async (req, res) => {
  try {
    const { amount, currency, customer_email, tx_ref } = req.body;
    const payload = {
      tx_ref: tx_ref || `CS-${Date.now()}`,
      amount: amount,
      currency: currency || 'KES',
      redirect_url: process.env.WEBHOOK_BASE_URL + '/payment-callback',
      customer: { email: customer_email }
    };
    const r = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FLW_SECRET_KEY}`
      },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'failure' });
  }
});

app.post('/webhook', (req, res) => {
  console.log('webhook', req.body);
  res.sendStatus(200);
});

module.exports = app;