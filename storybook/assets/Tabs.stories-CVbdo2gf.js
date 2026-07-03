import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{n,t as r}from"./iframe-hLbHAMVa.js";import{n as i,t as a}from"./cx-DHrSZD_0.js";function o({tabs:e,active:t,onSelect:n,className:r}){return(0,s.jsx)(`div`,{className:i(`tabs`,r),role:`tablist`,children:e.map(e=>(0,s.jsxs)(`button`,{type:`button`,role:`tab`,"aria-selected":e.id===t,className:i(`tab`,e.id===t&&`active`),onClick:()=>n(e.id),children:[e.label,e.count!=null&&(0,s.jsx)(`span`,{className:`count`,children:e.count})]},e.id))})}var s,c=e((()=>{a(),s=r(),o.__docgenInfo={description:`@category Navigation`,methods:[],displayName:`Tabs`,props:{tabs:{required:!0,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{ id: T; label: string; count?: number }`,signature:{properties:[{key:`id`,value:{name:`T`,required:!0}},{key:`label`,value:{name:`string`,required:!0}},{key:`count`,value:{name:`number`,required:!1}}]}}],raw:`Tab<T>[]`},description:``},active:{required:!0,tsType:{name:`T`},description:``},onSelect:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(id: T) => void`,signature:{arguments:[{type:{name:`T`},name:`id`}],return:{name:`void`}}},description:``},className:{required:!1,tsType:{name:`string`},description:``}}}})),l,u,d,f,p;e((()=>{l=t(n(),1),c(),u=r(),d={title:`Navigation / Tabs`},f=()=>{let[e,t]=l.useState(`actions`);return(0,u.jsx)(o,{active:e,onSelect:t,tabs:[{id:`actions`,label:`Actions`},{id:`inventory`,label:`Inventory`,count:15},{id:`spells`,label:`Spells`,count:3},{id:`abilities`,label:`Abilities`},{id:`notes`,label:`Notes`}]})},f.__docgenInfo={description:``,methods:[],displayName:`SheetTabs`},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`() => {
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
}`,...f.parameters?.docs?.source}}},p=[`SheetTabs`]}))();export{f as SheetTabs,p as __namedExportsOrder,d as default};