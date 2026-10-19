import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Download,
  FilePlus2,
  FileUp,
  RotateCcw,
  FileText,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  createInitialPages,
  togglePageSelection,
  selectAllPages,
  clearSelection,
  getSelectedPagesInOrder,
  addNewPage,
  deleteSelectedPages,
  duplicateSelectedPages,
  rotateSelectedPages,
  moveSelectedPagesStep,
  moveSelectedPagesToPosition,
  reorderPageByDrag,
  insertImportedPages,
  computeDropIndexFromCardRects,
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  clampZoom,
  type PDFPageItem,
  type PageTemplateVariant,
} from './logic/pageOperations';
import {
  extractPagesFromPdfFile,
  createSampleExternalPdfFile,
  exportWorkspaceToPdfBytes,
  triggerPdfDownload,
} from './utils/pdfEngine';
import { TopToolbar } from './components/TopToolbar';
import { PageThumbnailCard } from './components/PageThumbnailCard';
import { StickySelectionFooter } from './components/StickySelectionFooter';

export default function App() {
  const [history, setHistory] = useState(() =>
    createHistory<PDFPageItem[]>(createInitialPages())
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [documentName, setDocumentName] = useState<string>(
    'Q4_Enterprise_Architecture_Review.pdf'
  );
  const [filterMode, setFilterMode] = useState<
    'all' | 'selected' | 'imported' | 'rotated'
  >('all');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);

  // Native OS File Drag-and-Drop state: stores the 0..pages.length insertion index
  const [fileDropInsertIndex, setFileDropInsertIndex] = useState<number | null>(
    null
  );
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  const [statusBanner, setStatusBanner] = useState<{
    message: string;
    type: 'info' | 'error';
  } | null>(null);

  const pages = history.present;

  // Keep selectedIds clean of any deleted page IDs
  const activeSelectedIds = useMemo(() => {
    const validSet = new Set(pages.map((p) => p.id));
    return selectedIds.filter((id) => validSet.has(id));
  }, [pages, selectedIds]);

  const { selectedPages, selectedPageNumbers } = useMemo(
    () => getSelectedPagesInOrder(pages, activeSelectedIds),
    [pages, activeSelectedIds]
  );

  const showNotice = useCallback(
    (message: string, type: 'info' | 'error' = 'info') => {
      setStatusBanner({ message, type });
    },
    []
  );

  useEffect(() => {
    if (!statusBanner) return;
    const timer = setTimeout(() => setStatusBanner(null), 4500);
    return () => clearTimeout(timer);
  }, [statusBanner]);

  const commitPages = useCallback((nextPages: PDFPageItem[]) => {
    setHistory((prev) => pushHistory(prev, nextPages));
  }, []);

  // Cache rendered thumbnail data URLs on the present state without polluting Undo/Redo stack
  const handleCacheThumbnail = useCallback(
    (pageId: string, dataUrl: string, pdfBytesBase64: string) => {
      setHistory((prev) => ({
        ...prev,
        present: prev.present.map((p) =>
          p.id === pageId
            ? {
                ...p,
                thumbnailDataUrl: dataUrl,
                pdfBytesBase64: p.pdfBytesBase64 || pdfBytesBase64,
              }
            : p
        ),
      }));
    },
    []
  );

  // Selection handlers
  const handleSelectPage = useCallback(
    (pageId: string, shiftKey: boolean) => {
      const result = togglePageSelection(activeSelectedIds, pageId, pages, {
        shiftKey,
        lastSelectedId,
      });
      setSelectedIds(result.selectedIds);
      setLastSelectedId(result.lastSelectedId);
    },
    [activeSelectedIds, pages, lastSelectedId]
  );

  const handleSelectAllToggle = useCallback(() => {
    if (activeSelectedIds.length === pages.length && pages.length > 0) {
      setSelectedIds(clearSelection());
      setLastSelectedId(null);
    } else {
      setSelectedIds(selectAllPages(pages));
    }
  }, [activeSelectedIds.length, pages]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(clearSelection());
    setLastSelectedId(null);
  }, []);

  // Context-Aware New Page Handler: splices immediately after highest selected index when pages are selected
  const handleNewPage = useCallback(
    (variant: PageTemplateVariant = 'blank') => {
      const {
        pages: nextPages,
        newPage,
        insertedAtIndex,
      } = addNewPage(pages, activeSelectedIds, variant);
      commitPages(nextPages);
      setSelectedIds([newPage.id]);
      setLastSelectedId(newPage.id);
      showNotice(
        `Inserted "${newPage.title}" at Page ${insertedAtIndex + 1}.`
      );
    },
    [pages, activeSelectedIds, commitPages, showNotice]
  );

  const handleDeletePages = useCallback(() => {
    if (activeSelectedIds.length === 0) return;
    const count = activeSelectedIds.length;
    const nextPages = deleteSelectedPages(pages, activeSelectedIds);
    commitPages(nextPages);
    setSelectedIds([]);
    setLastSelectedId(null);
    showNotice(
      `Deleted ${count} ${count === 1 ? 'page' : 'pages'} from workspace.`
    );
  }, [pages, activeSelectedIds, commitPages, showNotice]);

  const handleDuplicatePages = useCallback(() => {
    if (activeSelectedIds.length === 0) return;
    const { pages: nextPages, duplicatedIds } = duplicateSelectedPages(
      pages,
      activeSelectedIds
    );
    commitPages(nextPages);
    setSelectedIds(duplicatedIds);
    showNotice(
      `Duplicated ${duplicatedIds.length} ${
        duplicatedIds.length === 1 ? 'page' : 'pages'
      }.`
    );
  }, [pages, activeSelectedIds, commitPages, showNotice]);

  const handleRotateLeft = useCallback(() => {
    if (activeSelectedIds.length === 0) return;
    const nextPages = rotateSelectedPages(pages, activeSelectedIds, 'left');
    commitPages(nextPages);
  }, [pages, activeSelectedIds, commitPages]);

  const handleRotateRight = useCallback(() => {
    if (activeSelectedIds.length === 0) return;
    const nextPages = rotateSelectedPages(pages, activeSelectedIds, 'right');
    commitPages(nextPages);
  }, [pages, activeSelectedIds, commitPages]);

  const handleMoveStep = useCallback(
    (direction: 'left' | 'right') => {
      if (activeSelectedIds.length === 0) return;
      const nextPages = moveSelectedPagesStep(
        pages,
        activeSelectedIds,
        direction
      );
      commitPages(nextPages);
    },
    [pages, activeSelectedIds, commitPages]
  );

  const handleMoveToPosition = useCallback(
    (
      targetPageNumber: number,
      placement: 'before' | 'after' | 'start' | 'end'
    ) => {
      if (activeSelectedIds.length === 0) return;
      const nextPages = moveSelectedPagesToPosition(
        pages,
        activeSelectedIds,
        targetPageNumber,
        placement
      );
      commitPages(nextPages);
      showNotice(
        placement === 'start'
          ? 'Moved selected pages to the beginning of the document.'
          : placement === 'end'
          ? 'Moved selected pages to the end of the document.'
          : `Moved selected pages ${placement} Page ${targetPageNumber}.`
      );
    },
    [pages, activeSelectedIds, commitPages, showNotice]
  );

  // Single-thumbnail quick actions
  const handleQuickRotateRight = useCallback(
    (pageId: string) => {
      const nextPages = rotateSelectedPages(pages, [pageId], 'right');
      commitPages(nextPages);
    },
    [pages, commitPages]
  );

  const handleQuickDuplicate = useCallback(
    (pageId: string) => {
      const { pages: nextPages, duplicatedIds } = duplicateSelectedPages(
        pages,
        [pageId]
      );
      commitPages(nextPages);
      setSelectedIds(duplicatedIds);
      showNotice('Duplicated page.');
    },
    [pages, commitPages, showNotice]
  );

  const handleQuickDelete = useCallback(
    (pageId: string) => {
      const nextPages = deleteSelectedPages(pages, [pageId]);
      commitPages(nextPages);
      setSelectedIds((prev) => prev.filter((id) => id !== pageId));
      showNotice('Deleted page.');
    },
    [pages, commitPages, showNotice]
  );

  const handleQuickMoveStep = useCallback(
    (pageId: string, direction: 'left' | 'right') => {
      const nextPages = moveSelectedPagesStep(pages, [pageId], direction);
      commitPages(nextPages);
    },
    [pages, commitPages]
  );

  // Context-Aware Import External PDF Document(s) (with optional explicitInsertIndex for native OS file drops)
  const handleImportFiles = useCallback(
    async (fileList: FileList | File[], explicitInsertIndex?: number) => {
      const files = Array.from(fileList).filter(
        (f) =>
          f.name.toLowerCase().endsWith('.pdf') ||
          f.type === 'application/pdf' ||
          filesFallbackAllowed(f)
      );
      if (files.length === 0) {
        showNotice('Please select or drop a valid .pdf file.', 'error');
        return;
      }

      setIsImporting(true);
      try {
        const allExtracted: PDFPageItem[] = [];
        for (const file of files) {
          const extracted = await extractPagesFromPdfFile(file);
          allExtracted.push(...extracted);
        }

        if (allExtracted.length > 0) {
          const {
            pages: nextPages,
            insertedIds,
            insertedAtIndex,
          } = insertImportedPages(
            pages,
            allExtracted,
            activeSelectedIds,
            'after-selected',
            explicitInsertIndex
          );
          commitPages(nextPages);
          setSelectedIds(insertedIds);
          setFilterMode('all');
          showNotice(
            `Imported ${allExtracted.length} ${
              allExtracted.length === 1 ? 'page' : 'pages'
            } from "${files[0].name}" at Page ${insertedAtIndex + 1}.`
          );
        }
      } catch {
        showNotice('Could not extract pages from the selected file.', 'error');
      } finally {
        setIsImporting(false);
        setFileDropInsertIndex(null);
      }
    },
    [pages, activeSelectedIds, commitPages, showNotice]
  );

  const handleImportSamplePdf = useCallback(async () => {
    setIsImporting(true);
    try {
      const sampleFile = await createSampleExternalPdfFile(
        'Vendor_Security_Addendum_2026.pdf',
        3
      );
      await handleImportFiles([sampleFile]);
    } finally {
      setIsImporting(false);
    }
  }, [handleImportFiles]);

  // Thumbnail Drag & Drop Reordering AND Native OS File Drop Handling
  const isExternalFileDrag = (e: React.DragEvent): boolean => {
    const types = Array.from(e.dataTransfer?.types || []);
    return types.includes('Files') && !draggedPageId;
  };

  const handleDragStart = useCallback((pageId: string) => {
    setDraggedPageId(pageId);
    setFileDropInsertIndex(null);
  }, []);

  const handleCardDragOver = useCallback(
    (e: React.DragEvent, targetId: string, pageIndexZeroBased: number) => {
      e.preventDefault();
      if (isExternalFileDrag(e)) {
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        const insertIdx =
          e.clientX < midX ? pageIndexZeroBased : pageIndexZeroBased + 1;
        setFileDropInsertIndex(insertIdx);
        setDragOverPageId(null);
        return;
      }

      if (draggedPageId && draggedPageId !== targetId) {
        setDragOverPageId(targetId);
      }
    },
    [draggedPageId]
  );

  const handleCardDrop = useCallback(
    (e: React.DragEvent, targetId: string, pageIndexZeroBased: number) => {
      e.preventDefault();
      if (
        e.dataTransfer?.files &&
        e.dataTransfer.files.length > 0 &&
        !draggedPageId
      ) {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        const insertIdx =
          fileDropInsertIndex !== null
            ? fileDropInsertIndex
            : e.clientX < midX
            ? pageIndexZeroBased
            : pageIndexZeroBased + 1;
        void handleImportFiles(e.dataTransfer.files, insertIdx);
        return;
      }

      if (draggedPageId && draggedPageId !== targetId) {
        const nextPages = reorderPageByDrag(pages, draggedPageId, targetId);
        commitPages(nextPages);
      }
      setDraggedPageId(null);
      setDragOverPageId(null);
      setFileDropInsertIndex(null);
    },
    [draggedPageId, fileDropInsertIndex, handleImportFiles, pages, commitPages]
  );

  // Grid-level native OS file drag-over / drop (for dropping directly in the gap between thumbnails)
  const handleGridDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!isExternalFileDrag(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';

      if (!gridContainerRef.current) return;
      const cardEls = Array.from(
        gridContainerRef.current.querySelectorAll<HTMLElement>(
          '[data-page-card="true"]'
        )
      );
      const rects = cardEls.map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });
      const computedIdx = computeDropIndexFromCardRects(
        rects,
        e.clientX,
        e.clientY
      );
      setFileDropInsertIndex(computedIdx);
    },
    [draggedPageId]
  );

  const handleGridDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (
        gridContainerRef.current &&
        !gridContainerRef.current.contains(e.relatedTarget as Node)
      ) {
        setFileDropInsertIndex(null);
      }
    },
    []
  );

  const handleGridDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return;
      if (draggedPageId) return;
      e.preventDefault();

      let insertIdx = fileDropInsertIndex;
      if (insertIdx === null && gridContainerRef.current) {
        const cardEls = Array.from(
          gridContainerRef.current.querySelectorAll<HTMLElement>(
            '[data-page-card="true"]'
          )
        );
        const rects = cardEls.map((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        });
        insertIdx = computeDropIndexFromCardRects(rects, e.clientX, e.clientY);
      }

      void handleImportFiles(
        e.dataTransfer.files,
        insertIdx !== null ? insertIdx : pages.length
      );
      setFileDropInsertIndex(null);
    },
    [draggedPageId, fileDropInsertIndex, handleImportFiles, pages.length]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    setHistory((prev) => undoHistory(prev));
  }, []);

  const handleRedo = useCallback(() => {
    setHistory((prev) => redoHistory(prev));
  }, []);

  // Export full PDF document
  const handleExportPdf = useCallback(async () => {
    if (pages.length === 0) return;
    setIsExporting(true);
    try {
      const pdfBytes = await exportWorkspaceToPdfBytes(pages, documentName);
      triggerPdfDownload(pdfBytes, documentName);
      showNotice(
        `Exported "${documentName}" (${pages.length} pages) successfully.`
      );
    } catch {
      showNotice('Failed to export PDF document.', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [pages, documentName, showNotice]);

  // Extract Selection as a new standalone PDF (independent of main Export PDF)
  const handleExtractSelection = useCallback(async () => {
    if (selectedPages.length === 0) return;
    setIsExtracting(true);
    try {
      const cleanBase = documentName.replace(/\.pdf$/i, '');
      const pageRangeSuffix =
        selectedPageNumbers.length <= 4
          ? `Pages_${selectedPageNumbers.join('_')}`
          : `${selectedPages.length}_Selected_Pages`;
      const extractFileName = `${cleanBase}_Extracted_${pageRangeSuffix}.pdf`;

      const pdfBytes = await exportWorkspaceToPdfBytes(
        selectedPages,
        extractFileName
      );
      triggerPdfDownload(pdfBytes, extractFileName);
      showNotice(
        `Extracted ${selectedPages.length} selected ${
          selectedPages.length === 1 ? 'page' : 'pages'
        } as "${extractFileName}".`
      );
    } catch {
      showNotice('Failed to extract selected pages to PDF.', 'error');
    } finally {
      setIsExtracting(false);
    }
  }, [selectedPages, selectedPageNumbers, documentName, showNotice]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (e.key === 'Escape' && activeSelectedIds.length > 0) {
        e.preventDefault();
        handleClearSelection();
      } else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        activeSelectedIds.length > 0
      ) {
        e.preventDefault();
        handleDeletePages();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeSelectedIds.length,
    handleClearSelection,
    handleDeletePages,
    handleUndo,
    handleRedo,
  ]);

  // Filtered view for quick inspection while preserving real 1-based document page numbers
  const visibleEntries = useMemo(() => {
    const mapped = pages.map((page, index) => ({
      page,
      pageNumber: index + 1,
    }));

    if (filterMode === 'selected') {
      return mapped.filter((entry) =>
        activeSelectedIds.includes(entry.page.id)
      );
    }
    if (filterMode === 'imported') {
      return mapped.filter((entry) => entry.page.sourceType === 'imported');
    }
    if (filterMode === 'rotated') {
      return mapped.filter((entry) => entry.page.rotation !== 0);
    }
    return mapped;
  }, [pages, filterMode, activeSelectedIds]);

  const importedCount = useMemo(
    () => pages.filter((p) => p.sourceType === 'imported').length,
    [pages]
  );
  const rotatedCount = useMemo(
    () => pages.filter((p) => p.rotation !== 0).length,
    [pages]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Top Bar Contract: Zone 1 Brand Wordmark — Zone 2 View Filter Links — Zone 3 Primary Export CTA */}
      <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#workspace"
            onClick={(e) => {
              e.preventDefault();
              setFilterMode('all');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Folio Studio
          </a>

          {/* Zone 2: Clean single-line view filter navigation links */}
          <nav
            aria-label="Document Page Views"
            className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-0.5 ${
                filterMode === 'all'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : ''
              }`}
            >
              All Pages ({pages.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('selected')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-0.5 ${
                filterMode === 'selected'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : ''
              }`}
            >
              Selected ({activeSelectedIds.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('imported')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-0.5 ${
                filterMode === 'imported'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : ''
              }`}
            >
              Imported ({importedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('rotated')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-0.5 ${
                filterMode === 'rotated'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : ''
              }`}
            >
              Rotated ({rotatedCount})
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={pages.length === 0 || isExporting}
              aria-label="Export PDF"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Comprehensive Action Toolbar */}
      <TopToolbar
        totalPages={pages.length}
        selectedCount={activeSelectedIds.length}
        allSelected={
          pages.length > 0 && activeSelectedIds.length === pages.length
        }
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        zoom={zoom}
        isImporting={isImporting}
        onNewPage={handleNewPage}
        onDeletePages={handleDeletePages}
        onDuplicatePages={handleDuplicatePages}
        onRotateLeft={handleRotateLeft}
        onRotateRight={handleRotateRight}
        onMoveStep={handleMoveStep}
        onMoveToPosition={handleMoveToPosition}
        onImportFiles={(files) => handleImportFiles(files)}
        onImportSamplePdf={handleImportSamplePdf}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSelectAllToggle={handleSelectAllToggle}
        onZoomIn={() => setZoom((z) => clampZoom(z + 10))}
        onZoomOut={() => setZoom((z) => clampZoom(z - 10))}
        onZoomReset={() => setZoom(100)}
      />

      {/* Main Workspace Container */}
      <main
        id="workspace"
        className="flex-1 max-w-[1440px] w-full mx-auto px-4 lg:px-8 py-6 flex flex-col"
      >
        {/* Document Metadata & Editable Filename Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-200/80">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
            <input
              type="text"
              aria-label="Active PDF Document Filename"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="text-sm font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none px-1 py-0.5 truncate max-w-xs sm:max-w-md"
            />
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
              <span>·</span>
              <span data-testid="total-pages-readout">
                {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
              </span>
              <span>·</span>
              <span>US Letter (612 × 792 pt)</span>
            </div>
          </div>

          {/* Notification Toast / Action Feedback */}
          {statusBanner ? (
            <div
              role="status"
              data-testid="workspace-status-banner"
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md max-w-full overflow-hidden ${
                statusBanner.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {statusBanner.type === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Check className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">{statusBanner.message}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500 hidden lg:block">
              Drop .pdf files directly between thumbnails to insert · Context-aware insertion follows selection
            </div>
          )}
        </div>

        {/* Responsive Page Thumbnail Grid or Empty State */}
        {pages.length === 0 ? (
          <div
            data-testid="empty-workspace-state"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              setFileDropInsertIndex(0);
            }}
            onDragLeave={() => setFileDropInsertIndex(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer?.files?.length) {
                void handleImportFiles(e.dataTransfer.files, 0);
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border p-10 text-center my-4 transition-colors ${
              fileDropInsertIndex !== null
                ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500'
                : 'border-slate-200'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              No Pages in Current Document
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6">
              All pages have been removed from the workspace. Drop a .pdf file
              here, add a blank page, or restore the starter document.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleNewPage('blank')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <FilePlus2 className="w-4 h-4" />
                <span>Add Blank Page</span>
              </button>
              <button
                type="button"
                onClick={handleImportSamplePdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FileUp className="w-4 h-4" />
                <span>Import Sample PDF</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  commitPages(createInitialPages());
                  setSelectedIds([]);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore Starter Document</span>
              </button>
            </div>
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-10 text-center my-4">
            <Sparkles className="w-6 h-6 text-slate-400 mb-2" />
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              No Pages Match Current View Filter
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Switch back to All Pages to view and manage all {pages.length}{' '}
              document pages.
            </p>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Show All Pages ({pages.length})
            </button>
          </div>
        ) : (
          <div
            ref={gridContainerRef}
            data-testid="page-thumbnail-grid"
            data-drop-insert-index={
              fileDropInsertIndex !== null ? String(fileDropInsertIndex) : ''
            }
            onDragOver={handleGridDragOver}
            onDragLeave={handleGridDragLeave}
            onDrop={handleGridDrop}
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${Math.round(
                (212 * zoom) / 100
              )}px, 1fr))`,
            }}
            className={`grid gap-5 items-start pb-8 rounded-xl transition-colors ${
              fileDropInsertIndex !== null
                ? 'ring-2 ring-dashed ring-blue-500/70 bg-blue-50/20 p-2 -m-2'
                : ''
            }`}
          >
            {visibleEntries.map(({ page, pageNumber }) => {
              const zeroIdx = pageNumber - 1;
              let fileDropSide: 'before' | 'after' | null = null;
              if (fileDropInsertIndex !== null) {
                if (fileDropInsertIndex === zeroIdx) {
                  fileDropSide = 'before';
                } else if (
                  fileDropInsertIndex === pages.length &&
                  pageNumber === pages.length
                ) {
                  fileDropSide = 'after';
                }
              }

              return (
                <PageThumbnailCard
                  key={page.id}
                  page={page}
                  pageNumber={pageNumber}
                  totalPages={pages.length}
                  isSelected={activeSelectedIds.includes(page.id)}
                  zoom={zoom}
                  onSelect={handleSelectPage}
                  onQuickRotateRight={handleQuickRotateRight}
                  onQuickDuplicate={handleQuickDuplicate}
                  onQuickDelete={handleQuickDelete}
                  onQuickMoveStep={handleQuickMoveStep}
                  onDragStart={handleDragStart}
                  onDragOver={handleCardDragOver}
                  onDrop={handleCardDrop}
                  isDragTarget={dragOverPageId === page.id}
                  fileDropSide={fileDropSide}
                  onCacheThumbnail={handleCacheThumbnail}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Sticky Selection Status, Extract Selection & Cancel Footer */}
      <StickySelectionFooter
        selectedCount={activeSelectedIds.length}
        selectedPageNumbers={selectedPageNumbers}
        totalPages={pages.length}
        isExtracting={isExtracting}
        onClearSelection={handleClearSelection}
        onExtractSelection={handleExtractSelection}
        onDeleteSelected={handleDeletePages}
        onDuplicateSelected={handleDuplicatePages}
      />
    </div>
  );
}

function filesFallbackAllowed(file: File): boolean {
  return file.size > 0;
}
