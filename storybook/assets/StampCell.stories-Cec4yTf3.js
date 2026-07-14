import{i as e,s as t}from"./preload-helper-xPQekRTU.js";import{n,t as r}from"./iframe-DmyqL6ir.js";import{n as i,t as a}from"./StampCell-DvdOC9xM.js";function o(e){let[t,n]=(0,s.useState)(e.initial),[r,i]=(0,s.useState)(!!e.overridden);return(0,c.jsx)(a,{stampKey:e.stampKey,fullName:e.fullName,value:t,min:3,max:18,caption:e.caption,overridden:r,warn:e.warn,warnTitle:e.warnTitle,onChange:n,onResetRequest:e.withReset?()=>i(!1):void 0})}var s,c,l,u,d;e((()=>{s=t(n(),1),i(),c=r(),l={title:`Display / StampCell`},u=()=>(0,c.jsxs)(`div`,{style:{display:`flex`,gap:16,alignItems:`flex-start`,flexWrap:`wrap`},children:[(0,c.jsx)(o,{stampKey:`STR`,fullName:`Strength`,initial:13,caption:`+1`}),(0,c.jsx)(o,{stampKey:`DEX`,fullName:`Dexterity`,initial:16,caption:`+2`,overridden:!0,withReset:!0}),(0,c.jsx)(o,{stampKey:`CON`,fullName:`Constitution`,initial:6,caption:`−1`,warn:!0,warnTitle:`Below class requirement`})]}),u.__docgenInfo={description:``,methods:[],displayName:`States`},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`() => <div style={{
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
  flexWrap: "wrap"
}}>
    <Cell stampKey="STR" fullName="Strength" initial={13} caption="+1" />
    <Cell stampKey="DEX" fullName="Dexterity" initial={16} caption="+2" overridden withReset />
    <Cell stampKey="CON" fullName="Constitution" initial={6} caption="−1" warn warnTitle="Below class requirement" />
  </div>`,...u.parameters?.docs?.source}}},d=[`States`]}))();export{u as States,d as __namedExportsOrder,l as default};