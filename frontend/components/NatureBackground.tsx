'use client';

import React from 'react';
import styles from './nature.module.css';

const LEAVES = [
  { id:0,  right:'15%', top:'5%',  size:28, rot: 20,  variant:'varA', dur:'9.5s',  delay:'0s'   },
  { id:1,  right:'25%', top:'12%', size:24, rot:-30,  variant:'varB', dur:'11.2s', delay:'2.5s' },
  { id:2,  right:'5%',  top:'8%',  size:32, rot: 50,  variant:'varC', dur:'14.0s', delay:'5.1s' },
  { id:3,  right:'35%', top:'4%',  size:26, rot:-15,  variant:'varA', dur:'12.0s', delay:'8.8s' },
];

const PETALS = [
  { id:0, right:'10%', top:'2%',  size:12, variant:'varB', dur:'8.5s',  delay:'1.0s' },
  { id:1, right:'30%', top:'15%', size:10, variant:'varA', dur:'10.0s', delay:'4.2s' },
  { id:2, right:'20%', top:'10%', size:14, variant:'varC', dur:'12.5s', delay:'7.5s' },
  { id:3, right:'40%', top:'5%',  size:11, variant:'varB', dur:'9s',    delay:'2.8s' },
];

const PARTICLES = [
  { id:0, right:'28%', bottom:'35%', size:2.5, dur:'18s', delay:'0s'  },
  { id:1, right:'16%', bottom:'25%', size:2,   dur:'22s', delay:'4s'  },
  { id:2, right:'36%', bottom:'42%', size:1.5, dur:'15s', delay:'8s'  },
  { id:3, right:'8%',  bottom:'55%', size:2,   dur:'20s', delay:'2s'  },
];

export function Leaf({ size, color = '#7D9E80', dark = '#4E6952' }: { size: number; color?: string; dark?: string }) {
  return (
    <svg 
      aria-hidden="true"
      x={-size / 2} 
      y={-size * 1.2} 
      viewBox="-8 -22 16 26" 
      width={size} 
      height={size * 1.3} 
      style={{ display:'block', overflow: 'visible', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))' }}
    >
      <path d="M 0 2 C -8 -2 -10 -16 0 -24 C 10 -16 8 -2 0 2 Z" fill={color} opacity="0.95"/>
      <line x1="0" y1="2" x2="0" y2="-24" stroke={dark} strokeWidth="1.2" opacity="0.4" strokeLinecap="round"/>
    </svg>
  );
}

export function Petal({ size }: { size: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width={size} height={size} style={{ display:'block', overflow: 'visible', filter: 'drop-shadow(0px 3px 4px rgba(0,0,0,0.25))' }}>
      <ellipse cx="10" cy="10" rx="8" ry="6" fill="#FCE4EC" opacity="0.85" transform="rotate(-15 10 10)" />
      <path d="M10 6 C8 4 4 6 10 14 C16 6 12 4 10 6Z" fill="#F8BBD0" opacity="0.4" />
    </svg>
  );
}

export function Blossom({ angles, rx, ry, cr, fill }: { angles: number[]; rx: number; ry: number; cr: number; fill: string; }) {
  return (
    <g aria-hidden="true" style={{ filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.35))' }}>
      {angles.map(r => (
        <ellipse key={r} rx={rx} ry={ry} fill={fill} transform={`rotate(${r}) translate(0,-${ry})`} />
      ))}
      <circle r={cr} fill="rgba(248,240,222,0.96)" />
    </g>
  );
}

export function BranchPaths({ stroke, strokeOpacity = 1 }: { stroke: string; strokeOpacity?: number }) {
  const s = (w: number) => ({
    stroke, strokeWidth: w, fill: 'none' as const,
    strokeLinecap: 'round' as const, strokeOpacity,
  });
  return (
    <>
      <path d="M680 0 C620 40 550 80 480 140 C420 190 350 250 300 320" {...s(18)}/>
      <path d="M560 75 C520 50 480 40 440 45" {...s(10)}/>
      <path d="M480 140 C520 160 550 200 560 250" {...s(9)}/>
      <path d="M380 220 C340 210 280 200 240 215" {...s(8)}/>
    </>
  );
}

