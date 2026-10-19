import React, { useEffect, useRef, useState } from 'react';
import type { PDFPageItem } from '../logic/pageOperations';
import {
  renderPdfPageToDataUrl,
  synthesizeSinglePagePdfBytes,
} from '../utils/pdfEngine';

interface PdfPageCanvasProps {
  page: PDFPageItem;
  onCacheThumbnail?: (
    pageId: string,
    dataUrl: string,
    pdfBytesBase64: string
  ) => void;
}

/**
 * Lazily renders the true PDF page content via pdf.js (pdfjs-dist) onto a <canvas> / Data URI image.
 * Uses IntersectionObserver so large multi-page documents never block the main UI thread.
 */
export const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({
  page,
  onCacheThumbnail,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [renderedDataUrl, setRenderedDataUrl] = useState<string | undefined>(
    page.thumbnailDataUrl
  );
  const [isRendering, setIsRendering] = useState<boolean>(!page.thumbnailDataUrl);

  // Observe visibility with generous rootMargin so pages render smoothly as user scrolls
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '240px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Sync if page.thumbnailDataUrl is already populated from eager import
  useEffect(() => {
    if (page.thumbnailDataUrl) {
      setRenderedDataUrl(page.thumbnailDataUrl);
      setIsRendering(false);
    }
  }, [page.thumbnailDataUrl]);

  // Draw the rendered Data URI onto the live <canvas> element so both <canvas> and data URI are present
  useEffect(() => {
    if (!renderedDataUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width || 340;
      canvas.height = img.height || 440;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = renderedDataUrl;
  }, [renderedDataUrl]);

  // Perform non-blocking pdf.js rendering when visible and not yet cached
  useEffect(() => {
    if (!isVisible || renderedDataUrl) return;

    let cancelled = false;
    setIsRendering(true);

    (async () => {
      try {
        const pdfBase64 =
          page.pdfBytesBase64 || (await synthesizeSinglePagePdfBytes(page));
        if (cancelled) return;

        const pageIdx =
          typeof page.sourcePageIndex === 'number' ? page.sourcePageIndex : 0;
        const dataUrl = await renderPdfPageToDataUrl(pdfBase64, pageIdx, 340);
        if (cancelled) return;

        setRenderedDataUrl(dataUrl);
        setIsRendering(false);
        onCacheThumbnail?.(page.id, dataUrl, pdfBase64);
      } catch {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isVisible,
    renderedDataUrl,
    page,
    onCacheThumbnail,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        transform: `rotate(${page.rotation}deg) scale(${
          page.rotation % 180 !== 0 ? 0.74 : 1
        })`,
      }}
      data-rendered={renderedDataUrl ? 'true' : 'false'}
      className="w-full h-full bg-white rounded-xs shadow-xs border border-slate-200/95 flex items-center justify-center overflow-hidden transition-transform duration-200 origin-center relative"
    >
      {/* Live <canvas> rendered by pdf.js */}
      <canvas
        ref={canvasRef}
        data-testid={`pdf-canvas-${page.id}`}
        aria-label={`Rendered PDF preview for ${page.title}`}
        className={`w-full h-full object-contain transition-opacity duration-150 ${
          renderedDataUrl ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Lightweight skeleton while worker rasterizes off-thread */}
      {isRendering && !renderedDataUrl && (
        <div className="absolute inset-0 p-3 flex flex-col justify-between bg-white animate-pulse">
          <div className="space-y-2">
            <div className="h-2 w-16 bg-slate-200 rounded-xs" />
            <div className="h-3 w-3/4 bg-slate-200 rounded-xs" />
          </div>
          <div className="space-y-1.5 my-auto">
            <div className="h-16 w-full bg-slate-100 rounded-xs" />
            <div className="h-2 w-5/6 bg-slate-100 rounded-xs" />
            <div className="h-2 w-2/3 bg-slate-100 rounded-xs" />
          </div>
          <div className="h-2 w-1/2 bg-slate-100 rounded-xs" />
        </div>
      )}
    </div>
  );
};
