import{i as e}from"./preload-helper-xPQekRTU.js";import{t}from"./iframe-UGy2tOm0.js";import{n,t as r}from"./SectionTitle-XAnmrxfe.js";import{c as i,i as a,l as o,n as s}from"./inventory-LH1vxuQz.js";function c({e}){return(0,l.jsxs)(`div`,{className:`osc-inv-head enc-rule`,style:{"--enc-pct":`${Math.round(e.pct*100)}%`,"--enc-stops":a(e)},children:[(0,l.jsx)(r,{children:`Inventory`}),(0,l.jsx)(i,{e})]})}var l,u,d,f,p,m,h,g,_,v,y;e((()=>{o(),s(),n(),l=t(),u={title:`Inventory / EncumbranceReadout`},d=[25,37.5,50],f=(e,t,n)=>({enabled:!0,value:t,max:1600,pct:Math.min(1,t/1600),tier:e,status:n,label:`${t} / 1600 cn`,moveBands:(()=>{let t=[120,90,60,30,0][e];return{encounter:t/3,explore:t,travel:t/5}})(),bands:d}),p=[f(0,300,`Unencumbered`),f(1,500,`Lightly encumbered`),f(2,700,`Heavily encumbered`),f(3,1200,`Severely encumbered`),f(4,1600,`Overloaded`)],m=()=>(0,l.jsx)(`div`,{className:`osc-inv`,style:{display:`flex`,flexDirection:`column`,gap:24,padding:16,width:520},children:p.map(e=>(0,l.jsx)(c,{e},e.tier))}),h=()=>(0,l.jsxs)(`div`,{className:`osc-inv`,style:{padding:16,width:480},children:[(0,l.jsx)(c,{e:f(2,690,`Heavily encumbered`)}),(0,l.jsxs)(`button`,{type:`button`,className:`osc-whead`,style:{display:`flex`,width:`100%`},children:[(0,l.jsx)(`span`,{className:`key`,children:`Wealth`}),(0,l.jsx)(`span`,{className:`v`,children:`152 gp`}),(0,l.jsx)(`span`,{className:`wt`,children:`140 cn`})]}),(0,l.jsxs)(`div`,{className:`osc-inv-sec-head`,children:[(0,l.jsx)(`span`,{className:`section-title sub`,children:`Equipped items`}),(0,l.jsx)(`span`,{className:`osc-inv-sec-count`,children:`4 items · 230 cn`})]}),(0,l.jsxs)(`div`,{className:`osc-inv-sec-head`,children:[(0,l.jsx)(`span`,{className:`section-title sub`,children:`All items`}),(0,l.jsx)(`span`,{className:`osc-inv-sec-count`,children:`9 items · 306 cn`})]})]}),g=()=>(0,l.jsx)(`div`,{style:{padding:40},children:(0,l.jsx)(`div`,{style:{width:260,height:60,overflow:`hidden`,outline:`1px dashed #a55`,padding:8},children:(0,l.jsx)(`div`,{className:`osc-inv`,style:{width:`100%`},children:(0,l.jsx)(c,{e:f(2,690,`Heavily encumbered`)})})})}),_=(e,t,n)=>{let r=t>=1600;return{...f(e,t,n),pct:Math.min(1,t/1600),label:`${t} / 1600 cn`,bands:r?[]:[50],barTier:r?3:e}},v=()=>(0,l.jsx)(`div`,{className:`osc-inv`,style:{display:`flex`,flexDirection:`column`,gap:24,padding:16,width:520},children:[_(0,0,`Unencumbered`),_(0,400,`Unencumbered`),_(1,800,`Lightly encumbered`),_(1,1200,`Lightly encumbered`),_(4,1600,`Overloaded`)].map(e=>(0,l.jsx)(c,{e},e.value))}),m.__docgenInfo={description:``,methods:[],displayName:`Tiers`},h.__docgenInfo={description:``,methods:[],displayName:`FullHeader`},g.__docgenInfo={description:``,methods:[],displayName:`ClippedAncestor`},v.__docgenInfo={description:``,methods:[],displayName:`BasicVariant`},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`() => <div className="osc-inv" style={{
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
      <button type="button" className="osc-whead" style={{
      display: "flex",
      width: "100%"
    }}>
        <span className="key">Wealth</span>
        <span className="v">152 gp</span>
        <span className="wt">140 cn</span>
      </button>
      <div className="osc-inv-sec-head">
        <span className="section-title sub">Equipped items</span>
        <span className="osc-inv-sec-count">4 items · 230 cn</span>
      </div>
      <div className="osc-inv-sec-head">
        <span className="section-title sub">All items</span>
        <span className="osc-inv-sec-count">9 items · 306 cn</span>
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