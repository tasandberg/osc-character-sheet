import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{n,t as r}from"./iframe-DmyqL6ir.js";import{n as i,t as a}from"./Button-BA_9dkFd.js";import{n as o,t as s}from"./Modal-BZ_5UtuL.js";var c,l,u,d,f;e((()=>{c=t(n(),1),o(),i(),l=r(),u={title:`Overlays / Modal`},d=()=>{let[e,t]=c.useState(!0);return(0,l.jsx)(s,{open:e,title:`Level Up — Magic-User 3 → 4`,onClose:()=>t(!1),footer:(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(a,{variant:`ghost`,onClick:()=>t(!1),children:`Cancel`}),(0,l.jsx)(a,{variant:`primary`,onClick:()=>t(!1),children:`Confirm`})]}),children:`Your hit points increase and you gain access to new spell slots. Confirm to apply the changes to your character.`})},d.__docgenInfo={description:``,methods:[],displayName:`LevelUp`},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`() => {
  const [open, setOpen] = React.useState(true);
  return <Modal open={open} title="Level Up — Magic-User 3 → 4" onClose={() => setOpen(false)} footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </>}>
      Your hit points increase and you gain access to new spell slots. Confirm to apply
      the changes to your character.
    </Modal>;
}`,...d.parameters?.docs?.source}}},f=[`LevelUp`]}))();export{d as LevelUp,f as __namedExportsOrder,u as default};