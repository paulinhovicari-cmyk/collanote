import { useRef, useState, useEffect } from 'react';
import { Pen, Eraser, Undo2, Sparkles, Loader2, Copy, Check, AlertTriangle } from 'lucide-react';
import HandwritingCanvas from './components/HandwritingCanvas';
import { getRecognitionEngine, queryBestLanguage } from './lib/recognizer';
import './App.css';

const PEN_COLORS = ['#1f2937', '#4f46e5', '#dc2626', '#059669', '#d97706'];
const PEN_WIDTHS = [2, 3, 5, 8];

const HANDWRITING_FONTS = [
  { id: 'caveat', label: 'Caveat', family: "'Caveat', cursive" },
  { id: 'dancing', label: 'Dancing Script', family: "'Dancing Script', cursive" },
  { id: 'patrick', label: 'Patrick Hand', family: "'Patrick Hand', cursive" },
  { id: 'shadows', label: 'Shadows Into Light', family: "'Shadows Into Light', cursive" },
  { id: 'kalam', label: 'Kalam', family: "'Kalam', cursive" },
];

export default function App() {
  const canvasRef = useRef(null);
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [penWidth, setPenWidth] = useState(3);

  const [engine] = useState(() => getRecognitionEngine());
  const [language, setLanguage] = useState(null);
  const [checkingSupport, setCheckingSupport] = useState(true);

  const [result, setResult] = useState(null); // { text, alternatives }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [font, setFont] = useState(HANDWRITING_FONTS[0]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const lang = await queryBestLanguage(['pt', 'en']);
      if (active) {
        setLanguage(lang);
        setCheckingSupport(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleBeautify = async () => {
    setError('');
    setResult(null);
    if (!canvasRef.current?.hasContent()) {
      setError('Escreva algo no quadro primeiro. ✍️');
      return;
    }
    if (!engine.available) {
      setError(engine.label + '. Abra no Chrome (PC/Android) para usar o reconhecimento.');
      return;
    }
    setBusy(true);
    try {
      const strokes = canvasRef.current.getStrokes();
      const res = await engine.recognize(strokes, { language: language || 'pt' });
      if (!res.text) {
        setError('Não consegui reconhecer a escrita. Tente escrever mais devagar e separado.');
      } else {
        setResult(res);
      }
    } catch (err) {
      setError(err.message || 'Falha ao reconhecer a escrita.');
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    setResult(null);
    setError('');
  };

  const handleCopy = async () => {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponível */
    }
  };

  const supportWarning = !checkingSupport && !engine.available;

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <Sparkles size={22} />
          <h1>CollaNote</h1>
        </div>
        <p className="tagline">Escreva à mão e transforme em letra bonita ✨</p>
      </header>

      {supportWarning && (
        <div className="banner warn">
          <AlertTriangle size={18} />
          <span>
            Este navegador não tem reconhecimento de escrita nativo. O quadro funciona,
            mas para <strong>embelezar a letra</strong> use o <strong>Chrome</strong> (PC/Android).
          </span>
        </div>
      )}

      <div className="workspace">
        {/* Coluna: escrever */}
        <section className="panel">
          <div className="panel-head">
            <span className="panel-title"><Pen size={16} /> Escreva aqui</span>
            <div className="toolbar">
              <div className="tool-group">
                {PEN_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${color === c ? 'on' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
              <div className="tool-group">
                {PEN_WIDTHS.map((w) => (
                  <button
                    key={w}
                    className={`width-btn ${penWidth === w ? 'on' : ''}`}
                    onClick={() => setPenWidth(w)}
                    aria-label={`Espessura ${w}`}
                  >
                    <span style={{ width: w + 2, height: w + 2 }} />
                  </button>
                ))}
              </div>
              <div className="tool-group">
                <button className="icon-btn" onClick={() => canvasRef.current?.undo()} title="Desfazer">
                  <Undo2 size={18} />
                </button>
                <button className="icon-btn" onClick={handleClear} title="Limpar">
                  <Eraser size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="canvas-frame">
            <HandwritingCanvas ref={canvasRef} color={color} penWidth={penWidth} />
            <div className="ruled-lines" aria-hidden="true" />
          </div>

          <button className="beautify-btn" onClick={handleBeautify} disabled={busy || checkingSupport}>
            {busy ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
            {busy ? 'Reconhecendo...' : 'Embelezar minha letra'}
          </button>

          {error && <p className="error-text">{error}</p>}
        </section>

        {/* Coluna: resultado */}
        <section className="panel">
          <div className="panel-head">
            <span className="panel-title"><Sparkles size={16} /> Resultado bonito</span>
            {result?.text && (
              <button className="icon-btn" onClick={handleCopy} title="Copiar texto">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            )}
          </div>

          <div className="result-card">
            {result?.text ? (
              <p className="pretty-text" style={{ fontFamily: font.family }}>
                {result.text}
              </p>
            ) : (
              <p className="result-placeholder">
                Sua letra reescrita numa fonte bonita aparecerá aqui.
              </p>
            )}
          </div>

          {result?.text && (
            <>
              <div className="font-picker">
                {HANDWRITING_FONTS.map((f) => (
                  <button
                    key={f.id}
                    className={`font-chip ${font.id === f.id ? 'on' : ''}`}
                    style={{ fontFamily: f.family }}
                    onClick={() => setFont(f)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {result.alternatives?.length > 0 && (
                <div className="alternatives">
                  <span className="alt-label">Outras leituras:</span>
                  {result.alternatives.map((alt, i) => (
                    <button
                      key={i}
                      className="alt-chip"
                      onClick={() => setResult({ ...result, text: alt })}
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <footer className="app-footer">
        {checkingSupport
          ? 'Verificando suporte...'
          : engine.available
            ? `Motor: ${engine.label}${language ? ` · idioma: ${language}` : ''}`
            : 'Modo somente escrita (sem reconhecimento neste navegador)'}
      </footer>
    </div>
  );
}
