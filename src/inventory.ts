import type { AppState, Item, ItemId, Operation } from './types';

export const DRAW_PRICE = 3;

export const initialItems: Item[] = [
  { id: 'sticker-pack', name: '犬类失误贴纸集', englishName: 'CANINE ERROR STICKER SET', unit: '包', cost: 1.84, salePrice: 3.9, actualStock: 48, drawStock: 24, minReserve: 6, paused: false, color: '#1f2937' },
  { id: 'sticker-sheet', name: '低清犬类贴纸页', englishName: 'LOW-DEF CANINE STICKER SHEET', unit: '张', cost: 3.33, salePrice: 4.9, actualStock: 3, drawStock: 1, minReserve: 1, paused: false, color: '#d1d5db' },
  { id: 'glasses-cloth', name: '犬类擦拭布', englishName: 'CANINE WIPING CLOTH', unit: '个', cost: 1.7, salePrice: 6.9, actualStock: 12, drawStock: 6, minReserve: 2, paused: false, color: '#6b7280' },
  { id: 'fridge-magnet', name: '犬类异常磁片', englishName: 'CANINE ANOMALY MAGNET', unit: '个', cost: 3.14, salePrice: 9.9, actualStock: 12, drawStock: 3, minReserve: 3, paused: false, color: '#9ca3af' },
  { id: 'keychain', name: '犬类档案挂件', englishName: 'CANINE FILE CHARM', unit: '个', cost: 6.5, salePrice: 12.9, actualStock: 2, drawStock: 0, minReserve: 1, paused: false, color: '#111827' },
  { id: 'tape', name: '犬类记录胶卷', englishName: 'CANINE RECORD FILM', unit: '个', cost: 10.77, salePrice: 16.9, actualStock: 4, drawStock: 0, minReserve: 2, paused: false, color: '#e5e7eb' },
  { id: 'leather-coaster', name: '方形皮革杯垫', englishName: 'LEATHER COASTER', unit: '个', cost: 3, salePrice: 9.9, actualStock: 6, drawStock: 1, minReserve: 2, paused: false, color: '#60a5fa' },
  { id: 'storage-pouch', name: '犬类样品袋', englishName: 'CANINE SPECIMEN POUCH', unit: '个', cost: 9.08, salePrice: 16.9, actualStock: 6, drawStock: 0, minReserve: 2, paused: false, color: '#374151' },
  { id: 'mini-bookmark', name: '犬类回旋针书签', englishName: 'CANINE ARCHIVE BOOKMARK', unit: '个', cost: 1.11, salePrice: 4.9, actualStock: 18, drawStock: 12, minReserve: 3, paused: false, color: '#f3f4f6' },
  { id: 'phone-strap', name: '犬类手机挂绳', englishName: 'CANINE PHONE STRAP', unit: '个', cost: 3.9, salePrice: 12.9, actualStock: 4, drawStock: 1, minReserve: 1, paused: false, color: '#93c5fd' },
  { id: 'rectangle-badge', name: '犬类识别铭牌', englishName: 'CANINE IDENTIFICATION PLATE', unit: '个', cost: 1, salePrice: 5.9, actualStock: 30, drawStock: 18, minReserve: 5, paused: false, color: '#4b5563' },
  { id: 'bird-bag', name: '勺嘴鹬标本套组', englishName: 'SPOON-BILLED SANDPIPER SPECIMEN SET', unit: '个', cost: 2.37, salePrice: 6.9, actualStock: 19, drawStock: 8, minReserve: 3, paused: false, color: '#bfdbfe' }
];

export const brandColors = Object.fromEntries(initialItems.map((item) => [item.id, item.color])) as Record<ItemId, string>;
export const menuDefaults = Object.fromEntries(
  initialItems.map((item) => [item.id, { name: item.name, englishName: item.englishName, salePrice: item.salePrice }])
) as Record<ItemId, Pick<Item, 'name' | 'englishName' | 'salePrice'>>;

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function createInitialState(): AppState {
  return {
    items: Object.fromEntries(initialItems.map((item) => [item.id, { ...item }])) as Record<ItemId, Item>,
    draws: [],
    sales: [],
    operations: []
  };
}

export function getDrawableItems(state: AppState): Item[] {
  return Object.values(state.items).filter(
    (item) => !item.paused && item.drawStock > 0 && item.actualStock > item.minReserve
  );
}

export function buildWheelSegments(state: AppState) {
  const drawable = getDrawableItems(state);
  const total = drawable.reduce((sum, item) => sum + item.drawStock, 0);
  let cursor = 0;

  return drawable.map((item, index) => {
    const size = (item.drawStock / total) * 360;
    const segment = {
      itemId: item.id,
      name: item.name,
      color: item.color,
      weight: item.drawStock,
      start: roundAngle(cursor),
      end: index === drawable.length - 1 ? 360 : roundAngle(cursor + size),
      mid: roundAngle(cursor + size / 2)
    };
    cursor += size;
    return segment;
  });
}

