import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  DRAW_PRICE,
  buildWheelSlices,
  directSell,
  getDrawableItems,
  totalsForToday,
  undoLastOperation,
  updateItem,
  weightedDraw
} from './inventory';
import { loadState, saveState } from './storage';
import type { AppState, Item, ItemId } from './types';
import './styles.css';

const SPIN_MS = 4800;

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [wheelSlices, setWheelSlices] = useState(() => buildWheelSlices(loadState()));
  const [wheelLocked, setWheelLocked] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Item | null>(null);
  const [notice, setNotice] = useState('3元一次，点中间开始');

  const items = useMemo(() => Object.values(state.items), [state.items]);
  const drawable = getDrawableItems(state);
  const wheelGradient = wheelSlices.length
    ? `conic-gradient(${wheelSlices.map((slice) => `${slice.color} ${slice.start}deg ${slice.end}deg`).join(', ')})`
    : '#d8d1c1';

  useEffect(() => saveState(state), [state]);

  useEffect(() => {
    if (!spinning && !wheelLocked) {
      setWheelSlices(buildWheelSlices(state));
    }
  }, [state, spinning, wheelLocked]);

  function openAdminByLogo() {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 5) {
      setWheelLocked(false);
      setAdminOpen(true);
      setLogoClicks(0);
    }
    window.setTimeout(() => setLogoClicks(0), 1200);
  }

  function startDraw() {
    if (spinning) return;
    try {
      const currentSlices = buildWheelSlices(state);
      setWheelSlices(currentSlices);
      setWheelLocked(false);
      const result = weightedDraw(state);
      const winnerSlices = currentSlices.filter((part) => part.itemId === result.winner.id);
      const slice = winnerSlices[Math.floor(Math.random() * winnerSlices.length)];
      const landing = 360 - (slice?.mid ?? 0);
      const rounds = 360 * (5 + Math.floor(Math.random() * 3));
      setWinner(null);
      setSpinning(true);
      setNotice('转盘旋转中...');
      setRotation((current) => {
        const currentAngle = ((current % 360) + 360) % 360;
        const deltaToLanding = (landing - currentAngle + 360) % 360;
        return current + rounds + deltaToLanding;
      });
      window.setTimeout(() => {
        setWheelLocked(true);
        setState(result.state);
        setWinner(result.winner);
        setNotice(`抽中：${result.winner.name}`);
        setSpinning(false);
      }, SPIN_MS);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '当前不能抽奖');
    }
  }

  return (
    <main className="app">
      <div className="ambient ambientLeft" aria-hidden="true">
        <span>0x4C44</span>
        <span>ERR_CANINE_07</span>
        <span>△ LOW DEF SIGNAL</span>
        <span>101101 / DB-SCAN</span>
      </div>
      <div className="ambient ambientRight" aria-hidden="true">
        <span>SYNC...</span>
        <span>PRIZE POOL</span>
        <span>WHEEL TRACE</span>
      </div>
      <section className="wheelPanel">
        <div className="screenTag">DRAW MODULE // LOCAL STORAGE ACTIVE</div>
        <header className="topbar">
          <button className="logo" onClick={openAdminByLogo} aria-label="Logo">
            L.D.C
          </button>
          <div>
            <strong>{DRAW_PRICE}元/次</strong>
          </div>
        </header>

        <div className="wheelWrap">
          <div className="wheelIndex">PRIZE WHEEL 03</div>
          <div className="pointer" />
          <div className="wheel" style={{ transform: `rotate(${rotation}deg)`, background: wheelGradient }}>
            {wheelSlices.map((slice, index) => (
              <span
                key={`${slice.itemId}-${index}`}
                className="sliceLabel"
                style={{
                  transform: `translate(-50%, -50%) rotate(${slice.mid}deg) translateY(calc(-1 * var(--label-radius))) rotate(90deg)`
                }}
              >
                {slice.name.replace(' 12张', '')}
              </span>
            ))}
          </div>
          <button className="spinButton" onClick={startDraw} disabled={spinning || drawable.length === 0}>
            {spinning ? '旋转中' : '开始'}
          </button>
        </div>

        <div className={`resultBox ${winner ? 'hasWinner' : ''}`}>
          {winner ? <strong>{winner.name}</strong> : <p>{notice}</p>}
        </div>

        <div className="signalStrip" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      <aside className="menuPanel" aria-label="商品菜单">
        <div className="screenTag">MENU DATABASE // PUBLIC DISPLAY</div>
        <header className="menuHeader">
          <p>低清犬类数据库</p>
          <strong>LOW-DEFINITION CANINE DATABASE</strong>
          <span>L.D.C.</span>
        </header>
        <div className="menuTable">
          <div className="menuTableHead">
            <span>商品</span>
            <span>英文名</span>
            <span>价格</span>
          </div>
          {items.map((item, index) => (
            <div className="menuRow" key={item.id} style={{ '--row-index': index } as React.CSSProperties}>
              <span className="menuColor" style={{ background: item.color }} />
              <strong>{item.name}</strong>
              <span className="menuEnglish">{item.englishName}</span>
              <em>¥{item.salePrice.toFixed(1)}</em>
            </div>
          ))}
        </div>
        <div className="chartLoop" aria-hidden="true">
          <svg viewBox="0 0 220 54" role="img">
            <polyline className="chartLine ghost" points="0,38 24,30 45,34 64,16 88,24 110,12 133,30 154,20 176,26 198,10 220,18" />
            <polyline className="chartLine main" points="0,42 24,32 45,36 64,18 88,27 110,14 133,32 154,22 176,28 198,12 220,20" />
          </svg>
          <span>LIVE INDEX // LOOPING</span>
        </div>
        <footer className="menuFooter">
          <span>ALL ITEMS AVAILABLE FOR DIRECT SALE</span>
          <span>DRAW PRICE ¥{DRAW_PRICE}.0 / ENTRY</span>
        </footer>
      </aside>

      {adminOpen && <Admin state={state} setState={setState} onClose={() => setAdminOpen(false)} />}
    </main>
  );
}

