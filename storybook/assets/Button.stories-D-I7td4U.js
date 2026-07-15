import{i as e}from"./preload-helper-xPQekRTU.js";import{t}from"./iframe-B6KXWk_e.js";import{n,t as r}from"./Button-CGjoKo12.js";var i,a,o,s,c,l,u;e((()=>{n(),i=t(),a={title:`Controls / Button`},o=({label:e,children:t})=>(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:6},children:[(0,i.jsx)(`span`,{style:{fontSize:11,letterSpacing:`0.08em`,textTransform:`uppercase`,opacity:.6},children:e}),(0,i.jsx)(`div`,{style:{display:`flex`,gap:10,flexWrap:`wrap`,alignItems:`center`},children:t})]}),s=()=>(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:20},children:[(0,i.jsxs)(o,{label:`Variants`,children:[(0,i.jsx)(r,{children:`Default`}),(0,i.jsx)(r,{variant:`primary`,children:`Primary`}),(0,i.jsx)(r,{variant:`outline`,children:`Outline`}),(0,i.jsx)(r,{variant:`danger`,children:`Danger`}),(0,i.jsx)(r,{variant:`ghost`,children:`Ghost`})]}),(0,i.jsxs)(o,{label:`Sizes & state`,children:[(0,i.jsx)(r,{variant:`primary`,children:`Default size`}),(0,i.jsx)(r,{variant:`primary`,size:`sm`,children:`Small`}),(0,i.jsx)(r,{variant:`primary`,disabled:!0,children:`Disabled`})]})]}),c=[`accent`,`brass`,`danger`,`success`,`warn`],l=()=>(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:20},children:[(0,i.jsxs)(o,{label:`Outline tones`,children:[(0,i.jsx)(r,{variant:`outline`,children:`default`}),c.map(e=>(0,i.jsx)(r,{variant:`outline`,tone:e,children:e},e))]}),(0,i.jsx)(o,{label:`Outline tones · with icon`,children:c.map(e=>(0,i.jsxs)(r,{variant:`outline`,tone:e,children:[(0,i.jsx)(`i`,{className:`fa-solid fa-dice-d20 u-mr-1`,"aria-hidden":`true`}),e]},e))}),(0,i.jsx)(o,{label:`Outline tones · small`,children:c.map(e=>(0,i.jsx)(r,{variant:`outline`,tone:e,size:`sm`,children:e},e))}),(0,i.jsx)(o,{label:`Outline tones · disabled (e.g. read-only Attack)`,children:c.map(e=>(0,i.jsx)(r,{variant:`outline`,tone:e,disabled:!0,children:e},e))})]}),s.__docgenInfo={description:``,methods:[],displayName:`Variants`},l.__docgenInfo={description:``,methods:[],displayName:`OutlineTones`},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => <div style={{
  display: "flex",
  flexDirection: "column",
  gap: 20
}}>
    <Row label="Variants">
      <Button>Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
    </Row>
    <Row label="Sizes & state">
      <Button variant="primary">Default size</Button>
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" disabled>Disabled</Button>
    </Row>
  </div>`,...s.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`() => <div style={{
  display: "flex",
  flexDirection: "column",
  gap: 20
}}>
    <Row label="Outline tones">
      <Button variant="outline">default</Button>
      {TONES.map(tone => <Button key={tone} variant="outline" tone={tone}>
          {tone}
        </Button>)}
    </Row>
    <Row label="Outline tones · with icon">
      {TONES.map(tone => <Button key={tone} variant="outline" tone={tone}>
          <i className="fa-solid fa-dice-d20 u-mr-1" aria-hidden="true" />
          {tone}
        </Button>)}
    </Row>
    <Row label="Outline tones · small">
      {TONES.map(tone => <Button key={tone} variant="outline" tone={tone} size="sm">
          {tone}
        </Button>)}
    </Row>
    <Row label="Outline tones · disabled (e.g. read-only Attack)">
      {TONES.map(tone => <Button key={tone} variant="outline" tone={tone} disabled>
          {tone}
        </Button>)}
    </Row>
  </div>`,...l.parameters?.docs?.source}}},u=[`Variants`,`OutlineTones`]}))();export{l as OutlineTones,s as Variants,u as __namedExportsOrder,a as default};