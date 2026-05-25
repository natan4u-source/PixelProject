"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  width: number;
  height: number;
  soldCount: number;
  revealedUrl: string | null;
  hiddenColor?: string;
  containerClassName?: string;
  onSelect: (x: number, y: number) => void;
  selected: { x: number; y: number } | null;
  selectedIsSold?: boolean;
};

export function PixelGrid({
  width,
  height,
  soldCount,
  revealedUrl,
  hiddenColor = "#1c1c28",
  containerClassName,
  onSelect,
  selected,
  selectedIsSold = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const revealedImageRef = useRef<HTMLImageElement | null>(null);
  const transformRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    setImageReady(false);
    revealedImageRef.current = null;

    if (!revealedUrl || soldCount === 0) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      revealedImageRef.current = img;
      setImageReady(true);
    };
    img.onerror = () => setImageReady(false);
    img.src = revealedUrl;
  }, [revealedUrl, soldCount]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = hiddenColor;
    ctx.fillRect(0, 0, rect.width, rect.height);

    const { scale, offsetX, offsetY } = transformRef.current;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.fillStyle = hiddenColor;
    ctx.fillRect(0, 0, width, height);

    const revealed = revealedImageRef.current;
    if (revealed && imageReady) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(revealed, 0, 0, width, height);
    }

    if (selected) {
      ctx.strokeStyle = selectedIsSold ? "#ffffff" : "#f5c542";
      ctx.lineWidth = Math.max(1, 2 / scale);
      ctx.strokeRect(selected.x, selected.y, 1, 1);
    }

    ctx.restore();
  }, [hiddenColor, height, imageReady, selected, selectedIsSold, width]);

  useEffect(() => {
    draw();
  }, [draw, imageReady]);

  const fitToView = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const padding = 24;
    const scale = Math.min(
      (rect.width - padding) / width,
      (rect.height - padding) / height,
    );
    transformRef.current = {
      scale,
      offsetX: (rect.width - width * scale) / 2,
      offsetY: (rect.height - height * scale) / 2,
    };
    draw();
  }, [draw, height, width]);

  useEffect(() => {
    fitToView();
    const onResize = () => fitToView();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fitToView]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { scale, offsetX, offsetY } = transformRef.current;
    const x = Math.floor((e.clientX - rect.left - offsetX) / scale);
    const y = Math.floor((e.clientY - rect.top - offsetY) / scale);
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    onSelect(x, y);
  };

  return (
    <div
      ref={containerRef}
      className={
        containerClassName ??
        "relative h-[min(55vh,640px)] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair touch-none"
        onClick={handleClick}
      />
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-[var(--muted)]">
        {soldCount > 0
          ? `${soldCount.toLocaleString()} pixel(s) saved · click a pixel to buy`
          : "Click a pixel to buy"}
      </div>
    </div>
  );
}
