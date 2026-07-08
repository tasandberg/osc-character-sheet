import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{n,t as r}from"./iframe-CYViEK4o.js";import{n as i,t as a}from"./IconButton-CbGfoscQ.js";var o,s,c,l,u,d;e((()=>{o=t(n(),1),i(),s=r(),c={title:`Controls / IconButton`},l=()=>(0,s.jsxs)(`div`,{style:{display:`flex`,gap:12,alignItems:`center`,flexWrap:`wrap`},children:[(0,s.jsx)(a,{title:`Default`,"aria-label":`Default`,children:(0,s.jsx)(`i`,{className:`fa-solid fa-pen`,"aria-hidden":`true`})}),(0,s.jsx)(a,{variant:`danger`,title:`Delete`,"aria-label":`Delete`,children:(0,s.jsx)(`i`,{className:`fa-solid fa-trash`,"aria-hidden":`true`})}),(0,s.jsx)(a,{variant:`accent`,title:`Add`,"aria-label":`Add`,children:(0,s.jsx)(`i`,{className:`fa-solid fa-plus`,"aria-hidden":`true`})}),(0,s.jsx)(a,{variant:`accent`,on:!0,title:`Editing`,"aria-label":`Editing`,children:(0,s.jsx)(`i`,{className:`fa-solid fa-check`,"aria-hidden":`true`})}),(0,s.jsx)(a,{variant:`round`,title:`Add language`,"aria-label":`Add language`,children:(0,s.jsx)(`i`,{className:`fa-solid fa-plus`,"aria-hidden":`true`})}),(0,s.jsx)(a,{size:`sm`,variant:`danger`,title:`Remove`,"aria-label":`Remove`,children:(0,s.jsx)(`i`,{className:`fa-solid fa-xmark`,"aria-hidden":`true`})}),(0,s.jsx)(a,{disabled:!0,title:`Disabled`,"aria-label":`Disabled`,children:(0,s.jsx)(`i`,{className:`fa-solid fa-plus`,"aria-hidden":`true`})})]}),u=()=>{let[e,t]=(0,o.useState)(!1);return(0,s.jsxs)(`div`,{style:{display:`flex`,gap:12,alignItems:`center`,flexWrap:`wrap`},children:[(0,s.jsx)(a,{on:e,onClick:()=>t(e=>!e),title:e?`Collapse`:`Expand`,"aria-label":e?`Collapse`:`Expand`,"aria-expanded":e,children:e?`▾`:`▸`}),(0,s.jsx)(a,{title:`Expand`,"aria-label":`Expand`,"aria-expanded":!1,children:(0,s.jsx)(`i`,{className:`fa-solid fa-chevron-right`,"aria-hidden":`true`})})]})},l.__docgenInfo={description:``,methods:[],displayName:`Variants`},u.__docgenInfo={description:``,methods:[],displayName:`ExpandToggle`},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`() => <div style={{
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
  </div>`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`() => {
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
}`,...u.parameters?.docs?.source}}},d=[`Variants`,`ExpandToggle`]}))();export{u as ExpandToggle,l as Variants,d as __namedExportsOrder,c as default};