import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{n,t as r}from"./iframe-DdtYwEQP.js";import{n as i,t as a}from"./cx-DHrSZD_0.js";function o({variant:e,size:t,on:n,className:r,type:a=`button`,...o}){return(0,s.jsx)(`button`,{type:a,className:i(`icon-btn`,e,t,n&&`on`,r),...o})}var s,c=e((()=>{a(),s=r(),o.__docgenInfo={description:"Icon-only button — a transparent square wrapping a single glyph (FontAwesome\n`<i>` or a character). The canonical replacement for the hand-rolled\n`.ft-chev` / `.ft-del` / `.rs-feat-add` / `.rs-lang-go` / `.sp-trash` one-offs.\nStyling lives in `.icon-btn` (components.css), which is auto-scoped under\n`.reactor-sheet` so it beats the `.reactor-sheet-app button` reset.\n\n@category Controls",methods:[],displayName:`IconButton`,props:{variant:{required:!1,tsType:{name:`union`,raw:`"danger" | "accent" | "round"`,elements:[{name:`literal`,value:`"danger"`},{name:`literal`,value:`"accent"`},{name:`literal`,value:`"round"`}]},description:`Hover/intent treatment. Default = neutral (faint → text-dim).`},size:{required:!1,tsType:{name:`literal`,value:`"sm"`},description:`Compact 18px box for inline carets / × / trash glyphs.`},on:{required:!1,tsType:{name:`boolean`},description:`Toggled/active state (e.g. an edit-mode pen).`},type:{defaultValue:{value:`"button"`,computed:!1},required:!1}}}})),l,u,d,f,p,m;e((()=>{l=t(n(),1),c(),u=r(),d={title:`Controls / IconButton`},f=()=>(0,u.jsxs)(`div`,{style:{display:`flex`,gap:12,alignItems:`center`,flexWrap:`wrap`},children:[(0,u.jsx)(o,{title:`Default`,"aria-label":`Default`,children:(0,u.jsx)(`i`,{className:`fa-solid fa-pen`,"aria-hidden":`true`})}),(0,u.jsx)(o,{variant:`danger`,title:`Delete`,"aria-label":`Delete`,children:(0,u.jsx)(`i`,{className:`fa-solid fa-trash`,"aria-hidden":`true`})}),(0,u.jsx)(o,{variant:`accent`,title:`Add`,"aria-label":`Add`,children:(0,u.jsx)(`i`,{className:`fa-solid fa-plus`,"aria-hidden":`true`})}),(0,u.jsx)(o,{variant:`accent`,on:!0,title:`Editing`,"aria-label":`Editing`,children:(0,u.jsx)(`i`,{className:`fa-solid fa-check`,"aria-hidden":`true`})}),(0,u.jsx)(o,{variant:`round`,title:`Add language`,"aria-label":`Add language`,children:(0,u.jsx)(`i`,{className:`fa-solid fa-plus`,"aria-hidden":`true`})}),(0,u.jsx)(o,{size:`sm`,variant:`danger`,title:`Remove`,"aria-label":`Remove`,children:(0,u.jsx)(`i`,{className:`fa-solid fa-xmark`,"aria-hidden":`true`})}),(0,u.jsx)(o,{disabled:!0,title:`Disabled`,"aria-label":`Disabled`,children:(0,u.jsx)(`i`,{className:`fa-solid fa-plus`,"aria-hidden":`true`})})]}),p=()=>{let[e,t]=(0,l.useState)(!1);return(0,u.jsxs)(`div`,{style:{display:`flex`,gap:12,alignItems:`center`,flexWrap:`wrap`},children:[(0,u.jsx)(o,{on:e,onClick:()=>t(e=>!e),title:e?`Collapse`:`Expand`,"aria-label":e?`Collapse`:`Expand`,"aria-expanded":e,children:e?`▾`:`▸`}),(0,u.jsx)(o,{title:`Expand`,"aria-label":`Expand`,"aria-expanded":!1,children:(0,u.jsx)(`i`,{className:`fa-solid fa-chevron-right`,"aria-hidden":`true`})})]})},f.__docgenInfo={description:``,methods:[],displayName:`Variants`},p.__docgenInfo={description:``,methods:[],displayName:`ExpandToggle`},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`() => <div style={{
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap"
}}>
    <IconButton title="Default" aria-label="Default">
      <i className="fa-solid fa-pen" aria-hidden="true" />
    </IconButton>
    <IconButton variant="danger" title="Delete" aria-label="Delete">
      <i className="fa-solid fa-trash" aria-hidden="true" />
    </IconButton>
    <IconButton variant="accent" title="Add" aria-label="Add">
      <i className="fa-solid fa-plus" aria-hidden="true" />
    </IconButton>
    <IconButton variant="accent" on title="Editing" aria-label="Editing">
      <i className="fa-solid fa-check" aria-hidden="true" />
    </IconButton>
    <IconButton variant="round" title="Add language" aria-label="Add language">
      <i className="fa-solid fa-plus" aria-hidden="true" />
    </IconButton>
    <IconButton size="sm" variant="danger" title="Remove" aria-label="Remove">
      <i className="fa-solid fa-xmark" aria-hidden="true" />
    </IconButton>
    <IconButton disabled title="Disabled" aria-label="Disabled">
      <i className="fa-solid fa-plus" aria-hidden="true" />
    </IconButton>
  </div>`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`() => {
  const [open, setOpen] = useState(false);
  return <div style={{
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap"
  }}>
      <IconButton on={open} onClick={() => setOpen(o => !o)} title={open ? "Collapse" : "Expand"} aria-label={open ? "Collapse" : "Expand"} aria-expanded={open}>
        {open ? "▾" : "▸"}
      </IconButton>
      <IconButton title="Expand" aria-label="Expand" aria-expanded={false}>
        <i className="fa-solid fa-chevron-right" aria-hidden="true" />
      </IconButton>
    </div>;
}`,...p.parameters?.docs?.source}}},m=[`Variants`,`ExpandToggle`]}))();export{p as ExpandToggle,f as Variants,m as __namedExportsOrder,d as default};