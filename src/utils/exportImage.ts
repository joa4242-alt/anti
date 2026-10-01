import type { BusTemplate, DrawSession } from '../types/bus';
import { formatDate, getSeatGrid } from './resultRows';

const FONT_FAMILY =
  "'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', system-ui, sans-serif";

const SCALE = 2; // 고해상도 (레티나/인쇄용)
const PADDING = 32;
const CELL_W = 112;
const CELL_H = 64;
const GAP = 10;
const TITLE_H = 70;
const FRONT_H = 44;
const REAR_H = 40;

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// 칸 너비에 맞도록 글자 크기를 줄여 가며 그린다
const fillFittedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxWidth: number,
  fontSize: number
) => {
  let size = fontSize;
  do {
    ctx.font = `700 ${size}px ${FONT_FAMILY}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  } while (size > 10);
  ctx.fillText(text, cx, cy, maxWidth);
};

/**
 * 버스형 배정표를 흰 배경 이미지로 그립니다.
 */
export const renderResultCanvas = (
  template: BusTemplate,
  session: DrawSession
): HTMLCanvasElement => {
  const nameById = new Map(session.students.map((s) => [s.id, s.name]));
  const nameBySeat = new Map(
    session.assignments.map((a) => [a.seatId, nameById.get(a.studentId) ?? ''])
  );
  const grid = getSeatGrid(template);

  const gridW = CELL_W * 5 + GAP * 4;
  const gridH = CELL_H * grid.length + GAP * (grid.length - 1);
  const width = PADDING * 2 + gridW;
  const height = PADDING * 2 + TITLE_H + FRONT_H + GAP * 2 + gridH + REAR_H;

  const canvas = document.createElement('canvas');
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이미지를 만들 수 없습니다. (Canvas 미지원)');
  ctx.scale(SCALE, SCALE);

  // 배경
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 제목
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 24px ${FONT_FAMILY}`;
  ctx.fillText(`🚌 ${template.name} 자리 배정표`, width / 2, PADDING + 18);
  ctx.fillStyle = '#64748b';
  ctx.font = `500 14px ${FONT_FAMILY}`;
  ctx.fillText(
    `${formatDate(session.createdAt)} · 학생 ${session.assignments.length}명`,
    width / 2,
    PADDING + 50
  );

  // 앞쪽 (운전석 / 출입문)
  let y = PADDING + TITLE_H;
  ctx.fillStyle = '#e0f2fe';
  roundRect(ctx, PADDING, y, gridW, FRONT_H, 10);
  ctx.fill();
  ctx.fillStyle = '#0369a1';
  ctx.font = `700 15px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText('🛞 운전석', PADDING + 16, y + FRONT_H / 2);
  ctx.textAlign = 'right';
  ctx.fillText('출입문 🚪', PADDING + gridW - 16, y + FRONT_H / 2);
  ctx.textAlign = 'center';
  ctx.fillText('▲ 앞', width / 2, y + FRONT_H / 2);

  // 좌석
  y += FRONT_H + GAP * 2;
  grid.forEach((row, rowIndex) => {
    row.forEach((seat, colIndex) => {
      if (!seat) return;
      const x = PADDING + colIndex * (CELL_W + GAP);
      const top = y + rowIndex * (CELL_H + GAP);
      const name = nameBySeat.get(seat.id);

      roundRect(ctx, x, top, CELL_W, CELL_H, 10);
      if (name) {
        ctx.fillStyle = '#ecfdf5';
        ctx.fill();
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.textAlign = 'center';
      ctx.fillStyle = name ? '#047857' : '#94a3b8';
      ctx.font = `700 12px ${FONT_FAMILY}`;
      ctx.fillText(String(seat.number).padStart(2, '0'), x + CELL_W / 2, top + 16);

      if (name) {
        ctx.fillStyle = '#0f172a';
        fillFittedText(ctx, name, x + CELL_W / 2, top + 41, CELL_W - 12, 18);
      }
    });
  });

  // 뒤쪽
  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 13px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('▼ 뒤', width / 2, y + gridH + REAR_H / 2 + 4);

  return canvas;
};

/**
 * 배정표 이미지를 PNG 파일로 내려받습니다.
 */
export const downloadResultImage = (template: BusTemplate, session: DrawSession) =>
  new Promise<void>((resolve, reject) => {
    const canvas = renderResultCanvas(template, session);
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('이미지를 만들지 못했습니다.'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `버스자리_${template.capacity}인승_${formatDate(session.createdAt)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, 'image/png');
  });
