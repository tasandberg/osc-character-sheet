import{i as e}from"./preload-helper-xPQekRTU.js";import{t}from"./iframe-CzeVOhfD.js";import{n,t as r}from"./cx-DHrSZD_0.js";function i({label:e,hint:t,error:r,children:i,className:a,...s}){return(0,o.jsxs)(`div`,{className:n(`field`,a),...s,children:[e!=null&&(0,o.jsx)(`label`,{className:`field-label`,children:e}),i,r==null?t!=null&&(0,o.jsx)(`span`,{className:`field-hint`,children:t}):(0,o.jsx)(`span`,{className:`field-error`,children:r})]})}function a({invalid:e,className:t,...r}){return(0,o.jsx)(`input`,{className:n(`input`,e&&`is-error`,t),...r})}var o,s=e((()=>{r(),o=t(),i.__docgenInfo={description:`@category Controls`,methods:[],displayName:`Field`,props:{label:{required:!1,tsType:{name:`ReactNode`},description:``},hint:{required:!1,tsType:{name:`ReactNode`},description:``},error:{required:!1,tsType:{name:`ReactNode`},description:``}}},a.__docgenInfo={description:``,methods:[],displayName:`Input`,props:{invalid:{required:!1,tsType:{name:`boolean`},description:``}}}})),c,l,u,d;e((()=>{s(),c=t(),l={title:`Controls / Field`},u=()=>(0,c.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:18,maxWidth:320},children:[(0,c.jsx)(i,{label:`Character Name`,hint:`Shown on the sheet header.`,children:(0,c.jsx)(a,{placeholder:`Aldric the Bold`})}),(0,c.jsx)(i,{label:`Hit Points`,error:`Must be a positive number.`,children:(0,c.jsx)(a,{invalid:!0,defaultValue:`-3`})})]}),u.__docgenInfo={description:``,methods:[],displayName:`States`},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`() => <div style={{
  display: "flex",
  flexDirection: "column",
  gap: 18,
  maxWidth: 320
}}>
    <Field label="Character Name" hint="Shown on the sheet header.">
      <Input placeholder="Aldric the Bold" />
    </Field>
    <Field label="Hit Points" error="Must be a positive number.">
      <Input invalid defaultValue="-3" />
    </Field>
  </div>`,...u.parameters?.docs?.source}}},d=[`States`]}))();export{u as States,d as __namedExportsOrder,l as default};