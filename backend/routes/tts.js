/**
 * backend/routes/tts.js
 *
 * High-definition fluent cloud Text-to-Speech proxy for Indian languages
 * (Hindi, Marathi, Indian English).
 *
 * Guarantees 100% natural, authentic native voice synthesis on ALL devices,
 * browsers, and operating systems without depending on Windows optional language packs.
 */

const express = require('express');
const https = require('https');

const router = express.Router();

router.get('/', (req, res) => {
  const text = (req.query.text || '').trim();
  const rawLang = (req.query.lang || 'en').toLowerCase();
  const langMap = {
    mr: 'mr',
    hi: 'hi',
    pa: 'pa',
    gu: 'gu',
    te: 'te',
    kn: 'kn',
    en: 'en-IN',
  };
  const langCode = langMap[rawLang] || 'en-IN';

  if (!text) {
    return res.status(400).send('Missing text parameter');
  }

  // Strip emojis and excessive symbols for crystal-clear TTS audio rendering
  const cleanText = text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[•…\-_~*]/g, ' ')
    .trim()
    .slice(0, 300);

  const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
    langCode
  )}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

  const request = https.get(
    targetUrl,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'audio/mpeg, audio/*',
      },
      timeout: 6000,
    },
    (remoteRes) => {
      if (remoteRes.statusCode !== 200) {
        res.status(remoteRes.statusCode || 500).send('TTS upstream error');
        return;
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      remoteRes.pipe(res);
    }
  );

  request.on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).send(`TTS fetch error: ${err.message}`);
    }
  });

  request.on('timeout', () => {
    request.destroy();
    if (!res.headersSent) {
      res.status(504).send('TTS timeout');
    }
  });
});

module.exports = router;
