/**
 * Camada de reconhecimento de escrita à mão.
 *
 * Dois motores, escolhidos automaticamente conforme o navegador:
 *
 *  1. NATIVO (Handwriting Recognition API) — Chrome desktop/Android.
 *     Recebe os traços (pontos x, y, t) e devolve o texto. Rápido e preciso.
 *
 *  2. TESSERACT.js — funciona em qualquer navegador, inclusive Safari/iPad.
 *     Faz OCR sobre a IMAGEM do que foi escrito. Roda 100% no dispositivo.
 *     Melhor com letra de forma; a cursiva é mais difícil.
 *
 * Cada motor recebe `{ strokes, getImage }` e usa só o que precisa, então
 * a interface (App.jsx) não muda ao trocar de motor. No futuro dá para
 * plugar um motor de nuvem (ex.: Google Vision) do mesmo jeito.
 */

/** A API nativa existe neste navegador? (Chrome/Android; não existe no iOS/Safari) */
export function isNativeSupported() {
  return typeof navigator !== 'undefined' && 'createHandwritingRecognizer' in navigator;
}

/** Idioma reconhecível pela API nativa (cai para 'en' se 'pt' não existir). */
export async function queryBestLanguage(preferred = ['pt', 'en']) {
  if (!isNativeSupported() || !navigator.queryHandwritingRecognizerSupport) {
    return preferred[0];
  }
  for (const lang of preferred) {
    try {
      const support = await navigator.queryHandwritingRecognizerSupport({
        languages: [lang],
        alternatives: false,
      });
      if (support && support.languages !== false) return lang;
    } catch {
      /* tenta o próximo */
    }
  }
  return preferred[0];
}

/* ----------------------- Motor nativo (Chrome) ----------------------- */
async function recognizeNative({ strokes }, { language = 'pt' } = {}) {
  const recognizer = await navigator.createHandwritingRecognizer({ languages: [language] });
  const drawing = recognizer.startDrawing({
    languages: [language],
    recognitionType: 'text',
    inputType: 'mouse',
    alternatives: 3,
    textContext: '',
  });

  for (const stroke of strokes) {
    if (!stroke.length) continue;
    const hwStroke = new window.HandwritingStroke();
    for (const p of stroke) hwStroke.addPoint({ x: p.x, y: p.y, t: p.t });
    drawing.addStroke(hwStroke);
  }

  const predictions = await drawing.getPrediction();
  drawing.clear();
  if (recognizer.finish) recognizer.finish();

  if (!predictions || predictions.length === 0) return { text: '', alternatives: [] };
  return {
    text: (predictions[0].text || '').trim(),
    alternatives: predictions.slice(1).map((p) => p.text).filter(Boolean),
  };
}

/* --------------------- Motor Tesseract (iPad etc.) --------------------- */
// Códigos de idioma do Tesseract diferem da API nativa.
const TESS_LANG = { pt: 'por', en: 'eng' };

async function recognizeTesseract({ getImage }, { language = 'pt', onProgress } = {}) {
  const { default: Tesseract } = await import('tesseract.js');
  const image = await getImage();
  const lang = TESS_LANG[language] || 'por';

  const { data } = await Tesseract.recognize(image, lang, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') onProgress(m.progress);
    },
  });

  const text = (data.text || '').replace(/\n{2,}/g, '\n').trim();
  return { text, alternatives: [] };
}

/* ---------------------- Seleção automática do motor ---------------------- */
export function getRecognitionEngine() {
  if (isNativeSupported()) {
    return {
      id: 'native',
      label: 'Reconhecimento nativo (Chrome)',
      available: true,
      needsImage: false,
      recognize: recognizeNative,
    };
  }
  return {
    id: 'tesseract',
    label: 'Reconhecimento no dispositivo (Tesseract)',
    available: true,
    needsImage: true,
    recognize: recognizeTesseract,
  };
}
