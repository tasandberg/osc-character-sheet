import{i as e}from"./preload-helper-xPQekRTU.js";import{t}from"./iframe-DdtYwEQP.js";import{n,t as r}from"./cx-DHrSZD_0.js";function i({popover:e,open:t,className:r,...i}){return(0,c.jsx)(`div`,{className:n(`menu`,e&&`is-popover`,t&&`is-open`,r),...i})}function a({children:e}){return(0,c.jsx)(`div`,{className:`menu-label`,children:e})}function o(){return(0,c.jsx)(`div`,{className:`menu-sep`})}function s({icon:e,shortcut:t,danger:r,children:i,className:a,...o}){return(0,c.jsxs)(`div`,{className:n(`menu-item`,r&&`danger`,a),role:`menuitem`,...o,children:[e!=null&&(0,c.jsx)(`span`,{className:`ic`,children:e}),i,t!=null&&(0,c.jsx)(`span`,{className:`shortcut`,children:t})]})}var c,l=e((()=>{r(),c=t(),i.__docgenInfo={description:`@category Overlays`,methods:[],displayName:`Menu`,props:{popover:{required:!1,tsType:{name:`boolean`},description:``},open:{required:!1,tsType:{name:`boolean`},description:``}}},a.__docgenInfo={description:``,methods:[],displayName:`MenuLabel`,props:{children:{required:!0,tsType:{name:`ReactNode`},description:``}}},o.__docgenInfo={description:``,methods:[],displayName:`MenuSep`},s.__docgenInfo={description:``,methods:[],displayName:`MenuItem`,props:{icon:{required:!1,tsType:{name:`ReactNode`},description:``},shortcut:{required:!1,tsType:{name:`ReactNode`},description:``},danger:{required:!1,tsType:{name:`boolean`},description:``}}}})),u,d,f,p,m;e((()=>{l(),u=t(),d={title:`Overlays / Menu`},f=()=>(0,u.jsxs)(i,{children:[(0,u.jsx)(a,{children:`Actions`}),(0,u.jsx)(s,{icon:`✎`,shortcut:`⌘E`,children:`Edit`}),(0,u.jsx)(s,{children:`Duplicate`}),(0,u.jsx)(o,{}),(0,u.jsx)(s,{danger:!0,children:`Delete`})]}),p=()=>(0,u.jsx)(`div`,{className:`menu-host`,style:{position:`relative`,height:240},children:(0,u.jsxs)(i,{popover:!0,open:!0,children:[(0,u.jsx)(a,{children:`Actions`}),(0,u.jsx)(s,{icon:`✎`,shortcut:`⌘E`,children:`Edit`}),(0,u.jsx)(s,{children:`Duplicate`}),(0,u.jsx)(o,{}),(0,u.jsx)(s,{danger:!0,children:`Delete`})]})}),f.__docgenInfo={description:``,methods:[],displayName:`List`},p.__docgenInfo={description:``,methods:[],displayName:`Popover`},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`() => <Menu>
    <MenuLabel>Actions</MenuLabel>
    <MenuItem icon="✎" shortcut="⌘E">
      Edit
    </MenuItem>
    <MenuItem>Duplicate</MenuItem>
    <MenuSep />
    <MenuItem danger>Delete</MenuItem>
  </Menu>`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`() => <div className="menu-host" style={{
  position: "relative",
  height: 240
}}>
    <Menu popover open>
      <MenuLabel>Actions</MenuLabel>
      <MenuItem icon="✎" shortcut="⌘E">
        Edit
      </MenuItem>
      <MenuItem>Duplicate</MenuItem>
      <MenuSep />
      <MenuItem danger>Delete</MenuItem>
    </Menu>
  </div>`,...p.parameters?.docs?.source}}},m=[`List`,`Popover`]}))();export{f as List,p as Popover,m as __namedExportsOrder,d as default};