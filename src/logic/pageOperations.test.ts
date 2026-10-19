import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialPages,
  getHighestSelectedIndex,
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
  formatSelectionStatus,
  type PDFPageItem,
} from './pageOperations.ts';

test('createInitialPages creates 8 distinct starter pages', () => {
  const pages = createInitialPages();
  assert.equal(pages.length, 8);
  assert.equal(pages[0].id, 'page-1');
  assert.equal(pages[0].rotation, 0);
  assert.equal(pages[7].id, 'page-8');
});

test('togglePageSelection selects, deselects, and supports Shift range selection', () => {
  const pages = createInitialPages();
  const step1 = togglePageSelection([], 'page-2', pages);
  assert.deepEqual(step1.selectedIds, ['page-2']);
  assert.equal(step1.lastSelectedId, 'page-2');

  // Shift-select from page-2 to page-5
  const step2 = togglePageSelection(step1.selectedIds, 'page-5', pages, {
    shiftKey: true,
    lastSelectedId: step1.lastSelectedId,
  });
  assert.deepEqual(step2.selectedIds, ['page-2', 'page-3', 'page-4', 'page-5']);

  // Deselect page-3
  const step3 = togglePageSelection(step2.selectedIds, 'page-3', pages);
  assert.deepEqual(step3.selectedIds, ['page-2', 'page-4', 'page-5']);

  // Select all and clear
  const all = selectAllPages(pages);
  assert.equal(all.length, 8);
  assert.deepEqual(clearSelection(), []);
});

test('getHighestSelectedIndex returns highest index regardless of selection click order', () => {
  const pages = createInitialPages().slice(0, 5); // page-1 .. page-5 (indices 0 .. 4)
  // User clicked page-4 (idx 3) first, then page-2 (idx 1)
  assert.equal(getHighestSelectedIndex(pages, ['page-4', 'page-2']), 3);
  assert.equal(getHighestSelectedIndex(pages, []), -1);
});

test('addNewPage is context-aware: splices after highest selected index or appends when none selected', () => {
  const pages = createInitialPages().slice(0, 4); // page-1, page-2, page-3, page-4
  const resEnd = addNewPage(pages, [], 'blank');
  assert.equal(resEnd.pages.length, 5);
  assert.equal(resEnd.insertedAtIndex, 4);
  assert.equal(resEnd.pages[4].id, resEnd.newPage.id);

  // Select page-3 (idx 2) and page-1 (idx 0) -> highest selected index is 2 -> splices at index 3
  const resAfterHighest = addNewPage(pages, ['page-3', 'page-1'], 'lined-notes');
  assert.equal(resAfterHighest.pages.length, 5);
  assert.equal(resAfterHighest.insertedAtIndex, 3);
  assert.deepEqual(
    resAfterHighest.pages.map((p) => p.id),
    ['page-1', 'page-2', 'page-3', resAfterHighest.newPage.id, 'page-4']
  );
});

test('insertImportedPages is context-aware and supports explicit drop splice index', () => {
  const pages = createInitialPages().slice(0, 4); // page-1, page-2, page-3, page-4
  const imported: PDFPageItem[] = [
    {
      id: 'imp-1',
      originalPageNumber: 1,
      title: 'External Contract — Page 1',
      section: 'Imported PDF',
      rotation: 0,
      sourceDocName: 'Contract.pdf',
      sourceType: 'imported',
      templateVariant: 'imported-page',
      dimensions: { width: 612, height: 792 },
      snippetLines: ['Imported page 1'],
      accentColor: '#0284c7',
    },
    {
      id: 'imp-2',
      originalPageNumber: 2,
      title: 'External Contract — Page 2',
      section: 'Imported PDF',
      rotation: 0,
      sourceDocName: 'Contract.pdf',
      sourceType: 'imported',
      templateVariant: 'imported-page',
      dimensions: { width: 612, height: 792 },
      snippetLines: ['Imported page 2'],
      accentColor: '#0284c7',
    },
  ];

  // With selection ['page-3', 'page-1'], highest selected index is 2 (page-3), so splice at index 3
  const { pages: mergedSelection, insertedAtIndex } = insertImportedPages(
    pages,
    imported,
    ['page-3', 'page-1'],
    'after-selected'
  );
  assert.equal(insertedAtIndex, 3);
  assert.deepEqual(
    mergedSelection.map((p) => p.id),
    ['page-1', 'page-2', 'page-3', 'imp-1', 'imp-2', 'page-4']
  );

  // With explicit drop index 1 (between page-1 and page-2), splice at index 1 regardless of selection
  const { pages: mergedDrop, insertedAtIndex: dropIdx } = insertImportedPages(
    pages,
    imported,
    ['page-4'],
    'after-selected',
    1
  );
  assert.equal(dropIdx, 1);
  assert.deepEqual(
    mergedDrop.map((p) => p.id),
    ['page-1', 'imp-1', 'imp-2', 'page-2', 'page-3', 'page-4']
  );
});

