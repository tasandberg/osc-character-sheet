import{i as e}from"./preload-helper-xPQekRTU.js";import{t}from"./iframe-twc5VBqy.js";import{n,t as r}from"./SectionTitle-DAZ3AB7r.js";import{a as i,n as a,o,r as s}from"./inventory-vkGniH-k.js";function c({e}){return(0,l.jsxs)(`div`,{className:`osc-inv-head enc-rule`,style:{"--enc-pct":`${Math.round(e.pct*100)}%`,"--enc-stops":a(e)},children:[(0,l.jsx)(r,{children:`Inventory`}),(0,l.jsx)(i,{e})]})}var l,u,d,f,p,m,h,g,_,v;e((()=>{o(),s(),n(),l=t(),u={title:`Inventory / EncumbranceReadout`},d=[25,37.5,50],f=(e,t,n)=>({enabled:!0,value:t,max:1600,pct:Math.min(1,t/1600),tier:e,status:n,label:`${t} / 1600 cn`,moveBands:(()=>{let t=[120,90,60,30,0][e];return{encounter:t/3,explore:t,travel:t/5}})(),bands:d}),p=[f(0,300,`Unencumbered`),f(1,500,`Lightly encumbered`),f(2,700,`Heavily encumbered`),f(3,1200,`Severely encumbered`),f(4,1600,`Overloaded`)],m=()=>(0,l.jsx)(`div`,{className:`osc-inv`,style:{display:`flex`,flexDirection:`column`,gap:24,padding:16,width:520},children:p.map(e=>(0,l.jsx)(c,{e},e.tier))}),h=()=>(0,l.jsxs)(`div`,{className:`osc-inv`,style:{padding:16,width:480},children:[(0,l.jsx)(c,{e:f(2,690,`Heavily encumbered`)}),(0,l.jsxs)(`button`,{type:`button`,className:`osc-whead`,style:{display:`flex`,width:`100%`},children:[(0,l.jsx)(`span`,{className:`key`,children:`Wealth`}),(0,l.jsx)(`span`,{className:`v`,children:`152 gp`}),(0,l.jsx)(`span`,{className:`wt`,children:`140 cn`})]}),(0,l.jsxs)(`div`,{className:`osc-inv-sec-head`,children:[(0,l.jsx)(`span`,{className:`section-title sub`,children:`Equipped items`}),(0,l.jsx)(`span`,{className:`osc-inv-sec-count`,children:`4 items · 230 cn`})]}),(0,l.jsxs)(`div`,{className:`osc-inv-sec-head`,children:[(0,l.jsx)(`span`,{className:`section-title sub`,children:`All items`}),(0,l.jsx)(`span`,{className:`osc-inv-sec-count`,children:`9 items · 306 cn`})]})]}),g=()=>(0,l.jsx)(`div`,{style:{padding:40},children:(0,l.jsx)(`div`,{style:{width:260,height:60,overflow:`hidden`,outline:`1px dashed #a55`,padding:8},children:(0,l.jsx)(`div`,{className:`osc-inv`,style:{width:`100%`},children:(0,l.jsx)(c,{e:f(2,690,`Heavily encumbered`)})})})}),_=()=>(0,l.jsx)(`div`,{className:`osc-inv`,style:{padding:16,width:520},children:(0,l.jsx)(c,{e:{...f(2,0,`Heavily encumbered`),pct:2/3,label:``,bands:[]}})}),m.__docgenInfo={description:``,methods:[],displayName:`Tiers`},h.__docgenInfo={description:``,methods:[],displayName:`FullHeader`},g.__docgenInfo={description:``,methods:[],displayName:`ClippedAncestor`},_.__docgenInfo={description:``,methods:[],displayName:`BasicVariant`},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`() => <div className="osc-inv" style={{
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
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`() => {
  const e: EncumbranceVM = {
    ...vm(2, 0, "Heavily encumbered"),
    pct: 2 / 3,
    label: "",
    bands: []
  };
  return <div className="osc-inv" style={{
    padding: 16,
    width: 520
  }}>
      <Head e={e} />
    </div>;
}`,..._.parameters?.docs?.source}}},v=[`Tiers`,`FullHeader`,`ClippedAncestor`,`BasicVariant`]}))();export{_ as BasicVariant,g as ClippedAncestor,h as FullHeader,m as Tiers,v as __namedExportsOrder,u as default};