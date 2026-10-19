import React from 'react';
import { X, CheckCircle2, Layers, FileOutput } from 'lucide-react';
import { formatSelectionStatus } from '../logic/pageOperations';

interface StickySelectionFooterProps {
  selectedCount: number;
  selectedPageNumbers: number[];
  totalPages: number;
  isExtracting?: boolean;
  onClearSelection: () => void;
  onExtractSelection: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
}

export const StickySelectionFooter: React.FC<StickySelectionFooterProps> = ({
  selectedCount,
  selectedPageNumbers,
  totalPages,
  isExtracting = false,
  onClearSelection,
  onExtractSelection,
  onDeleteSelected,
  onDuplicateSelected,
}) => {
  const hasSelection = selectedCount > 0;
  const statusText = formatSelectionStatus(selectedCount);

  return (
    <footer
      role="status"
      aria-live="polite"
      data-testid="selection-footer"
      className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-xs border-t border-slate-200 px-3 sm:px-4 lg:px-8 py-2.5 shadow-sm"
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Active Selection Status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CheckCircle2
              className={`w-4 h-4 shrink-0 transition-colors ${
                hasSelection ? 'text-blue-600' : 'text-slate-400'
              }`}
            />
            <span
              data-testid="selection-status-text"
              className={`text-xs sm:text-sm font-semibold tabular-nums whitespace-nowrap ${
                hasSelection ? 'text-slate-900' : 'text-slate-600'
              }`}
            >
              {statusText}
            </span>
          </div>

          <span className="text-slate-300 hidden md:inline" aria-hidden="true">
            ·
          </span>

          {hasSelection ? (
            <span className="text-xs text-slate-500 font-mono tabular-nums truncate hidden md:inline">
              Pages:{' '}
              {selectedPageNumbers.length <= 6
                ? selectedPageNumbers.map((n) => `#${n}`).join(', ')
                : `${selectedPageNumbers
                    .slice(0, 5)
                    .map((n) => `#${n}`)
                    .join(', ')} +${selectedPageNumbers.length - 5} more`}
            </span>
          ) : (
            <span className="text-xs text-slate-500 truncate hidden md:inline">
              Click any page thumbnail to select · Drop .pdf files between pages to insert
            </span>
          )}
        </div>

        {/* Right: Extract Selection, Contextual Actions & Cancel Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums mr-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Total: {totalPages} Pages</span>
          </div>

          {hasSelection && (
            <>
              <button
                type="button"
                onClick={onDuplicateSelected}
                className="hidden md:inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Duplicate ({selectedCount})
              </button>
              <button
                type="button"
                onClick={onDeleteSelected}
                className="hidden md:inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Delete ({selectedCount})
              </button>
            </>
          )}

          {/* Extract Selection Standalone PDF Button */}
          <button
            type="button"
            onClick={onExtractSelection}
            disabled={!hasSelection || isExtracting}
            data-testid="extract-selection-btn"
            aria-label="Extract Selection"
            title={
              hasSelection
                ? `Export ${selectedCount} selected ${
                    selectedCount === 1 ? 'page' : 'pages'
                  } as a new standalone PDF`
                : 'Select one or more pages to extract as a standalone PDF'
            }
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              hasSelection
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <FileOutput className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isExtracting
                ? 'Extracting...'
                : hasSelection
                ? `Extract Selection (${selectedCount})`
                : 'Extract Selection'}
            </span>
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            disabled={!hasSelection}
            data-testid="cancel-selection-btn"
            aria-label="Cancel"
            title="Clear current page selection (Esc)"
            className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              hasSelection
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <X className="w-3.5 h-3.5 shrink-0" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
