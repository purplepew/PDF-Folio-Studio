export type PageRotation = 0 | 90 | 180 | 270;

export type PageTemplateVariant =
  | 'cover'
  | 'executive-summary'
  | 'financial-table'
  | 'architecture-diagram'
  | 'market-analysis'
  | 'timeline'
  | 'risk-matrix'
  | 'sign-off'
  | 'blank'
  | 'lined-notes'
  | 'grid-blueprint'
  | 'imported-page';

export interface PDFPageItem {
  id: string;
  originalPageNumber: number;
  title: string;
  section: string;
  rotation: PageRotation;
  sourceDocName: string;
  sourceType: 'starter' | 'blank' | 'imported';
  templateVariant: PageTemplateVariant;
  dimensions: { width: number; height: number };
  snippetLines: string[];
  accentColor: string;
  pdfBytesBase64?: string;
  sourcePageIndex?: number;
  thumbnailDataUrl?: string;
}

export interface CardRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface HistoryStack<T> {
  past: T[];
  present: T;
  future: T[];
}

let idCounter = 100;
export function generatePageId(prefix = 'page'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createInitialPages(): PDFPageItem[] {
  const docName = 'Q4_Enterprise_Architecture_Review.pdf';
  return [
    {
      id: 'page-1',
      originalPageNumber: 1,
      title: 'Executive Briefing & Cover',
      section: '01 · Overview',
      rotation: 0,
      sourceDocName: docName,
      sourceType: 'starter',
      templateVariant: 'cover',
      dimensions: { width: 612, height: 792 },
      snippetLines: [
        'ANNUAL INFRASTRUCTURE & FINANCIAL AUDIT',
        'Prepared for Global Systems Architecture Board',
        'Fiscal Period Q4 · Document Ref #AR-2026-08',
      ],
      accentColor: '#1d4ed8',
    },
    {
      id: 'page-2',
      originalPageNumber: 2,
      title: 'Executive Summary & Key Highlights',
      section: '01 · Overview',
      rotation: 0,
      sourceDocName: docName,
      sourceType: 'starter',
      templateVariant: 'executive-summary',
      dimensions: { width: 612, height: 792 },
      snippetLines: [
        '1.1 Consolidated regional compute clusters across 4 zones',
        '1.2 Reduced cross-region replication latency by 38.4%',
        '1.3 Annualized operating expenditure savings of $1.42M',
      ],
      accentColor: '#0f766e',
    },
    {
      id: 'page-3',
      originalPageNumber: 3,
      title: 'Q4 Operating Budget & Ledger Breakdown',
      section: '02 · Financials',
      rotation: 0,
      sourceDocName: docName,
      sourceType: 'starter',
      templateVariant: 'financial-table',
      dimensions: { width: 612, height: 792 },
      snippetLines: [
        'Cloud Compute Tiers .......... $482,900   (-12.4%)',
        'Storage & Archival ........... $129,400   (-04.1%)',
        'Network Egress & CDN ......... $84,150    (+02.0%)',
      ],
      accentColor: '#0369a1',
    },
    {
      id: 'page-4',
      originalPageNumber: 4,
      title: 'Multi-Region Failover Topology',
      section: '03 · Architecture',
      rotation: 0,
      sourceDocName: docName,
      sourceType: 'starter',
      templateVariant: 'architecture-diagram',
      dimensions: { width: 612, height: 792 },
      snippetLines: [
        'Primary Edge Ingress -> Active-Active Mesh',
        'Synchronous Consensus Quorum (3 Data Centers)',
        'Automated Zero-Downtime Snapshot Recovery',
      ],
      accentColor: '#4338ca',
    },
    {
      id: 'page-5',
      originalPageNumber: 5,
      title: 'Regional Throughput & Demand Curve',
      section: '03 · Architecture',
      rotation: 0,
      sourceDocName: docName,
      sourceType: 'starter',
      templateVariant: 'market-analysis',
      dimensions: { width: 612, height: 792 },
      snippetLines: [
        'North America Cluster: 99.994% Uptime SLA',
        'EU Central Cluster: 99.991% Uptime SLA',
        'APAC East Cluster: 99.989% Uptime SLA',
      ],
      accentColor: '#0f766e',
    },
    {
      id: 'page-6',
      originalPageNumber: 6,
      title: '2027 Migration & Rollout Schedule',
      section: '04 · Roadmap',
      rotation: 0,
      sourceDocName: docName,
      sourceType: 'starter',
      templateVariant: 'timeline',
      dimensions: { width: 612, height: 792 },
      snippetLines: [
        'Phase I (Jan–Feb): Core Ledger Schema Cutover',
        'Phase II (Mar–Apr): Edge Gateway TLS 1.3 Upgrade',
        'Phase III (May–Jun): Legacy Decommissioning',
      ],
      accentColor: '#b45309',
    },
    {
      id: 'page-7',
      originalPageNumber: 7,
      title: 'Compliance & Security Risk Register',
      section: '05 · Governance',
      rotation: 0,
      sourceDocName: docName,
      sourceType: 'starter',
      templateVariant: 'risk-matrix',
      dimensions: { width: 612, height: 792 },
      snippetLines: [
        'SOC2 Type II Controls — Verified & Audited',
        'ISO/IEC 27001 Key Rotation Policy — Compliant',
        'Disaster Recovery Drill RPO < 15 Seconds',
      ],
      accentColor: '#be123c',
    },
    {
      id: 'page-8',
      originalPageNumber: 8,
      title: 'Executive Sign-Off & Attestation',
      section: '05 · Governance',
      rotation: 0,
      sourceDocName: docName,
      sourceType: 'starter',
      templateVariant: 'sign-off',
      dimensions: { width: 612, height: 792 },
      snippetLines: [
        'Approved by VP of Infrastructure Engineering',
        'Approved by Chief Information Security Officer',
        'Digital Signature Stamp: SHA256-9F8A-44C1',
      ],
      accentColor: '#334155',
    },
  ];
}

export function getHighestSelectedIndex(
  pages: PDFPageItem[],
  selectedIds: string[]
): number {
  if (selectedIds.length === 0 || pages.length === 0) return -1;
  const selectedSet = new Set(selectedIds);
  let highestIdx = -1;
  for (let i = 0; i < pages.length; i++) {
    if (selectedSet.has(pages[i].id)) {
      highestIdx = i;
    }
  }
  return highestIdx;
}

export function togglePageSelection(
  selectedIds: string[],
  targetId: string,
  allPages: PDFPageItem[],
  options?: { shiftKey?: boolean; lastSelectedId?: string | null }
): { selectedIds: string[]; lastSelectedId: string } {
  const existsInDoc = allPages.some((p) => p.id === targetId);
  if (!existsInDoc) {
    return { selectedIds, lastSelectedId: options?.lastSelectedId ?? targetId };
  }

  if (options?.shiftKey && options.lastSelectedId) {
    const startIdx = allPages.findIndex((p) => p.id === options.lastSelectedId);
    const endIdx = allPages.findIndex((p) => p.id === targetId);
    if (startIdx !== -1 && endIdx !== -1) {
      const low = Math.min(startIdx, endIdx);
      const high = Math.max(startIdx, endIdx);
      const rangeIds = allPages.slice(low, high + 1).map((p) => p.id);
      const merged = Array.from(new Set([...selectedIds, ...rangeIds]));
      return { selectedIds: merged, lastSelectedId: targetId };
    }
  }

  const isSelected = selectedIds.includes(targetId);
  const nextSelected = isSelected
    ? selectedIds.filter((id) => id !== targetId)
    : [...selectedIds, targetId];

  return {
    selectedIds: nextSelected,
    lastSelectedId: targetId,
  };
}

export function selectAllPages(allPages: PDFPageItem[]): string[] {
  return allPages.map((p) => p.id);
}

export function clearSelection(): string[] {
  return [];
}

export function getSelectedPagesInOrder(
  pages: PDFPageItem[],
  selectedIds: string[]
): { selectedPages: PDFPageItem[]; selectedPageNumbers: number[] } {
  const selectedSet = new Set(selectedIds);
  const selectedPages: PDFPageItem[] = [];
  const selectedPageNumbers: number[] = [];

  pages.forEach((page, index) => {
    if (selectedSet.has(page.id)) {
      selectedPages.push(page);
      selectedPageNumbers.push(index + 1);
    }
  });

  return { selectedPages, selectedPageNumbers };
}

/**
 * Context-aware New Page insertion:
 * If explicitInsertIndex is provided, splices there.
 * Otherwise, if one or more pages are selected, splices immediately after the highest selected index.
 * Otherwise, appends to the end of the document.
 */
export function addNewPage(
  pages: PDFPageItem[],
  selectedIds: string[],
  variant: PageTemplateVariant = 'blank',
  explicitInsertIndex?: number
): { pages: PDFPageItem[]; newPage: PDFPageItem; insertedAtIndex: number } {
  const nextNumber = pages.length + 1;
  const variantTitles: Record<
    string,
    { title: string; section: string; lines: string[]; color: string }
  > = {
    blank: {
      title: `Blank Page ${nextNumber}`,
      section: 'Inserted Page',
      lines: [
        'Clean unruled page sheet',
        'Ready for annotations or layout composition',
      ],
      color: '#64748b',
    },
    'lined-notes': {
      title: `Meeting Notes Page ${nextNumber}`,
      section: 'Notes · Addendum',
      lines: [
        'Ruled note-taking template',
        'Action items & reviewer commentary',
      ],
      color: '#2563eb',
    },
    'grid-blueprint': {
      title: `Technical Grid Page ${nextNumber}`,
      section: 'Engineering · Spec',
      lines: [
        'Isometric / Cartesian 5mm technical grid',
        'Scale 1:100 architectural specification',
      ],
      color: '#0284c7',
    },
  };

  const meta = variantTitles[variant] || variantTitles.blank;

  const newPage: PDFPageItem = {
    id: generatePageId('new'),
    originalPageNumber: nextNumber,
    title: meta.title,
    section: meta.section,
    rotation: 0,
    sourceDocName: 'New Page Insertion',
    sourceType: 'blank',
    templateVariant: variant,
    dimensions: { width: 612, height: 792 },
    snippetLines: meta.lines,
    accentColor: meta.color,
  };

  let targetIndex = pages.length;

  if (typeof explicitInsertIndex === 'number' && !Number.isNaN(explicitInsertIndex)) {
    targetIndex = Math.max(0, Math.min(pages.length, explicitInsertIndex));
  } else {
    const highestSelectedIndex = getHighestSelectedIndex(pages, selectedIds);
    if (highestSelectedIndex !== -1) {
      targetIndex = highestSelectedIndex + 1;
    }
  }

  const nextPages = [...pages];
  nextPages.splice(targetIndex, 0, newPage);

  return {
    pages: nextPages,
    newPage,
    insertedAtIndex: targetIndex,
  };
}

export function deleteSelectedPages(
  pages: PDFPageItem[],
  selectedIds: string[]
): PDFPageItem[] {
  if (selectedIds.length === 0) return pages;
  const selectedSet = new Set(selectedIds);
  return pages.filter((p) => !selectedSet.has(p.id));
}

export function duplicateSelectedPages(
  pages: PDFPageItem[],
  selectedIds: string[]
): { pages: PDFPageItem[]; duplicatedIds: string[] } {
  if (selectedIds.length === 0) {
    return { pages, duplicatedIds: [] };
  }

  const selectedSet = new Set(selectedIds);
  const nextPages: PDFPageItem[] = [];
  const duplicatedIds: string[] = [];

  for (const page of pages) {
    nextPages.push(page);
    if (selectedSet.has(page.id)) {
      const copyId = generatePageId('dup');
      const copyPage: PDFPageItem = {
        ...page,
        id: copyId,
        title: page.title.endsWith(' (Copy)')
          ? page.title
          : `${page.title} (Copy)`,
        snippetLines: [...page.snippetLines],
        dimensions: { ...page.dimensions },
      };
      nextPages.push(copyPage);
      duplicatedIds.push(copyId);
    }
  }

  return { pages: nextPages, duplicatedIds };
}

export function normalizeRotation(deg: number): PageRotation {
  const mod = ((deg % 360) + 360) % 360;
  if (mod === 90 || mod === 180 || mod === 270) return mod;
  return 0;
}

export function rotateSelectedPages(
  pages: PDFPageItem[],
  selectedIds: string[],
  direction: 'left' | 'right'
): PDFPageItem[] {
  if (selectedIds.length === 0) return pages;
  const selectedSet = new Set(selectedIds);
  const delta = direction === 'right' ? 90 : -90;

  return pages.map((page) => {
    if (!selectedSet.has(page.id)) return page;
    return {
      ...page,
      rotation: normalizeRotation(page.rotation + delta),
    };
  });
}

export function moveSelectedPagesStep(
  pages: PDFPageItem[],
  selectedIds: string[],
  direction: 'left' | 'right'
): PDFPageItem[] {
  if (selectedIds.length === 0 || pages.length <= 1) return pages;
  const selectedSet = new Set(selectedIds);
  const next = [...pages];

  if (direction === 'left') {
    for (let i = 1; i < next.length; i++) {
      if (selectedSet.has(next[i].id) && !selectedSet.has(next[i - 1].id)) {
        const temp = next[i - 1];
        next[i - 1] = next[i];
        next[i] = temp;
      }
    }
  } else {
    for (let i = next.length - 2; i >= 0; i--) {
      if (selectedSet.has(next[i].id) && !selectedSet.has(next[i + 1].id)) {
        const temp = next[i + 1];
        next[i + 1] = next[i];
        next[i] = temp;
      }
    }
  }

  return next;
}

export function moveSelectedPagesToPosition(
  pages: PDFPageItem[],
  selectedIds: string[],
  targetPageNumber: number,
  placement: 'before' | 'after' | 'start' | 'end'
): PDFPageItem[] {
  if (selectedIds.length === 0 || pages.length <= 1) return pages;
  const selectedSet = new Set(selectedIds);
  const movingPages = pages.filter((p) => selectedSet.has(p.id));
  const remainingPages = pages.filter((p) => !selectedSet.has(p.id));

  if (movingPages.length === 0 || remainingPages.length === 0) {
    return pages;
  }

  if (placement === 'start') {
    return [...movingPages, ...remainingPages];
  }

  if (placement === 'end') {
    return [...remainingPages, ...movingPages];
  }

  const clampedTargetIndex = Math.max(
    0,
    Math.min(pages.length - 1, targetPageNumber - 1)
  );
  const targetPage = pages[clampedTargetIndex];

  const anchorIndexInRemaining = remainingPages.findIndex(
    (p) => p.id === targetPage.id
  );

  if (anchorIndexInRemaining === -1) {
    let unselectedBefore = 0;
    for (let i = 0; i < clampedTargetIndex; i++) {
      if (!selectedSet.has(pages[i].id)) {
        unselectedBefore += 1;
      }
    }
    return [
      ...remainingPages.slice(0, unselectedBefore),
      ...movingPages,
      ...remainingPages.slice(unselectedBefore),
    ];
  }

  const insertAt =
    placement === 'before' ? anchorIndexInRemaining : anchorIndexInRemaining + 1;

  return [
    ...remainingPages.slice(0, insertAt),
    ...movingPages,
    ...remainingPages.slice(insertAt),
  ];
}

export function reorderPageByDrag(
  pages: PDFPageItem[],
  draggedId: string,
  targetId: string
): PDFPageItem[] {
  if (draggedId === targetId) return pages;
  const fromIndex = pages.findIndex((p) => p.id === draggedId);
  const toIndex = pages.findIndex((p) => p.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return pages;

  const updated = [...pages];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  return updated;
}

/**
 * Context-aware Import Document splicing:
 * - If explicitInsertIndex is provided (e.g., native OS drag-and-drop between thumbnails),
 *   splices importedPages directly at explicitInsertIndex.
 * - Otherwise, if one or more pages are selected (and insertPosition is 'after-selected'),
 *   splices importedPages directly into the array immediately following the highest selected index.
 * - Otherwise, appends importedPages to the end (or beginning if insertPosition === 'start').
 */
export function insertImportedPages(
  pages: PDFPageItem[],
  importedPages: PDFPageItem[],
  selectedIds: string[],
  insertPosition: 'after-selected' | 'end' | 'start' = 'after-selected',
  explicitInsertIndex?: number
): { pages: PDFPageItem[]; insertedIds: string[]; insertedAtIndex: number } {
  if (importedPages.length === 0) {
    return { pages, insertedIds: [], insertedAtIndex: pages.length };
  }

  const insertedIds = importedPages.map((p) => p.id);

  let targetIndex = pages.length;

  if (
    typeof explicitInsertIndex === 'number' &&
    !Number.isNaN(explicitInsertIndex)
  ) {
    targetIndex = Math.max(0, Math.min(pages.length, explicitInsertIndex));
  } else if (insertPosition === 'start') {
    targetIndex = 0;
  } else if (insertPosition === 'end') {
    targetIndex = pages.length;
  } else {
    const highestSelectedIndex = getHighestSelectedIndex(pages, selectedIds);
    if (highestSelectedIndex !== -1) {
      targetIndex = highestSelectedIndex + 1;
    } else {
      targetIndex = pages.length;
    }
  }

  const nextPages = [...pages];
  nextPages.splice(targetIndex, 0, ...importedPages);

  return {
    pages: nextPages,
    insertedIds,
    insertedAtIndex: targetIndex,
  };
}

/**
 * Given the bounding client rects of all thumbnail cards in the grid and a pointer (clientX, clientY),
 * calculates the exact splice index (0 .. rects.length) where a dropped PDF file should be inserted.
 */
export function computeDropIndexFromCardRects(
  rects: CardRect[],
  clientX: number,
  clientY: number
): number {
  if (rects.length === 0) return 0;

  // Find cards on the row closest to clientY
  let closestRowIndices: number[] = [];
  let minVerticalDistance = Infinity;

  rects.forEach((r, idx) => {
    const distanceY =
      clientY >= r.top && clientY <= r.bottom
        ? 0
        : Math.min(Math.abs(clientY - r.top), Math.abs(clientY - r.bottom));

    if (distanceY < minVerticalDistance - 12) {
      minVerticalDistance = distanceY;
      closestRowIndices = [idx];
    } else if (Math.abs(distanceY - minVerticalDistance) <= 12) {
      closestRowIndices.push(idx);
    }
  });

  if (closestRowIndices.length === 0) {
    return rects.length;
  }

  for (const idx of closestRowIndices) {
    const r = rects[idx];
    const centerX = (r.left + r.right) / 2;
    if (clientX < centerX) {
      return idx;
    }
  }

  const lastInRow = closestRowIndices[closestRowIndices.length - 1];
  return lastInRow + 1;
}

export function createHistory<T>(initialPresent: T): HistoryStack<T> {
  return {
    past: [],
    present: initialPresent,
    future: [],
  };
}

export function pushHistory<T>(
  stack: HistoryStack<T>,
  nextPresent: T,
  maxDepth = 40
): HistoryStack<T> {
  const nextPast = [...stack.past, stack.present].slice(-maxDepth);
  return {
    past: nextPast,
    present: nextPresent,
    future: [],
  };
}

export function undoHistory<T>(stack: HistoryStack<T>): HistoryStack<T> {
  if (stack.past.length === 0) return stack;
  const previous = stack.past[stack.past.length - 1];
  const newPast = stack.past.slice(0, stack.past.length - 1);
  return {
    past: newPast,
    present: previous,
    future: [stack.present, ...stack.future],
  };
}

export function redoHistory<T>(stack: HistoryStack<T>): HistoryStack<T> {
  if (stack.future.length === 0) return stack;
  const next = stack.future[0];
  const newFuture = stack.future.slice(1);
  return {
    past: [...stack.past, stack.present],
    present: next,
    future: newFuture,
  };
}

export function clampZoom(zoom: number): number {
  return Math.max(50, Math.min(200, Math.round(zoom / 10) * 10));
}

export function formatSelectionStatus(selectedCount: number): string {
  if (selectedCount === 1) return '1 Page Selected';
  return `${selectedCount} Pages Selected`;
}
