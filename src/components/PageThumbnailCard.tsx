import React from 'react';
import {
  Check,
  RotateCw,
  Copy,
  Trash2,
  ArrowLeft,
  ArrowRight,
  FileUp,
} from 'lucide-react';
import type { PDFPageItem } from '../logic/pageOperations';
import { PdfPageCanvas } from './PdfPageCanvas';

interface PageThumbnailCardProps {
  page: PDFPageItem;
  pageNumber: number;
  totalPages: number;
  isSelected: boolean;
  zoom: number;
  onSelect: (pageId: string, shiftKey: boolean) => void;
  onQuickRotateRight: (pageId: string) => void;
  onQuickDuplicate: (pageId: string) => void;
  onQuickDelete: (pageId: string) => void;
  onQuickMoveStep: (pageId: string, direction: 'left' | 'right') => void;
  onDragStart: (pageId: string) => void;
  onDragOver: (e: React.DragEvent, pageId: string, pageIndexZeroBased: number) => void;
  onDrop: (e: React.DragEvent, pageId: string, pageIndexZeroBased: number) => void;
  isDragTarget: boolean;
  fileDropSide?: 'before' | 'after' | null;
  onCacheThumbnail?: (
    pageId: string,
    dataUrl: string,
    pdfBytesBase64: string
  ) => void;
}

