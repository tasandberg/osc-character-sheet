import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{n,t as r}from"./iframe-twc5VBqy.js";import{n as i,t as a}from"./Stamp-xxR5IJZh.js";import{n as o,t as s}from"./useHpInput-B_MKU7E5.js";import{a as c,n as l,o as u,r as d}from"./MovePop-Cd2meW-Z.js";function f(e,t=.6){let n=(0,m.useRef)(null);return(0,m.useLayoutEffect)(()=>{let e=n.current;if(!e)return;let r=()=>{e.style.setProperty(`--fit-scale`,`1`);let n=e.clientWidth,r=e.scrollWidth,i=r>n&&r>0?Math.max(t,n/r):1;e.style.setProperty(`--fit-scale`,String(i))};r();let i=new ResizeObserver(r);return i.observe(e),()=>i.disconnect()},[e,t]),n}function p({identity:e,vitals:t,encumbrance:n,onSetHp:r,onPortraitContextMenu:i,canEditPortrait:s}){let u=t.moveBands,d=f(e.name),p=o({value:t.hp.value,max:t.hp.max,onSet:r??(()=>{})});return(0,h.jsxs)(`div`,{className:`osc-head`,children:[(0,h.jsx)(`div`,{className:`osc-portrait-wrap profile`,children:(0,h.jsx)(`img`,{className:`osc-portrait profile-img`,src:e.img||void 0,alt:e.name,"data-action":s?`editImage`:void 0,"data-edit":`img`,title:e.name,onContextMenu:i})}),(0,h.jsxs)(`div`,{className:`osc-ident`,children:[(0,h.jsx)(`div`,{className:`osc-name`,ref:d,children:e.name}),(0,h.jsxs)(`div`,{className:`osc-class`,children:[e.classLabel,` `,e.level,e.title?` · ${e.title}`:``,` · `,e.alignment]})]}),(0,h.jsxs)(`div`,{className:`osc-substats`,children:[(0,h.jsxs)(`div`,{className:`osc-tile`,children:[(0,h.jsx)(a,{children:`INIT`}),(0,h.jsx)(`div`,{className:`osc-tile-v`,children:c(t.initMod)})]}),(0,h.jsxs)(`div`,{className:`osc-tile`,children:[(0,h.jsx)(a,{children:`HD`}),(0,h.jsx)(`div`,{className:`osc-tile-v`,children:t.hd})]}),(0,h.jsxs)(`div`,{className:`osc-tile osc-tile-move`,children:[(0,h.jsx)(a,{children:`MOVE`}),(0,h.jsxs)(`div`,{className:`osc-tile-v`,children:[t.move,`ft`]}),(0,h.jsx)(l,{bands:u,tier:n?.enabled?n.tier:void 0,status:n?.enabled?n.status:void 0})]})]}),(0,h.jsxs)(`div`,{className:`osc-vitals`,children:[(0,h.jsxs)(`div`,{className:`osc-vital hp`,children:[(0,h.jsx)(a,{className:`vv-l`,children:`HP`}),(0,h.jsxs)(`div`,{className:`vv-row`,children:[r&&(0,h.jsx)(`button`,{type:`button`,className:`vv-step`,"aria-label":`Lose 1 HP`,onClick:p.dec,children:`−`}),(0,h.jsx)(`div`,{className:`vv-big vv-value`,children:t.hp.value}),r&&(0,h.jsx)(`input`,{className:`vv-big vv-input`,"aria-label":`Current HP`,...p.inputProps},p.key),r&&(0,h.jsx)(`button`,{type:`button`,className:`vv-step`,"aria-label":`Heal 1 HP`,onClick:p.inc,children:`+`})]}),(0,h.jsxs)(`div`,{className:`vv-sub`,children:[(0,h.jsxs)(`span`,{className:`full`,children:[`Max `,t.hp.max]}),(0,h.jsxs)(`span`,{className:`short`,children:[`/`,t.hp.max]})]})]}),(0,h.jsxs)(`div`,{className:`osc-vital ac`,children:[(0,h.jsx)(a,{className:`vv-l`,children:`AC`}),(0,h.jsx)(`div`,{className:`vv-row`,children:(0,h.jsx)(`div`,{className:`vv-big`,"data-testid":`ac-value`,children:t.ac.value})}),(0,h.jsxs)(`div`,{className:`vv-sub`,children:[(0,h.jsx)(`span`,{className:`full`,children:t.ac.ascending?`Ascending`:`Descending`}),(0,h.jsx)(`span`,{className:`short`,children:t.ac.ascending?`asc`:`desc`})]})]})]})]})}var m,h,g=e((()=>{m=t(n(),1),u(),i(),d(),s(),h=r(),p.__docgenInfo={description:`Header band. Grid areas (see actions.scss) place: portrait · name+Init/HD/Move
 · HP/AC in medium, and stack them in the rail.`,methods:[],displayName:`HeaderBand`,props:{identity:{required:!0,tsType:{name:`IdentityVM`},description:``},vitals:{required:!0,tsType:{name:`VitalsVM`},description:``},encumbrance:{required:!1,tsType:{name:`EncumbranceVM`},description:`Drives the encumbrance line in the MOVE hover — why the rates are what they are.`},onSetHp:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(value: number) => void`,signature:{arguments:[{type:{name:`number`},name:`value`}],return:{name:`void`}}},description:`Commit a new current-HP value; when provided, HP renders an editable input.`},onPortraitContextMenu:{required:!1,tsType:{name:`ReactMouseEventHandler`,raw:`React.MouseEventHandler<HTMLImageElement>`,elements:[{name:`HTMLImageElement`}]},description:`Right-click on the portrait (e.g. Token Variant Art's picker).`},canEditPortrait:{required:!1,tsType:{name:`boolean`},description:"When true, left-click opens the image FilePicker (core `editImage` action)."}}}})),_,v,y,b,x,S,C;e((()=>{g(),_=r(),v={title:`Shell / HeaderBand`},y={name:`Eldra Vey`,img:``,classLabel:`Magic-User`,level:3,alignment:`Neutral`,title:`Conjurer`},b={enabled:!0,value:700,max:1600,pct:700/1600,tier:2,status:`Heavily encumbered`,label:`700 / 1600 cn`,moveBands:{encounter:20,explore:60,travel:12},bands:[25,37.5,50]},x=()=>(0,_.jsx)(p,{identity:y,vitals:{hp:{value:8,max:9},ac:{value:12,ascending:!0},initMod:1,hd:`3d4`,move:120,moveBands:{encounter:40,explore:120,travel:24}}}),S=()=>(0,_.jsx)(p,{identity:y,vitals:{hp:{value:8,max:9},ac:{value:12,ascending:!0},initMod:1,hd:`3d4`,move:60,moveBands:b.moveBands},encumbrance:b}),x.__docgenInfo={description:``,methods:[],displayName:`Default`},S.__docgenInfo={description:`Hover MOVE: the rates plus the tier that explains them — same tint as the inventory line.`,methods:[],displayName:`Encumbered`},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`() => <HeaderBand identity={identity} vitals={{
  hp: {
    value: 8,
    max: 9
  },
  ac: {
    value: 12,
    ascending: true
  },
  initMod: 1,
  hd: "3d4",
  move: 120,
  moveBands: {
    encounter: 40,
    explore: 120,
    travel: 24
  }
}} />`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`() => <HeaderBand identity={identity} vitals={{
  hp: {
    value: 8,
    max: 9
  },
  ac: {
    value: 12,
    ascending: true
  },
  initMod: 1,
  hd: "3d4",
  move: 60,
  moveBands: encumbrance.moveBands
}} encumbrance={encumbrance} />`,...S.parameters?.docs?.source},description:{story:`Hover MOVE: the rates plus the tier that explains them — same tint as the inventory line.`,...S.parameters?.docs?.description}}},C=[`Default`,`Encumbered`]}))();export{x as Default,S as Encumbered,C as __namedExportsOrder,v as default};