export function buildWheelSlices(state: AppState) {
  const drawable = getDrawableItems(state).sort((a, b) => b.drawStock - a.drawStock);
  const total = drawable.reduce((sum, item) => sum + item.drawStock, 0);
  if (total <= 0) return [];

  const pool = drawable.map((item) => ({ item, remaining: item.drawStock }));
  const ordered: Item[] = [];
  while (ordered.length < total) {
    const previous = ordered.at(-1);
    const candidates = pool
      .filter((entry) => entry.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining || drawable.indexOf(a.item) - drawable.indexOf(b.item));
    const next = candidates.find((entry) => entry.item.id !== previous?.id) ?? candidates[0];
    ordered.push(next.item);
    next.remaining -= 1;
  }

  const size = 360 / total;
  return ordered.map((item, index) => ({
    itemId: item.id,
    name: item.name,
    color: item.color,
    start: roundAngle(index * size),
    end: index === ordered.length - 1 ? 360 : roundAngle((index + 1) * size),
    mid: roundAngle(index * size + size / 2)
  }));
}

export function weightedDraw(state: AppState, random = Math.random): { state: AppState; winner: Item } {
  const drawable = getDrawableItems(state);
  const total = drawable.reduce((sum, item) => sum + item.drawStock, 0);
  if (total <= 0) {
    throw new Error('当前没有可抽商品');
  }

  let target = random() * total;
  const winner = drawable.find((item) => {
    target -= item.drawStock;
    return target < 0;
  }) ?? drawable[drawable.length - 1];

  const now = new Date().toISOString();
  const recordId = uid();
  const operation: Operation = {
    id: uid(),
    type: 'draw',
    itemId: winner.id,
    itemName: winner.name,
    actualDelta: -1,
    drawDelta: -1,
    recordId,
    createdAt: now
  };

  const next = cloneState(state);
  next.items[winner.id].actualStock -= 1;
  next.items[winner.id].drawStock -= 1;
  next.draws.unshift({ id: recordId, itemId: winner.id, itemName: winner.name, amount: DRAW_PRICE, createdAt: now });
  next.operations.unshift(operation);
  return { state: next, winner: { ...next.items[winner.id] } };
}

export function directSell(state: AppState, itemId: ItemId, quantity = 1): AppState {
  const item = state.items[itemId];
  if (!item || quantity < 1 || item.actualStock < quantity) {
    throw new Error('库存不足，不能售出');
  }

  const now = new Date().toISOString();
  const recordId = uid();
  const next = cloneState(state);
  next.items[itemId].actualStock -= quantity;
  next.sales.unshift({ id: recordId, itemId, itemName: item.name, quantity, amount: item.salePrice * quantity, createdAt: now });
  next.operations.unshift({
    id: uid(),
    type: 'sale',
    itemId,
    itemName: item.name,
    quantity,
    actualDelta: -quantity,
    amount: item.salePrice * quantity,
    recordId,
    createdAt: now
  });
  return next;
}

export function updateItem(state: AppState, itemId: ItemId, patch: Partial<Item>): AppState {
  const before = state.items[itemId];
  const after = {
    ...before,
    ...patch,
    actualStock: Math.max(0, Math.floor(patch.actualStock ?? before.actualStock)),
    drawStock: Math.max(0, Math.floor(patch.drawStock ?? before.drawStock)),
    minReserve: Math.max(0, Math.floor(patch.minReserve ?? before.minReserve)),
    salePrice: Math.max(0, Number(patch.salePrice ?? before.salePrice))
  };
  const next = cloneState(state);
  next.items[itemId] = after;
  next.operations.unshift({ id: uid(), type: 'edit', itemId, itemName: before.name, before: { ...before }, after: { ...after }, createdAt: new Date().toISOString() });
  return next;
}

export function undoLastOperation(state: AppState): AppState {
  const [operation, ...rest] = state.operations;
  if (!operation) {
    return state;
  }

  const next = cloneState({ ...state, operations: rest });
  if (operation.type === 'draw') {
    next.items[operation.itemId].actualStock -= operation.actualDelta;
    next.items[operation.itemId].drawStock -= operation.drawDelta;
    next.draws = next.draws.filter((record) => record.id !== operation.recordId);
  }
  if (operation.type === 'sale') {
    next.items[operation.itemId].actualStock -= operation.actualDelta;
    next.sales = next.sales.filter((record) => record.id !== operation.recordId);
  }
  if (operation.type === 'edit') {
    next.items[operation.itemId] = { ...operation.before };
  }
  return next;
}

export function totalsForToday(state: AppState, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const draws = state.draws.filter((record) => record.createdAt.slice(0, 10) === day);
  const sales = state.sales.filter((record) => record.createdAt.slice(0, 10) === day);
  return {
    drawCount: draws.length,
    drawIncome: draws.reduce((sum, record) => sum + record.amount, 0),
    saleIncome: sales.reduce((sum, record) => sum + record.amount, 0),
    remainingStock: Object.values(state.items).reduce((sum, item) => sum + item.actualStock, 0)
  };
}

function cloneState(state: AppState): AppState {
  return {
    items: Object.fromEntries(Object.values(state.items).map((item) => [item.id, { ...item }])) as Record<ItemId, Item>,
    draws: state.draws.map((record) => ({ ...record })),
    sales: state.sales.map((record) => ({ ...record })),
    operations: state.operations.map((operation) => ({ ...operation })) as Operation[]
  };
}

function roundAngle(value: number) {
  return Math.round(value * 1000) / 1000;
}
