/**
 * Camada de reconhecimento de escrita à mão.
 *
 * A v1 usa a Handwriting Recognition API nativa do navegador (Chrome/Android):
 * ela recebe os traços (pontos x, y, t) capturados no canvas e devolve o texto.
 * Roda offline, é gratuita e privada.
 *
 * A abstração `RecognitionEngine` foi feita para que, no futuro, seja possível
 * plugar outro motor (ex.: uma API de nuvem como Google Vision) sem mexer na UI:
 * basta criar outro objeto com o mesmo método `recognize(strokes)`.
 */

/** Verifica se a API nativa existe neste navegador. */
export function isNativeSupported() {
  return typeof navigator !== 'undefined' && 'createHandwritingRecognizer' in navigator;
}

/**
 * Descobre se o navegador consegue reconhecer no idioma pedido.
 * Retorna o idioma utilizável (pode cair para 'en' se 'pt' não existir) ou null.
 */
export async function queryBestLanguage(preferred = ['pt', 'en']) {
  if (!isNativeSupported() || !navigator.queryHandwritingRecognizerSupport) {
    return isNativeSupported() ? preferred[0] : null;
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
  return null;
}

/**
 * Motor nativo. Converte os traços do canvas no formato da API e devolve
 * o texto reconhecido (mais alternativas, quando disponíveis).
 *
 * @param {Array<Array<{x:number,y:number,t:number}>>} strokes
 * @returns {Promise<{ text: string, alternatives: string[] }>}
 */
async function recognizeNative(strokes, { language = 'pt' } = {}) {
  const recognizer = await navigator.createHandwritingRecognizer({
    languages: [language],
  });

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
    for (const p of stroke) {
      hwStroke.addPoint({ x: p.x, y: p.y, t: p.t });
    }
    drawing.addStroke(hwStroke);
  }

  const predictions = await drawing.getPrediction();
  drawing.clear();
  if (recognizer.finish) recognizer.finish();

  if (!predictions || predictions.length === 0) {
    return { text: '', alternatives: [] };
  }

  return {
    text: predictions[0].text || '',
    alternatives: predictions.slice(1).map((p) => p.text).filter(Boolean),
  };
}

/**
 * Retorna o motor de reconhecimento adequado ao ambiente.
 * Hoje só existe o nativo; amanhã este ponto escolhe entre nativo/nuvem.
 */
export function getRecognitionEngine() {
  if (isNativeSupported()) {
    return {
      id: 'native',
      label: 'Reconhecimento nativo (Chrome)',
      available: true,
      recognize: recognizeNative,
    };
  }
  return {
    id: 'unsupported',
    label: 'Não suportado neste navegador',
    available: false,
    async recognize() {
      throw new Error(
        'Seu navegador não tem reconhecimento de escrita nativo. ' +
          'Use o Chrome (PC/Android) ou aguarde o suporte à nuvem.'
      );
    },
  };
}