export default function NatureBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.scene}>
      {/* ── Sunbeams & Shadows ── */}
      <div className={styles.windowLight}>
        <div className={styles.frameBar1} />
        <div className={styles.frameBar2} />
      </div>
      <div className={styles.windowGlow} />
      <div className={styles.vignette} />

      {/* ── Branch shadow ── */}
      <div className={styles.branchShadowWrapper}>
        <svg viewBox="0 0 680 580" width="100%" height="100%">
          <BranchPaths stroke="var(--auth-branch-shadow)" strokeOpacity={1} />
        </svg>
      </div>

      {/* ── Main branch ── */}
      <div className={styles.branchWrapper}>
        <svg viewBox="0 0 680 580" width="100%" height="100%">
          <BranchPaths stroke="#5D4037" />

          {/* Sub 1: upper-left fork (560,75) -> (440,45) */}
          <g transform="translate(490,-5) rotate(190)"><Leaf size={45} /></g>
          <g transform="translate(460,105) rotate(20)"><Leaf size={50} /></g>
          <g transform="translate(460,40) rotate(-20)"><Leaf size={40} /></g>

          {/* Sub 2: lower-right fork (480,140) -> (560,250) */}
          <g transform="translate(540,110) rotate(210)"><Leaf size={48} /></g>
          <g transform="translate(593,222) rotate(-60)"><Leaf size={55} /></g>
          <g transform="translate(580,280) rotate(-30)"><Leaf size={42} /></g>

          {/* Sub 3: lower-left fork (380,220) -> (240,215) */}
          <g transform="translate(350,172) rotate(150)"><Leaf size={50} /></g>
          <g transform="translate(220,244) rotate(50)"><Leaf size={45} /></g>
          <g transform="translate(210,194) rotate(110)"><Leaf size={40} /></g>
          
          {/* Main branch — added leaves to the TIP */}
          <g transform="translate(265,360) rotate(40)"><Leaf size={45} /></g>
          <g transform="translate(250,300) rotate(110)"><Leaf size={50} /></g>
          <g transform="translate(320,360) rotate(-20)"><Leaf size={42} /></g>

          {/* Main branch accent leaves */}
          <g transform="translate(593,43) rotate(-140)"><Leaf size={35} /></g>
          <g transform="translate(445,110) rotate(140)"><Leaf size={35} /></g>

          {/* ── Flower blossoms re-added ── */}
          <g transform="translate(560,75)"><Blossom angles={[0,72,144,216,288]} rx={4} ry={8} cr={2.5} fill="#FFF9C4" /></g>
          <g transform="translate(480,140)"><Blossom angles={[15,87,159,231,-57]} rx={3.5} ry={7} cr={2.2} fill="#FFF9C4" /></g>
          <g transform="translate(380,220)"><Blossom angles={[0,72,144,216,288]} rx={4.5} ry={9} cr={2.8} fill="#FFF9C4" /></g>
          <g transform="translate(440,45)"><Blossom angles={[30,102,174,246,318]} rx={3.5} ry={7.5} cr={2.4} fill="#FFFDE7" /></g>
          <g transform="translate(240,215)"><Blossom angles={[-15,57,129,201,273]} rx={4} ry={8} cr={2.5} fill="#FFF9C4" /></g>
          <g transform="translate(300,320)"><Blossom angles={[0,72,144,216,288]} rx={3.8} ry={7.8} cr={2.4} fill="#FFFDE7" /></g>
          <g transform="translate(545,205)"><Blossom angles={[10,82,154,226,298]} rx={3.5} ry={7.5} cr={2.4} fill="#FFFDE7" /></g>
        </svg>
      </div>

      {/* ── Falling items ── */}
      <div className={styles.leavesContainer}>
        {LEAVES.map((l) => (
          <div key={l.id} className={`${styles.fLeaf} ${styles[l.variant]}`}
            style={{ right: l.right, top: l.top, transform: `rotate(${l.rot}deg)`, ['--dur' as any]: l.dur, ['--delay' as any]: l.delay }}>
            <Leaf size={l.size} />
          </div>
        ))}
      </div>

      <div className={styles.petalBox}>
        {PETALS.map((p) => (
          <div key={p.id} className={styles.petal}
            style={{ right: p.right, top: p.top, ['--dur' as any]: p.dur, ['--delay' as any]: p.delay }}>
            <Petal size={p.size} />
          </div>
        ))}
      </div>

      {/* ── Floating particles ── */}
      {PARTICLES.map((p) => (
        <div key={p.id} className={styles.particle}
          style={{ width: p.size, height: p.size, right: p.right, bottom: p.bottom, ['--dur' as any]: p.dur, ['--delay' as any]: p.delay }}
        />
      ))}

      {/* Main Content inside the scene */}
      <div className="absolute inset-0 z-10 overflow-y-auto flex flex-col">
        <div className="m-auto w-full flex justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
