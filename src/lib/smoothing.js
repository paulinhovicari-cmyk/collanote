/**
 * Suavização de traço: transforma a sequência de pontos crua (tremida)
 * numa curva lisa usando splines de Catmull-Rom. Isso deixa a própria
 * escrita à mão mais bonita, antes mesmo do reconhecimento.
 */

/**
 * Desenha um traço suavizado no contexto do canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x:number,y:number}>} points
 * @param {{ color?: string, width?: number }} opts
 */
export function drawSmoothStroke(ctx, points, { color = '#1f2937', width = 3 } = {}) {
  if (!points || points.length === 0) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (points.length < 3) {
    // Poucos pontos: apenas liga em linha reta (ou um ponto).
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    if (points.length === 1) {
      ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  // Catmull-Rom convertido em curvas de Bézier cúbicas.
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }

  ctx.stroke();
}
