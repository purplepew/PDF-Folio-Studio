import React, { useState, useRef, useEffect } from 'react';
import {
  FilePlus2,
  Trash2,
  Copy,
  RotateCcw,
  RotateCw,
  ArrowLeftRight,
  FileUp,
  Undo2,
  Redo2,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import type { PageTemplateVariant } from '../logic/pageOperations';

interface TopToolbarProps {
  totalPages: number;
  selectedCount: number;
  allSelected: boolean;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  isImporting: boolean;
  onNewPage: (variant?: PageTemplateVariant) => void;
  onDeletePages: () => void;
  onDuplicatePages: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onMoveStep: (direction: 'left' | 'right') => void;
  onMoveToPosition: (
    targetPageNumber: number,
    placement: 'before' | 'after' | 'start' | 'end'
  ) => void;
  onImportFiles: (files: FileList | File[]) => void;
  onImportSamplePdf: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectAllToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  totalPages,
  selectedCount,
  allSelected,
  canUndo,
  canRedo,
  zoom,
  isImporting,
  onNewPage,
  onDeletePages,
  onDuplicatePages,
  onRotateLeft,
  onRotateRight,
  onMoveStep,
  onMoveToPosition,
  onImportFiles,
  onImportSamplePdf,
  onUndo,
  onRedo,
  onSelectAllToggle,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showNewPageMenu, setShowNewPageMenu] = useState(false);
  const [targetPageNum, setTargetPageNum] = useState<number>(1);
  const [placement, setPlacement] = useState<'before' | 'after'>('after');

  const moveMenuRef = useRef<HTMLDivElement | null>(null);
  const newPageMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false);
      }
      if (
        newPageMenuRef.current &&
        !newPageMenuRef.current.contains(e.target as Node)
      ) {
        setShowNewPageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const hasSelection = selectedCount > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportFiles(e.target.files);
      e.target.value = '';
    }
  };

  const btnBase =
    'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600';
  const btnNeutral =
    'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200/70';

  return (
    <div
      role="toolbar"
      aria-label="PDF Page Manipulation Toolbar"
      className="md:sticky md:top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 lg:px-8 py-2.5 shadow-2xs"
    >
      {/* Hidden File Input for Import Document */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileChange}
        data-testid="import-pdf-input"
        aria-label="Upload PDF file to import pages"
        className="sr-only"
      />

      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left & Center Action Groups */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          {/* Group 1: Document Page Insertion & Import */}
          <div className="relative flex items-center" ref={newPageMenuRef}>
            <button
              type="button"
              onClick={() => onNewPage('blank')}
              aria-label="New Page"
              title="Insert a new blank page (after selection or at end)"
              className={`${btnBase} bg-blue-600 text-white hover:bg-blue-700 rounded-r-none pr-2`}
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>New Page</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewPageMenu((prev) => !prev)}
              aria-label="New Page Template Options"
              aria-expanded={showNewPageMenu}
              title="Choose New Page Template"
              className="px-1.5 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 border-l border-blue-500 rounded-r-lg transition-colors cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showNewPageMenu && (
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30">
                <button
                  type="button"
                  onClick={() => {
                    onNewPage('blank');
                    setShowNewPageMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                >
                  <span>Blank Page</span>
                  <span className="text-[10px] font-mono text-slate-400">612×792</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNewPage('lined-notes');
                    setShowNewPageMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                >
                  <span>Ruled Notes Page</span>
                  <span className="text-[10px] font-mono text-slate-400">Lined</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNewPage('grid-blueprint');
                    setShowNewPageMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                >
                  <span>Technical Grid Page</span>
                  <span className="text-[10px] font-mono text-slate-400">5mm Grid</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            aria-label="Import Document"
            title="Upload an external PDF file and insert its pages into the grid"
            className={`${btnBase} bg-slate-100 text-slate-800 hover:bg-slate-200/80 border border-slate-200/80`}
          >
            <FileUp className="w-3.5 h-3.5 text-blue-600" />
            <span>{isImporting ? 'Importing...' : 'Import Document'}</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Group 2: Selection & History */}
          <button
            type="button"
            onClick={onSelectAllToggle}
            disabled={totalPages === 0}
            aria-label="Select All"
            aria-pressed={allSelected}
            title={allSelected ? 'Deselect all pages' : 'Select all pages'}
            className={`${btnBase} ${
              allSelected
                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                : btnNeutral
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Select All</span>
          </button>

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo last page operation (Ctrl+Z)"
            className={`${btnBase} ${btnNeutral}`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Undo</span>
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo page operation (Ctrl+Y)"
            className={`${btnBase} ${btnNeutral}`}
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Redo</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Group 3: Page Manipulation (Duplicate, Rotate Left/Right, Move, Delete Pages) */}
          <button
            type="button"
            onClick={onDuplicatePages}
            disabled={!hasSelection}
            aria-label="Duplicate"
            title="Duplicate selected pages"
            className={`${btnBase} ${btnNeutral}`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>

          <button
            type="button"
            onClick={onRotateLeft}
            disabled={!hasSelection}
            aria-label="Rotate Left"
            title="Rotate selected pages 90° counter-clockwise"
            className={`${btnBase} ${btnNeutral}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rotate Left</span>
          </button>

          <button
            type="button"
            onClick={onRotateRight}
            disabled={!hasSelection}
            aria-label="Rotate Right"
            title="Rotate selected pages 90° clockwise"
            className={`${btnBase} ${btnNeutral}`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate Right</span>
          </button>

          {/* Move Popover Control */}
          <div className="relative" ref={moveMenuRef}>
            <button
              type="button"
              onClick={() => setShowMoveMenu((prev) => !prev)}
              disabled={!hasSelection || totalPages <= 1}
              aria-label="Move"
              aria-expanded={showMoveMenu}
              title="Move selected pages to another position"
              className={`${btnBase} ${
                showMoveMenu
                  ? 'bg-slate-200 text-slate-900'
                  : btnNeutral
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Move</span>
            </button>

            {showMoveMenu && hasSelection && (
              <div
                role="dialog"
                aria-label="Move Selected Pages"
                className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-30 space-y-3"
              >
                <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>Reorder Selected Pages</span>
                  <span className="font-mono tabular-nums text-[11px] text-blue-600">
                    {selectedCount} selected
                  </span>
                </div>

                {/* Quick Step Move Buttons */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onMoveStep('left')}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Move Left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveStep('right')}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg cursor-pointer"
                  >
                    <span>Move Right</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onMoveToPosition(1, 'start');
                      setShowMoveMenu(false);
                    }}
                    className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                  >
                    Move to Beginning
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onMoveToPosition(totalPages, 'end');
                      setShowMoveMenu(false);
                    }}
                    className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                  >
                    Move to End
                  </button>
                </div>

                {/* Move to Specific Page Number */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Position relative to page number:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      aria-label="Move placement"
                      value={placement}
                      onChange={(e) =>
                        setPlacement(e.target.value as 'before' | 'after')
                      }
                      className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white text-slate-800"
                    >
                      <option value="before">Before Page</option>
                      <option value="after">After Page</option>
                    </select>
                    <input
                      type="number"
                      aria-label="Target page number"
                      min={1}
                      max={totalPages}
                      value={targetPageNum}
                      onChange={(e) =>
                        setTargetPageNum(
                          Math.max(
                            1,
                            Math.min(totalPages, Number(e.target.value) || 1)
                          )
                        )
                      }
                      className="w-16 text-xs font-mono tabular-nums border border-slate-300 rounded-md px-2 py-1 text-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onMoveToPosition(targetPageNum, placement);
                      setShowMoveMenu(false);
                    }}
                    className="w-full py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                  >
                    Apply Move
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onDeletePages}
            disabled={!hasSelection}
            aria-label="Delete Pages"
            title="Delete selected pages (Delete / Backspace)"
            className={`${btnBase} text-red-600 hover:bg-red-50 hover:text-red-700`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Pages</span>
          </button>
        </div>

        {/* Right Group: Zoom Controls & Quick Demo Import */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onImportSamplePdf}
            disabled={isImporting}
            aria-label="Load Sample Addendum PDF"
            title="Generate and import a 3-page external PDF document to test multi-document merging"
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>+ Sample PDF</span>
          </button>

          <div
            role="group"
            aria-label="Zoom Controls"
            className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80"
          >
            <button
              type="button"
              onClick={onZoomOut}
              disabled={zoom <= 50}
              aria-label="Zoom Out"
              title="Zoom Out (-10%)"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onZoomReset}
              aria-label={`Reset Zoom (currently ${zoom}%)`}
              title="Click to reset zoom to 100%"
              className="px-2 py-1 text-xs font-mono tabular-nums font-medium text-slate-700 hover:bg-white rounded-md transition-colors cursor-pointer min-w-[48px] text-center"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={onZoomIn}
              disabled={zoom >= 200}
              aria-label="Zoom In"
              title="Zoom In (+10%)"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
