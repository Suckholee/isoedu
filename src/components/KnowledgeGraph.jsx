'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {graphPositions} from '../lib/secondBrain/graph.mjs';

const COLORS = { concept: '#e6bc79', record: '#e2e3db', tag: '#b77565', project: '#bfa77b', document: '#85a6b6', standard: '#b77565' };

export default function KnowledgeGraph({ graph, selectedId, onSelect, rotating, resetToken }) {
  const points = useMemo(() => graphPositions(graph), [graph]);
  const canvas = useRef(null), camera = useRef({ yaw: .25, pitch: -.15, zoom: 1, x: 0, y: 0 });
  const positions = useRef([]), drag = useRef(null), callback = useRef(onSelect);
  const [hover, setHover] = useState('');
  callback.current = onSelect;
  useEffect(() => { camera.current = { yaw: .25, pitch: -.15, zoom: 1, x: 0, y: 0 }; }, [resetToken]);

  useEffect(() => {
    const element = canvas.current, ctx = element.getContext('2d');
    let frame, width = 1, height = 1, lastTime = 0;
    const observer = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width; height = entry.contentRect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = width * ratio; element.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    });
    observer.observe(element);
    const wheel = event => {
      event.preventDefault();
      camera.current.zoom = Math.min(3, Math.max(.35, camera.current.zoom * Math.exp(-event.deltaY * .001)));
    };
    element.addEventListener('wheel', wheel, { passive: false });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function draw(time) {
      const c = camera.current;
      if (rotating && !drag.current && !reduced) c.yaw += Math.min(time - lastTime, 40) * .00009;
      lastTime = time;
      ctx.clearRect(0, 0, width, height);
      const scale = Math.min(width, height) * .34 * c.zoom;
      const projected = points.map(p => {
        const x = p.x * Math.cos(c.yaw) + p.z * Math.sin(c.yaw);
        const z = -p.x * Math.sin(c.yaw) + p.z * Math.cos(c.yaw);
        const y = p.y * Math.cos(c.pitch) - z * Math.sin(c.pitch);
        const depth = p.y * Math.sin(c.pitch) + z * Math.cos(c.pitch);
        const perspective = 2.8 / (2.8 - depth * .45);
        return { ...p, sx: width / 2 + x * scale * perspective + c.x, sy: height / 2 + y * scale * perspective + c.y, depth };
      });
      const byId = new Map(projected.map(p => [p.id, p]));
      for (const edge of graph.edges) {
        const a = byId.get(edge.source), b = byId.get(edge.target);
        if (!a || !b) continue;
        const active = a.id === selectedId || b.id === selectedId || a.id === hover || b.id === hover;
        ctx.strokeStyle = active ? '#ba7969bb' : edge.type === '같은 문맥' ? '#9c6b5c35' : '#8298ac45';
        ctx.lineWidth = active ? 1.1 : .65;
        ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
      }
      projected.sort((a, b) => a.depth - b.depth);
      const labelBoxes=[];
      for (const p of projected) {
        const active = p.id === selectedId || p.id === hover;
        const size = active ? 5 : p.type === 'concept' ? 4.5 : p.type === 'tag' ? 3.4 : 2.1 + (p.depth + 1) * .65;
        ctx.globalAlpha = active ? 1 : .55 + (p.depth + 1) * .2;
        ctx.fillStyle = COLORS[p.type]; ctx.shadowColor = COLORS[p.type]; ctx.shadowBlur = active ? 18 : 5;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }
      const labels=[...projected].sort((a,b)=>Number(b.id===selectedId||b.id===hover)-Number(a.id===selectedId||a.id===hover)||(b.documentIds?.length||0)-(a.documentIds?.length||0));
      for(const p of labels){
        const active=p.id===selectedId||p.id===hover;
        if(!active&&(labelBoxes.length>=18||(p.type!=='concept'&&graph.nodes.length>12)))continue;
        const label=p.label.length>32?p.label.slice(0,32)+'…':p.label;
        ctx.font=`${active?12:10}px sans-serif`;
        const box={x:p.sx+9,y:p.sy-9,w:ctx.measureText(label).width+8,h:17};
        if(!active&&labelBoxes.some(b=>box.x<b.x+b.w&&box.x+box.w>b.x&&box.y<b.y+b.h&&box.y+box.h>b.y))continue;
        labelBoxes.push(box);ctx.globalAlpha=active?1:.8;ctx.fillStyle=COLORS[p.type];ctx.fillText(label,box.x,p.sy+3);
      }
      ctx.globalAlpha = 1; positions.current = projected;
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); element.removeEventListener('wheel', wheel); };
  }, [graph, points, selectedId, rotating, hover]);

  const nearest = event => {
    const rect = canvas.current.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
    return positions.current.map(p => ({ p, distance: Math.hypot(p.sx - x, p.sy - y) })).filter(p => p.distance < 18).sort((a, b) => a.distance - b.distance)[0]?.p;
  };
  return <canvas ref={canvas} aria-label="참조 매뉴얼 본문의 개념 연결 그래프. 핵심 개념 버튼에서 근거와 관련 매뉴얼을, 문서 목록에서 원문을 선택할 수 있습니다." role="img"
    onPointerDown={event => { canvas.current.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, pan: event.shiftKey }; }}
    onPointerMove={event => {
      const state = drag.current;
      if (state) {
        const dx = event.clientX - state.x, dy = event.clientY - state.y;
        if (state.pan) { camera.current.x += dx; camera.current.y += dy; }
        else { camera.current.yaw += dx * .007; camera.current.pitch += dy * .007; }
        state.x = event.clientX; state.y = event.clientY;
      } else setHover(nearest(event)?.id || '');
    }}
    onPointerUp={event => { const state = drag.current; drag.current = null; if (state && Math.hypot(event.clientX - state.startX, event.clientY - state.startY) < 5) { const node = nearest(event); if (node) callback.current(node); } }}
    onPointerCancel={() => { drag.current = null; }} style={{ width: '100%', height: '100%', touchAction: 'none', cursor: hover ? 'pointer' : 'grab' }} />;
}