export const PageThumbnailCard: React.FC<PageThumbnailCardProps> = ({
  page,
  pageNumber,
  totalPages,
  isSelected,
  zoom,
  onSelect,
  onQuickRotateRight,
  onQuickDuplicate,
  onQuickDelete,
  onQuickMoveStep,
  onDragStart,
  onDragOver,
  onDrop,
  isDragTarget,
  fileDropSide,
  onCacheThumbnail,
}) => {
  const sheetWidth = Math.round((188 * zoom) / 100);
  const sheetHeight = Math.round((244 * zoom) / 100);
  const zeroBasedIndex = pageNumber - 1;

  const handleCardClick = (e: React.MouseEvent) => {
    onSelect(page.id, e.shiftKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(page.id, e.shiftKey);
    }
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(page.id)}
      onDragOver={(e) => onDragOver(e, page.id, zeroBasedIndex)}
      onDrop={(e) => onDrop(e, page.id, zeroBasedIndex)}
      data-page-card="true"
      data-testid={`page-thumbnail-${pageNumber}`}
      data-page-id={page.id}
      data-selected={isSelected ? 'true' : 'false'}
      data-rotation={page.rotation}
      className={`group relative flex flex-col items-center rounded-xl p-3 transition-all duration-150 select-none ${
        isSelected
          ? 'bg-blue-50/90 ring-2 ring-blue-600 shadow-sm'
          : isDragTarget
          ? 'bg-slate-200/80 ring-2 ring-dashed ring-blue-500'
          : 'bg-white/70 hover:bg-white ring-1 ring-slate-200/90 hover:ring-slate-300 shadow-2xs'
      }`}
    >
      {/* Inline Drop Slot Indicator (Before Card) when dragging an OS .pdf file between thumbnails */}
      {fileDropSide === 'before' && (
        <div
          data-testid={`drop-indicator-before-${pageNumber}`}
          className="pointer-events-none absolute -left-3 top-2 bottom-2 w-1.5 bg-blue-600 rounded-full z-30 flex flex-col items-center justify-center shadow-md"
        >
          <div className="bg-blue-600 text-white text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap flex items-center gap-1">
            <FileUp className="w-2.5 h-2.5" />
            <span>Insert #{pageNumber}</span>
          </div>
        </div>
      )}

      {/* Inline Drop Slot Indicator (After Card) when dragging an OS .pdf file between thumbnails */}
      {fileDropSide === 'after' && (
        <div
          data-testid={`drop-indicator-after-${pageNumber}`}
          className="pointer-events-none absolute -right-3 top-2 bottom-2 w-1.5 bg-blue-600 rounded-full z-30 flex flex-col items-center justify-center shadow-md"
        >
          <div className="bg-blue-600 text-white text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap flex items-center gap-1">
            <FileUp className="w-2.5 h-2.5" />
            <span>Insert #{pageNumber + 1}</span>
          </div>
        </div>
      )}

      {/* Top overlay controls: selection indicator & status text */}
      <div className="w-full flex items-center justify-between mb-2 px-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(page.id, e.shiftKey);
          }}
          aria-label={`Select Page ${pageNumber}: ${page.title}`}
          aria-pressed={isSelected}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors rounded px-1.5 py-0.5 cursor-pointer ${
            isSelected
              ? 'text-blue-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span
            className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white border border-blue-600'
                : 'bg-white border border-slate-300 group-hover:border-slate-400'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
          </span>
          <span className="font-mono tabular-nums text-[11px]">
            #{String(pageNumber).padStart(2, '0')}
          </span>
        </button>

        {/* Unboxed Status Metadata */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono tabular-nums">
          {page.rotation !== 0 && (
            <span
              className="text-amber-700 font-semibold"
              title={`Rotated ${page.rotation}°`}
            >
              {page.rotation}°
            </span>
          )}
          {page.sourceType === 'imported' && (
            <span className="text-sky-700 font-sans font-medium truncate max-w-[85px]">
              Imported
            </span>
          )}
          {page.sourceType === 'blank' && (
            <span className="text-slate-500 font-sans">New</span>
          )}
        </div>
      </div>

      {/* Main Clickable Thumbnail Sheet with Live pdf.js Canvas Rendering */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Page ${pageNumber} thumbnail (${page.title})${
          isSelected ? ', Selected' : ''
        }${page.rotation ? `, Rotated ${page.rotation} degrees` : ''}`}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        style={{ width: `${sheetWidth}px`, height: `${sheetHeight}px` }}
        className={`relative flex items-center justify-center rounded-lg p-2.5 overflow-hidden cursor-pointer transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
          isSelected
            ? 'bg-blue-100/50 border border-blue-300'
            : 'bg-slate-100/90 border border-slate-200/80 group-hover:border-slate-300'
        }`}
      >
        <PdfPageCanvas page={page} onCacheThumbnail={onCacheThumbnail} />

        {/* Hover Quick-Action Bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 bg-slate-900/95 text-white px-1.5 py-1 rounded-md shadow-md"
        >
          <button
            type="button"
            onClick={() => onQuickMoveStep(page.id, 'left')}
            disabled={pageNumber === 1}
            aria-label={`Move Page ${pageNumber} earlier`}
            title="Move Left"
            className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onQuickMoveStep(page.id, 'right')}
            disabled={pageNumber === totalPages}
            aria-label={`Move Page ${pageNumber} later`}
            title="Move Right"
            className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onQuickRotateRight(page.id)}
            aria-label={`Rotate Page ${pageNumber} right`}
            title="Rotate 90° Right"
            className="p-1 hover:bg-slate-700 rounded cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onQuickDuplicate(page.id)}
            aria-label={`Duplicate Page ${pageNumber}`}
            title="Duplicate Page"
            className="p-1 hover:bg-slate-700 rounded cursor-pointer"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onQuickDelete(page.id)}
            aria-label={`Delete Page ${pageNumber}`}
            title="Delete Page"
            className="p-1 hover:bg-red-600 rounded text-red-300 hover:text-white cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Corresponding Page Number & Title Underneath */}
      <div className="mt-2.5 w-full text-center px-1">
        <div
          className={`text-xs font-mono tabular-nums font-semibold transition-colors ${
            isSelected ? 'text-blue-700' : 'text-slate-800'
          }`}
        >
          Page {pageNumber}
        </div>
        <div
          className="text-[11px] text-slate-500 truncate mt-0.5 max-w-[175px] mx-auto"
          title={page.title}
        >
          {page.title}
        </div>
      </div>
    </div>
  );
};
