import{i as e}from"./preload-helper-xPQekRTU.js";import{t}from"./iframe-whKfrWvn.js";import{n,t as r}from"./cx-DHrSZD_0.js";function i({src:e,onPick:t,placeholder:r=`portrait`,className:i}){return(0,a.jsx)(`button`,{type:`button`,className:n(`ed-portrait`,i),onClick:()=>{let n=foundry.applications?.apps?.FilePicker?.implementation??globalThis.FilePicker;n&&new n({type:`image`,current:e??``,callback:e=>t(e)}).render(!0)},title:`Change portrait`,"aria-label":`Change portrait`,children:e?(0,a.jsx)(`img`,{src:e,alt:``}):(0,a.jsx)(`span`,{className:`ed-portrait-ph`,children:r})})}var a,o=e((()=>{r(),a=t(),i.__docgenInfo={description:`@category Layout — framed portrait. Teal corner ticks, square via
 aspect-ratio. Click opens Foundry's FilePicker; the chosen path is returned
 via onPick (the caller persists it to actor.img).`,methods:[],displayName:`PortraitField`,props:{src:{required:!1,tsType:{name:`string`},description:``},onPick:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(path: string) => void`,signature:{arguments:[{type:{name:`string`},name:`path`}],return:{name:`void`}}},description:``},placeholder:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`"portrait"`,computed:!1}},className:{required:!1,tsType:{name:`string`},description:``}}}})),s,c,l,u,d;e((()=>{o(),s=t(),c={title:`Layout / PortraitField`},l=`data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'120'%20height%3D'120'%3E%3Crect%20width%3D'120'%20height%3D'120'%20fill%3D'%232b2620'%2F%3E%3Ccircle%20cx%3D'60'%20cy%3D'48'%20r%3D'24'%20fill%3D'%238a7a52'%2F%3E%3Crect%20x%3D'30'%20y%3D'78'%20width%3D'60'%20height%3D'34'%20rx%3D'12'%20fill%3D'%238a7a52'%2F%3E%3C%2Fsvg%3E`,u=()=>(0,s.jsxs)(`div`,{style:{display:`flex`,gap:20,alignItems:`flex-start`},children:[(0,s.jsxs)(`div`,{style:{width:120},children:[(0,s.jsx)(`div`,{style:{fontSize:11,opacity:.7,marginBottom:4},children:`With portrait`}),(0,s.jsx)(i,{src:l,onPick:()=>{}})]}),(0,s.jsxs)(`div`,{style:{width:120},children:[(0,s.jsx)(`div`,{style:{fontSize:11,opacity:.7,marginBottom:4},children:`Empty (placeholder)`}),(0,s.jsx)(i,{onPick:()=>{}})]})]}),u.__docgenInfo={description:``,methods:[],displayName:`States`},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`() => <div style={{
  display: "flex",
  gap: 20,
  alignItems: "flex-start"
}}>
    <div style={{
    width: 120
  }}>
      <div style={{
      fontSize: 11,
      opacity: 0.7,
      marginBottom: 4
    }}>With portrait</div>
      <PortraitField src={sample} onPick={() => {}} />
    </div>
    <div style={{
    width: 120
  }}>
      <div style={{
      fontSize: 11,
      opacity: 0.7,
      marginBottom: 4
    }}>Empty (placeholder)</div>
      <PortraitField onPick={() => {}} />
    </div>
  </div>`,...u.parameters?.docs?.source}}},d=[`States`]}))();export{u as States,d as __namedExportsOrder,c as default};