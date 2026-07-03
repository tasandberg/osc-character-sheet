import{i as e}from"./preload-helper-xPQekRTU.js";import{t}from"./iframe-CzeVOhfD.js";import{n,t as r}from"./cx-DHrSZD_0.js";import{n as i,t as a}from"./Stamp-3RL2B8kF.js";function o({className:e,...t}){return(0,u.jsx)(`table`,{className:n(`table`,e),...t})}function s({num:e,className:t,...r}){return(0,u.jsx)(`th`,{className:n(e&&`num`,t),...r})}function c({num:e,className:t,...r}){return(0,u.jsx)(`td`,{className:n(e&&`num`,t),...r})}function l(e){return(0,u.jsx)(`tr`,{...e})}var u,d=e((()=>{r(),u=t(),o.__docgenInfo={description:`@category Data`,methods:[],displayName:`Table`},s.__docgenInfo={description:``,methods:[],displayName:`Th`,props:{num:{required:!1,tsType:{name:`boolean`},description:``}}},c.__docgenInfo={description:``,methods:[],displayName:`Td`,props:{num:{required:!1,tsType:{name:`boolean`},description:``}}},l.__docgenInfo={description:``,methods:[],displayName:`Tr`}})),f,p,m,h,g;e((()=>{d(),i(),f=t(),p={title:`Data / Table`},m=()=>(0,f.jsxs)(o,{children:[(0,f.jsx)(`thead`,{children:(0,f.jsxs)(l,{children:[(0,f.jsx)(s,{children:(0,f.jsx)(a,{children:`Weapon`})}),(0,f.jsx)(s,{children:(0,f.jsx)(a,{children:`Damage`})}),(0,f.jsx)(s,{num:!0,children:(0,f.jsx)(a,{children:`Atk`})})]})}),(0,f.jsxs)(`tbody`,{children:[(0,f.jsxs)(l,{children:[(0,f.jsx)(c,{children:`Longsword`}),(0,f.jsx)(c,{children:`1d8`}),(0,f.jsx)(c,{num:!0,children:`+5`})]}),(0,f.jsxs)(l,{children:[(0,f.jsx)(c,{children:`Dagger`}),(0,f.jsx)(c,{children:`1d4`}),(0,f.jsx)(c,{num:!0,children:`+3`})]})]})]}),h=()=>(0,f.jsxs)(o,{children:[(0,f.jsx)(`thead`,{children:(0,f.jsxs)(l,{children:[(0,f.jsx)(s,{"aria-sort":`ascending`,children:(0,f.jsxs)(`button`,{type:`button`,style:{all:`unset`,cursor:`pointer`},children:[`Weapon `,(0,f.jsx)(`span`,{"aria-hidden":`true`,children:`▲`})]})}),(0,f.jsx)(s,{num:!0,children:(0,f.jsxs)(`button`,{type:`button`,style:{all:`unset`,cursor:`pointer`},children:[`Atk `,(0,f.jsx)(`span`,{"aria-hidden":`true`,children:`▾`})]})})]})}),(0,f.jsxs)(`tbody`,{children:[(0,f.jsxs)(l,{children:[(0,f.jsx)(c,{children:`Dagger`}),(0,f.jsx)(c,{num:!0,children:`+3`})]}),(0,f.jsxs)(l,{children:[(0,f.jsx)(c,{children:`Longsword`}),(0,f.jsx)(c,{num:!0,children:`+5`})]})]})]}),m.__docgenInfo={description:``,methods:[],displayName:`Weapons`},h.__docgenInfo={description:``,methods:[],displayName:`SortableHeader`},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`() => <Table>
    <thead>
      <Tr>
        <Th><Stamp>Weapon</Stamp></Th>
        <Th><Stamp>Damage</Stamp></Th>
        <Th num><Stamp>Atk</Stamp></Th>
      </Tr>
    </thead>
    <tbody>
      <Tr>
        <Td>Longsword</Td>
        <Td>1d8</Td>
        <Td num>+5</Td>
      </Tr>
      <Tr>
        <Td>Dagger</Td>
        <Td>1d4</Td>
        <Td num>+3</Td>
      </Tr>
    </tbody>
  </Table>`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`() => <Table>
    <thead>
      <Tr>
        <Th aria-sort="ascending">
          <button type="button" style={{
          all: "unset",
          cursor: "pointer"
        }}>
            Weapon <span aria-hidden="true">▲</span>
          </button>
        </Th>
        <Th num>
          <button type="button" style={{
          all: "unset",
          cursor: "pointer"
        }}>
            Atk <span aria-hidden="true">▾</span>
          </button>
        </Th>
      </Tr>
    </thead>
    <tbody>
      <Tr>
        <Td>Dagger</Td>
        <Td num>+3</Td>
      </Tr>
      <Tr>
        <Td>Longsword</Td>
        <Td num>+5</Td>
      </Tr>
    </tbody>
  </Table>`,...h.parameters?.docs?.source}}},g=[`Weapons`,`SortableHeader`]}))();export{h as SortableHeader,m as Weapons,g as __namedExportsOrder,p as default};