function Admin({ state, setState, onClose }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; onClose: () => void }) {
  const totals = totalsForToday(state);
  const items = Object.values(state.items);

  function edit(id: ItemId, patch: Partial<Item>) {
    setState((current) => updateItem(current, id, patch));
  }

  return (
    <div className="adminOverlay">
      <section className="admin">
        <header className="adminHeader">
          <h2>后台</h2>
          <button onClick={onClose}>关闭</button>
        </header>
        <div className="stats">
          <Stat label="今日抽奖" value={`${totals.drawCount}次`} />
          <Stat label="抽奖收入" value={`${totals.drawIncome}元`} />
          <Stat label="直接销售" value={`${totals.saleIncome}元`} />
          <Stat label="剩余库存" value={`${totals.remainingStock}件`} />
        </div>
        <button className="undo" onClick={() => setState((current) => undoLastOperation(current))}>
          撤销上一操作
        </button>
        <h3>直接售卖</h3>
        <div className="shopGrid adminShop">
          {items.map((item) => (
            <button
              key={item.id}
              className="shopItem"
              onClick={() => setState((current) => directSell(current, item.id))}
              disabled={item.actualStock <= 0}
            >
              <span>{item.name}</span>
              <strong>{item.salePrice}元</strong>
              <small>剩 {item.actualStock}{item.unit}</small>
            </button>
          ))}
        </div>
        <h3>库存控制</h3>
        <div className="table">
          {items.map((item) => (
            <div className="row" key={item.id}>
              <div className="nameCell">
                <strong>{item.name}</strong>
                <span>{item.englishName} / 成本 {item.cost}元</span>
              </div>
              <label className="wideField">商品名<input type="text" value={item.name} onChange={(event) => edit(item.id, { name: event.target.value })} /></label>
              <label className="wideField">英文名<input type="text" value={item.englishName} onChange={(event) => edit(item.id, { englishName: event.target.value })} /></label>
              <label>单卖<input type="number" value={item.salePrice} onChange={(event) => edit(item.id, { salePrice: Number(event.target.value) })} /></label>
              <label>实际<input type="number" value={item.actualStock} onChange={(event) => edit(item.id, { actualStock: Number(event.target.value) })} /></label>
              <label>可抽<input type="number" value={item.drawStock} onChange={(event) => edit(item.id, { drawStock: Number(event.target.value) })} /></label>
              <label>保留<input type="number" value={item.minReserve} onChange={(event) => edit(item.id, { minReserve: Number(event.target.value) })} /></label>
              <button className={item.paused ? 'paused' : ''} onClick={() => edit(item.id, { paused: !item.paused })}>
                {item.paused ? '已暂停' : '参与'}
              </button>
            </div>
          ))}
        </div>
        <h3>操作记录</h3>
        <div className="logs">
          {state.operations.slice(0, 30).map((operation) => (
            <p key={operation.id}>
              <span>{new Date(operation.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
              {operation.type === 'draw' && ` 抽中 ${operation.itemName}`}
              {operation.type === 'sale' && ` 售出 ${operation.itemName} x${operation.quantity}`}
              {operation.type === 'edit' && ` 修改 ${operation.itemName}`}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