test('computeDropIndexFromCardRects resolves inline insertion index from drop coordinates', () => {
  const rects = [
    { left: 0, right: 200, top: 0, bottom: 260 },
    { left: 220, right: 420, top: 0, bottom: 260 },
    { left: 440, right: 640, top: 0, bottom: 260 },
  ];

  // Drop near left edge of first card -> index 0
  assert.equal(computeDropIndexFromCardRects(rects, 40, 120), 0);
  // Drop between card 0 (right=200) and card 1 (left=220) -> index 1
  assert.equal(computeDropIndexFromCardRects(rects, 210, 120), 1);
  // Drop in right half of card 1 (center=320, clientX=360) -> index 2
  assert.equal(computeDropIndexFromCardRects(rects, 360, 120), 2);
  // Drop after card 2 -> index 3
  assert.equal(computeDropIndexFromCardRects(rects, 680, 120), 3);
});

test('getSelectedPagesInOrder extracts selected pages in document order with 1-based numbers', () => {
  const pages = createInitialPages().slice(0, 5);
  const { selectedPages, selectedPageNumbers } = getSelectedPagesInOrder(pages, [
    'page-5',
    'page-2',
  ]);
  assert.deepEqual(
    selectedPages.map((p) => p.id),
    ['page-2', 'page-5']
  );
  assert.deepEqual(selectedPageNumbers, [2, 5]);
});

test('deleteSelectedPages, duplicateSelectedPages, and rotateSelectedPages work accurately', () => {
  const pages = createInitialPages().slice(0, 3);
  const remaining = deleteSelectedPages(pages, ['page-2']);
  assert.deepEqual(
    remaining.map((p) => p.id),
    ['page-1', 'page-3']
  );

  const { pages: duped, duplicatedIds } = duplicateSelectedPages(pages, ['page-1']);
  assert.equal(duped.length, 4);
  assert.equal(duped[1].id, duplicatedIds[0]);

  const rotated = rotateSelectedPages(pages, ['page-1'], 'right');
  assert.equal(rotated[0].rotation, 90);
});

test('moveSelectedPagesStep, moveSelectedPagesToPosition, and HistoryStack work accurately', () => {
  const pages = createInitialPages().slice(0, 4);
  const movedRight = moveSelectedPagesStep(pages, ['page-2'], 'right');
  assert.deepEqual(
    movedRight.map((p) => p.id),
    ['page-1', 'page-3', 'page-2', 'page-4']
  );

  const movedToEnd = moveSelectedPagesToPosition(pages, ['page-1'], 4, 'end');
  assert.deepEqual(
    movedToEnd.map((p) => p.id),
    ['page-2', 'page-3', 'page-4', 'page-1']
  );

  const dragged = reorderPageByDrag(pages, 'page-4', 'page-1');
  assert.deepEqual(
    dragged.map((p) => p.id),
    ['page-4', 'page-1', 'page-2', 'page-3']
  );

  let hist = createHistory<number[]>([1]);
  hist = pushHistory(hist, [1, 2]);
  hist = undoHistory(hist);
  assert.deepEqual(hist.present, [1]);
  hist = redoHistory(hist);
  assert.deepEqual(hist.present, [1, 2]);

  assert.equal(clampZoom(120), 120);
  assert.equal(formatSelectionStatus(1), '1 Page Selected');
});
