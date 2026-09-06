import { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { drawSmoothStroke } from '../lib/smoothing';

/**
 * Canvas de escrita à mão.
 * - Captura traços como listas de pontos {x, y, t} (t = tempo, exigido pela API).
 * - Renderiza com suavização de curva (Catmull-Rom).
 * - Expõe métodos via ref: getStrokes(), clear(), undo().
 */
const HandwritingCanvas = forwardRef(function HandwritingCanvas(
  { color = '#1f2937', penWidth = 3 },
  ref
) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const strokesRef = useRef([]);        // traços finalizados
  const currentStroke = useRef(null);   // traço em andamento
  const drawing = useRef(false);
  const startTime = useRef(0);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const s of strokesRef.current) {
      drawSmoothStroke(ctx, s.points, { color: s.color, width: s.width });
    }
    if (currentStroke.current) {
      drawSmoothStroke(ctx, currentStroke.current.points, {
        color: currentStroke.current.color,
        width: currentStroke.current.width,
      });
    }
  }, []);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;
    redraw();
  }, [redraw]);

  useEffect(() => {
    setupCanvas();
    const onResize = () => setupCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setupCanvas]);

  const getPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      t: Math.round(performance.now() - startTime.current),
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    if (strokesRef.current.length === 0 && !currentStroke.current) {
      startTime.current = performance.now();
    }
    drawing.current = true;
    currentStroke.current = { points: [getPoint(e)], color, width: penWidth };
    redraw();
  };

  const handlePointerMove = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    // coalesced events = traço mais fiel em telas de alta taxa
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events) currentStroke.current.points.push(getPoint(ev));
    redraw();
  };

  const handlePointerUp = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    drawing.current = false;
    if (currentStroke.current && currentStroke.current.points.length > 0) {
      strokesRef.current.push(currentStroke.current);
    }
    currentStroke.current = null;
    redraw();
  };

  useImperativeHandle(ref, () => ({
    /** Retorna os traços no formato exigido pela API de reconhecimento. */
    getStrokes() {
      return strokesRef.current.map((s) => s.points);
    },
    hasContent() {
      return strokesRef.current.length > 0;
    },
    /** Gera uma imagem (dataURL) do que foi escrito, com fundo branco, para OCR. */
    toImage() {
      const src = canvasRef.current;
      const rect = src.getBoundingClientRect();
      const scale = 2; // aumenta a resolução -> OCR mais preciso
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.round(rect.width * scale));
      off.height = Math.max(1, Math.round(rect.height * scale));
      const octx = off.getContext('2d');
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, off.width, off.height);
      octx.scale(scale, scale);
      for (const s of strokesRef.current) {
        drawSmoothStroke(octx, s.points, { color: s.color, width: s.width });
      }
      return off.toDataURL('image/png');
    },
    clear() {
      strokesRef.current = [];
      currentStroke.current = null;
      redraw();
    },
    undo() {
      strokesRef.current.pop();
      redraw();
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className="hw-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
});

export default HandwritingCanvas;
