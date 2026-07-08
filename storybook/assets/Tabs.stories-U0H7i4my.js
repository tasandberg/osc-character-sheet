import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{n,t as r}from"./iframe-C7mwxZh-.js";import{n as i,t as a}from"./Tabs-DH-WzoRd.js";var o,s,c,l,u;e((()=>{o=t(n(),1),i(),s=r(),c={title:`Navigation / Tabs`},l=()=>{let[e,t]=o.useState(`actions`);return(0,s.jsx)(a,{active:e,onSelect:t,tabs:[{id:`actions`,label:`Actions`},{id:`inventory`,label:`Inventory`,count:15},{id:`spells`,label:`Spells`,count:3},{id:`abilities`,label:`Abilities`},{id:`notes`,label:`Notes`}]})},l.__docgenInfo={description:``,methods:[],displayName:`SheetTabs`},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`() => {
  const [active, setActive] = React.useState("actions");
  return <Tabs active={active} onSelect={setActive} tabs={[{
    id: "actions",
    label: "Actions"
  }, {
    id: "inventory",
    label: "Inventory",
    count: 15
  }, {
    id: "spells",
    label: "Spells",
    count: 3
  }, {
    id: "abilities",
    label: "Abilities"
  }, {
    id: "notes",
    label: "Notes"
  }]} />;
}`,...l.parameters?.docs?.source}}},u=[`SheetTabs`]}))();export{l as SheetTabs,u as __namedExportsOrder,c as default};