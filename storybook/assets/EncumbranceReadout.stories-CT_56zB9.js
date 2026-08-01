import{i as e}from"./preload-helper-xPQekRTU.js";import{t}from"./iframe-BT9Fs6is.js";import{n,t as r}from"./SectionTitle-BCvs-BI8.js";import{a as i,l as a,n as o,u as s}from"./inventory-mqt8rX3n.js";function c({e}){return(0,l.jsxs)(`div`,{className:`osc-inv-head enc-rule`,style:{"--enc-pct":`${Math.round(e.pct*100)}%`,"--enc-stops":i(e)},children:[(0,l.jsx)(r,{children:`Inventory`}),(0,l.jsx)(a,{e})]})}var l,u,d,f,p,m,h,g,_,v,y;e((()=>{s(),o(),n(),l=t(),u={title:`Inventory / EncumbranceReadout`},d=[25,37.5,50],f=(e,t,n)=>({enabled:!0,variant:`basic`,value:t,max:1600,pct:Math.min(1,t/1600),tier:e,status:n,label:`${t} / 1600 cn`,moveBands:(()=>{let t=[120,90,60,30,0][e];return{encounter:t/3,explore:t,travel:t/5}})(),bands:d}),p=[f(0,300,`Unencumbered`),f(1,500,`Lightly encumbered`),f(2,700,`Heavily encumbered`),f(3,1200,`Severely encumbered`),f(4,1600,`Overloaded`)],m=()=>(0,l.jsx)(`div`,{className:`osc-inv`,style:{display:`flex`,flexDirection:`column`,gap:24,padding:16,width:520},children:p.map(e=>(0,l.jsx)(c,{e},e.tier))}),h=()=>(0,l.jsxs)(`div`,{className:`osc-inv`,style:{padding:16,width:480},children:[(0,l.jsx)(c,{e:f(2,690,`Heavily encumbered`)}),(0,l.jsxs)(`button`,{type:`button`,className:`osc-whead tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-[2px] tw:pt-[7px] tw:pb-[9px] tw:text-left`,children:[(0,l.jsx)(`span`,{className:`key tw:font-sans tw:text-[length:var(--fs-xs)] tw:font-semibold tw:tracking-[0.13em] tw:uppercase tw:text-text-mute`,children:`Wealth`}),(0,l.jsx)(`span`,{className:`v tw:font-display tw:text-[length:var(--fs-lg)] tw:leading-flush tw:text-accent-alt`,children:`152 gp`}),(0,l.jsx)(`span`,{className:`wt tw:ml-auto tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-faint`,children:`140 cn`})]}),(0,l.jsxs)(`div`,{className:`osc-inv-sec-head tw:flex tw:w-full tw:items-center tw:gap-2 tw:pt-1 tw:pb-2 tw:bg-bg tw:text-text-mute`,children:[(0,l.jsx)(`span`,{className:`section-title sub`,children:`Equipped items`}),(0,l.jsx)(`span`,{className:`osc-inv-sec-count tw:ml-auto tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-faint`,children:`4 items · 230 cn`})]}),(0,l.jsxs)(`div`,{className:`osc-inv-sec-head tw:flex tw:w-full tw:items-center tw:gap-2 tw:pt-1 tw:pb-2 tw:bg-bg tw:text-text-mute`,children:[(0,l.jsx)(`span`,{className:`section-title sub`,children:`All items`}),(0,l.jsx)(`span`,{className:`osc-inv-sec-count tw:ml-auto tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-faint`,children:`9 items · 306 cn`})]})]}),g=()=>(0,l.jsx)(`div`,{style:{padding:40},children:(0,l.jsx)(`div`,{style:{width:260,height:60,overflow:`hidden`,outline:`1px dashed #a55`,padding:8},children:(0,l.jsx)(`div`,{className:`osc-inv`,style:{width:`100%`},children:(0,l.jsx)(c,{e:f(2,690,`Heavily encumbered`)})})})}),_=(e,t,n)=>{let r=t>=1600;return{...f(e,t,n),pct:Math.min(1,t/1600),label:`${t} / 1600 cn`,bands:r?[]:[50],barTier:r?3:e}},v=()=>(0,l.jsx)(`div`,{className:`osc-inv`,style:{display:`flex`,flexDirection:`column`,gap:24,padding:16,width:520},children:[_(0,0,`Unencumbered`),_(0,400,`Unencumbered`),_(1,800,`Lightly encumbered`),_(1,1200,`Lightly encumbered`),_(4,1600,`Overloaded`)].map(e=>(0,l.jsx)(c,{e},e.value))}),m.__docgenInfo={description:``,methods:[],displayName:`Tiers`},h.__docgenInfo={description:``,methods:[],displayName:`FullHeader`},g.__docgenInfo={description:``,methods:[],displayName:`ClippedAncestor`},v.__docgenInfo={description:``,methods:[],displayName:`BasicVariant`},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`() => <div className="osc-inv" style={{
  display: "flex",
  flexDirection: "column",
  gap: 24,
  padding: 16,
  width: 520
}}>
    {ROWS.map(e => <Head key={e.tier} e={e} />)}
  </div>`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`() => {
  const e = vm(2, 690, "Heavily encumbered");
  return <div className="osc-inv" style={{
    padding: 16,
    width: 480
  }}>
      <Head e={e} />
      {/* whead utilities mirror WealthSection.tsx — that component owns the real markup */}
      <button type="button" className="osc-whead tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-[2px] tw:pt-[7px] tw:pb-[9px] tw:text-left">
        <span className="key tw:font-sans tw:text-[length:var(--fs-xs)] tw:font-semibold tw:tracking-[0.13em] tw:uppercase tw:text-text-mute">
          Wealth
        </span>
        <span className="v tw:font-display tw:text-[length:var(--fs-lg)] tw:leading-flush tw:text-accent-alt">152 gp</span>
        <span className="wt tw:ml-auto tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-faint">
          140 cn
        </span>
      </button>
      {/* head/count utilities mirror SectionCount.tsx — that component owns the real markup */}
      <div className="osc-inv-sec-head tw:flex tw:w-full tw:items-center tw:gap-2 tw:pt-1 tw:pb-2 tw:bg-bg tw:text-text-mute">
        <span className="section-title sub">Equipped items</span>
        <span className="osc-inv-sec-count tw:ml-auto tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-faint">4 items · 230 cn</span>
      </div>
      <div className="osc-inv-sec-head tw:flex tw:w-full tw:items-center tw:gap-2 tw:pt-1 tw:pb-2 tw:bg-bg tw:text-text-mute">
        <span className="section-title sub">All items</span>
        <span className="osc-inv-sec-count tw:ml-auto tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-faint">9 items · 306 cn</span>
      </div>
    </div>;
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`() => {
  const e = vm(2, 690, "Heavily encumbered");
  return <div style={{
    padding: 40
  }}>
      <div style={{
      width: 260,
      height: 60,
      overflow: "hidden",
      outline: "1px dashed #a55",
      padding: 8
    }}>
        <div className="osc-inv" style={{
        width: "100%"
      }}>
          <Head e={e} />
        </div>
      </div>
    </div>;
}`,...g.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`() => <div className="osc-inv" style={{
  display: "flex",
  flexDirection: "column",
  gap: 24,
  padding: 16,
  width: 520
}}>
    {[basicVm(0, 0, "Unencumbered"), basicVm(0, 400, "Unencumbered"), basicVm(1, 800, "Lightly encumbered"), basicVm(1, 1200, "Lightly encumbered"), basicVm(4, 1600, "Overloaded")].map(e => <Head key={e.value} e={e} />)}
  </div>`,...v.parameters?.docs?.source}}},y=[`Tiers`,`FullHeader`,`ClippedAncestor`,`BasicVariant`]}))();export{v as BasicVariant,g as ClippedAncestor,h as FullHeader,m as Tiers,y as __namedExportsOrder,u as default};