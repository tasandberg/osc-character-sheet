import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{n,t as r}from"./iframe-CzeVOhfD.js";import{n as i,t as a}from"./OverrideValue-lHM53Wzk.js";var o,s,c,l,u;e((()=>{o=t(n(),1),i(),s=r(),c={title:`Controls / OverrideValue`},l=()=>{let[e,t]=(0,o.useState)(!0);return(0,s.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:14,alignItems:`flex-start`},children:[(0,s.jsxs)(`div`,{children:[(0,s.jsx)(`div`,{style:{fontSize:11,opacity:.7},children:`Rule default (not overridden)`}),(0,s.jsx)(a,{overridden:!1,defaultText:`14`,onResetRequest:()=>{}})]}),(0,s.jsxs)(`div`,{children:[(0,s.jsx)(`div`,{style:{fontSize:11,opacity:.7},children:`Overridden (static)`}),(0,s.jsx)(a,{overridden:!0,defaultText:`14`,onResetRequest:()=>{}})]}),(0,s.jsxs)(`div`,{children:[(0,s.jsx)(`div`,{style:{fontSize:11,opacity:.7},children:`Overridden → click to reset`}),(0,s.jsx)(a,{overridden:e,defaultText:`14`,onResetRequest:()=>t(!1)})]})]})},l.__docgenInfo={description:``,methods:[],displayName:`States`},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`() => {
  const [overridden, setOverridden] = useState(true);
  return <div style={{
    display: "flex",
    flexDirection: "column",
    gap: 14,
    alignItems: "flex-start"
  }}>
      <div>
        <div style={{
        fontSize: 11,
        opacity: 0.7
      }}>Rule default (not overridden)</div>
        <OverrideValue overridden={false} defaultText="14" onResetRequest={() => {}} />
      </div>
      <div>
        <div style={{
        fontSize: 11,
        opacity: 0.7
      }}>Overridden (static)</div>
        <OverrideValue overridden defaultText="14" onResetRequest={() => {}} />
      </div>
      <div>
        <div style={{
        fontSize: 11,
        opacity: 0.7
      }}>Overridden → click to reset</div>
        <OverrideValue overridden={overridden} defaultText="14" onResetRequest={() => setOverridden(false)} />
      </div>
    </div>;
}`,...l.parameters?.docs?.source}}},u=[`States`]}))();export{l as States,u as __namedExportsOrder,c as default};