import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{n,t as r}from"./iframe-whKfrWvn.js";import{n as i,t as a}from"./NumberInput-B9VN4kts.js";function o({initial:e,min:t,max:n,disabled:r}){let[i,o]=(0,s.useState)(e);return(0,c.jsxs)(`label`,{style:{display:`flex`,flexDirection:`column`,gap:4,fontSize:12},children:[(0,c.jsx)(a,{className:`ed-input`,value:i,min:t,max:n,disabled:r,onCommit:o}),(0,c.jsxs)(`span`,{style:{opacity:.6},children:[`committed: `,i]})]})}var s,c,l,u,d;e((()=>{s=t(n(),1),i(),c=r(),l={title:`Controls / NumberInput`},u=()=>(0,c.jsxs)(`div`,{style:{display:`flex`,gap:24,alignItems:`flex-start`,flexWrap:`wrap`},children:[(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`div`,{style:{fontSize:11,opacity:.7},children:`Default`}),(0,c.jsx)(o,{initial:10})]}),(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`div`,{style:{fontSize:11,opacity:.7},children:`Clamped 1–20`}),(0,c.jsx)(o,{initial:12,min:1,max:20})]}),(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`div`,{style:{fontSize:11,opacity:.7},children:`Disabled`}),(0,c.jsx)(o,{initial:7,disabled:!0})]})]}),u.__docgenInfo={description:``,methods:[],displayName:`States`},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`() => <div style={{
  display: "flex",
  gap: 24,
  alignItems: "flex-start",
  flexWrap: "wrap"
}}>
    <div>
      <div style={{
      fontSize: 11,
      opacity: 0.7
    }}>Default</div>
      <Demo initial={10} />
    </div>
    <div>
      <div style={{
      fontSize: 11,
      opacity: 0.7
    }}>Clamped 1–20</div>
      <Demo initial={12} min={1} max={20} />
    </div>
    <div>
      <div style={{
      fontSize: 11,
      opacity: 0.7
    }}>Disabled</div>
      <Demo initial={7} disabled />
    </div>
  </div>`,...u.parameters?.docs?.source}}},d=[`States`]}))();export{u as States,d as __namedExportsOrder,l as default};