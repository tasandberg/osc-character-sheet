import{i as e}from"./preload-helper-xPQekRTU.js";import{t}from"./iframe-CxYkFekg.js";import{n,t as r}from"./cx-DHrSZD_0.js";function i({sides:e,value:t,verdict:r,rolling:i,className:o}){return(0,a.jsx)(`div`,{className:n(`die`,`d${e}`,r,i&&`rolling`,o),children:(0,a.jsx)(`span`,{className:`face`,children:t})})}var a,o=e((()=>{r(),a=t(),i.__docgenInfo={description:`@category Display`,methods:[],displayName:`Die`,props:{sides:{required:!0,tsType:{name:`union`,raw:`4 | 6 | 8 | 20`,elements:[{name:`literal`,value:`4`},{name:`literal`,value:`6`},{name:`literal`,value:`8`},{name:`literal`,value:`20`}]},description:``},value:{required:!0,tsType:{name:`number`},description:``},verdict:{required:!1,tsType:{name:`union`,raw:`"crit" | "fumble"`,elements:[{name:`literal`,value:`"crit"`},{name:`literal`,value:`"fumble"`}]},description:``},rolling:{required:!1,tsType:{name:`boolean`},description:``},className:{required:!1,tsType:{name:`string`},description:``}}}})),s,c,l,u;e((()=>{o(),s=t(),c={title:`Display / Die`},l=()=>(0,s.jsxs)(`div`,{style:{display:`flex`,gap:12,flexWrap:`wrap`,alignItems:`center`},children:[(0,s.jsx)(i,{sides:4,value:3}),(0,s.jsx)(i,{sides:6,value:5}),(0,s.jsx)(i,{sides:8,value:6}),(0,s.jsx)(i,{sides:20,value:14}),(0,s.jsx)(i,{sides:20,value:20,verdict:`crit`}),(0,s.jsx)(i,{sides:20,value:1,verdict:`fumble`})]}),l.__docgenInfo={description:``,methods:[],displayName:`Dice`},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`() => <div style={{
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center"
}}>
    <Die sides={4} value={3} />
    <Die sides={6} value={5} />
    <Die sides={8} value={6} />
    <Die sides={20} value={14} />
    <Die sides={20} value={20} verdict="crit" />
    <Die sides={20} value={1} verdict="fumble" />
  </div>`,...l.parameters?.docs?.source}}},u=[`Dice`]}))();export{l as Dice,u as __namedExportsOrder,c as default};