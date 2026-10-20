/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface LiveTelemetryChartProps {
  angleHistory: number[];
  targetAngle: number;
  minAcceptableAngle: number;
  maxAcceptableAngle: number;
  currentAngle: number;
  jointName: string;
}

export const LiveTelemetryChart: React.FC<LiveTelemetryChartProps> = ({
  angleHistory,
  targetAngle,
  minAcceptableAngle,
  maxAcceptableAngle,
  currentAngle,
  jointName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Padding
    const padX = 40;
    const padY = 20;
    const chartW = width - padX - 15;
    const chartH = height - padY * 2;

    // Angle mapping 0° to 180°
    const mapY = (angle: number) => {
      const clamped = Math.max(0, Math.min(180, angle));
      return padY + chartH - (clamped / 180) * chartH;
    };

    // Draw horizontal grid lines (0, 45, 90, 135, 180)
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#737373';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';

    [0, 45, 90, 135, 180].forEach((gridVal) => {
      const y = mapY(gridVal);
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();
      ctx.fillText(`${gridVal}°`, padX - 6, y + 3);
    });

    // Draw Optimal Corridor (green shaded band)
    const yTop = mapY(maxAcceptableAngle);
    const yBottom = mapY(minAcceptableAngle);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
    ctx.fillRect(padX, Math.min(yTop, yBottom), chartW, Math.abs(yBottom - yTop));

    // Draw Target Reference Line (dashed green line)
    const targetY = mapY(targetAngle);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padX, targetY);
    ctx.lineTo(width - 15, targetY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Draw live angle trajectory line
    if (angleHistory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#f5f5f5';
      ctx.lineWidth = 2;

      const step = chartW / Math.max(1, angleHistory.length - 1);
      angleHistory.forEach((val, i) => {
        const x = padX + i * step;
        const y = mapY(val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw current angle point
      const lastX = padX + (angleHistory.length - 1) * step;
      const lastY = mapY(currentAngle);

      const isInside = currentAngle >= minAcceptableAngle && currentAngle <= maxAcceptableAngle;
      ctx.fillStyle = isInside ? '#22c55e' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [angleHistory, targetAngle, minAcceptableAngle, maxAcceptableAngle, currentAngle]);

  return (
    <div className="w-full bg-neutral-950 rounded-xl border border-neutral-800 p-3">
      <div className="flex items-center justify-between text-xs font-mono mb-2">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">Графік амплітуди ({jointName}):</span>
          <span className="text-neutral-100 font-bold">{Math.round(currentAngle)}°</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Еталон {targetAngle}° ({minAcceptableAngle}..{maxAcceptableAngle}°)
          </span>
        </div>
      </div>
      <div className="w-full h-32 relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={128}
          className="w-full h-full rounded-lg block"
        />
      </div>
    </div>
  );
};
