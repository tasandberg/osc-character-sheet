import{i as e}from"./preload-helper-xPQekRTU.js";import{t}from"./iframe-DHGnIVo2.js";var n,r,i,a,o,s,c,l;e((()=>{n=t(),r={title:`Foundations / Utilities`},i=({children:e})=>(0,n.jsx)(`div`,{className:`u-text-muted u-mb-2`,style:{fontFamily:`var(--mono)`,fontSize:`var(--fs-2xs)`},children:e}),a=({children:e})=>(0,n.jsx)(`div`,{className:`u-bg-surface-2 u-border-soft u-text-dim`,style:{minWidth:32,minHeight:32,display:`grid`,placeItems:`center`,fontFamily:`var(--mono)`,fontSize:`var(--fs-3xs)`},children:e}),o=[1,2,3,4,5,6,8,10,12],s=()=>(0,n.jsxs)(`div`,{className:`u-stack u-gap-4`,children:[(0,n.jsxs)(i,{children:[`padding — .u-p-`,`{step}`]}),(0,n.jsx)(`div`,{className:`u-row u-gap-3 u-items-end u-wrap`,children:o.map(e=>(0,n.jsxs)(`div`,{className:`u-stack u-gap-1 u-items-center`,children:[(0,n.jsx)(`div`,{className:`u-bg-accent u-p-${e}`,style:{borderRadius:`var(--r-sm)`},children:(0,n.jsx)(`div`,{className:`u-bg-ink`,style:{width:16,height:16}})}),(0,n.jsx)(`div`,{className:`u-text-faint`,style:{fontFamily:`var(--mono)`,fontSize:`var(--fs-3xs)`},children:e})]},e))})]}),c=()=>(0,n.jsxs)(`div`,{className:`u-stack u-gap-6`,children:[(0,n.jsxs)(`div`,{children:[(0,n.jsx)(i,{children:`.u-stack (flex column + gap)`}),(0,n.jsxs)(`div`,{className:`u-stack u-gap-2`,children:[(0,n.jsx)(a,{children:`1`}),(0,n.jsx)(a,{children:`2`}),(0,n.jsx)(a,{children:`3`})]})]}),(0,n.jsxs)(`div`,{children:[(0,n.jsx)(i,{children:`.u-row .u-justify-between`}),(0,n.jsxs)(`div`,{className:`u-row u-justify-between u-bg-surface u-p-3`,style:{borderRadius:`var(--r-md)`},children:[(0,n.jsx)(a,{children:`A`}),(0,n.jsx)(a,{children:`B`}),(0,n.jsx)(a,{children:`C`})]})]}),(0,n.jsxs)(`div`,{children:[(0,n.jsx)(i,{children:`.u-grid-3 .u-gap-3`}),(0,n.jsx)(`div`,{className:`u-grid-3 u-gap-3`,children:[1,2,3,4,5,6].map(e=>(0,n.jsx)(a,{children:e},e))})]}),(0,n.jsxs)(`div`,{children:[(0,n.jsx)(i,{children:`.u-row + .u-flex-1 (middle grows)`}),(0,n.jsxs)(`div`,{className:`u-row u-gap-2`,children:[(0,n.jsx)(a,{children:`fixed`}),(0,n.jsx)(`div`,{className:`u-flex-1 u-bg-surface-2 u-border-soft u-p-2 u-text-dim`,style:{fontFamily:`var(--mono)`,fontSize:`var(--fs-3xs)`},children:`.u-flex-1`}),(0,n.jsx)(a,{children:`fixed`})]})]})]}),s.__docgenInfo={description:``,methods:[],displayName:`Spacing`},c.__docgenInfo={description:``,methods:[],displayName:`StackRowGrid`},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`() => <div className="u-stack u-gap-4">
    <Label>padding — .u-p-{"{step}"}</Label>
    <div className="u-row u-gap-3 u-items-end u-wrap">
      {SPACE_STEPS.map(s => <div key={s} className="u-stack u-gap-1 u-items-center">
          <div className={\`u-bg-accent u-p-\${s}\`} style={{
        borderRadius: "var(--r-sm)"
      }}>
            <div className="u-bg-ink" style={{
          width: 16,
          height: 16
        }} />
          </div>
          <div className="u-text-faint" style={{
        fontFamily: "var(--mono)",
        fontSize: "var(--fs-3xs)"
      }}>{s}</div>
        </div>)}
    </div>
  </div>`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`() => <div className="u-stack u-gap-6">
    <div>
      <Label>.u-stack (flex column + gap)</Label>
      <div className="u-stack u-gap-2">
        <Box>1</Box>
        <Box>2</Box>
        <Box>3</Box>
      </div>
    </div>

    <div>
      <Label>.u-row .u-justify-between</Label>
      <div className="u-row u-justify-between u-bg-surface u-p-3" style={{
      borderRadius: "var(--r-md)"
    }}>
        <Box>A</Box>
        <Box>B</Box>
        <Box>C</Box>
      </div>
    </div>

    <div>
      <Label>.u-grid-3 .u-gap-3</Label>
      <div className="u-grid-3 u-gap-3">
        {[1, 2, 3, 4, 5, 6].map(n => <Box key={n}>{n}</Box>)}
      </div>
    </div>

    <div>
      <Label>.u-row + .u-flex-1 (middle grows)</Label>
      <div className="u-row u-gap-2">
        <Box>fixed</Box>
        <div className="u-flex-1 u-bg-surface-2 u-border-soft u-p-2 u-text-dim" style={{
        fontFamily: "var(--mono)",
        fontSize: "var(--fs-3xs)"
      }}>
          .u-flex-1
        </div>
        <Box>fixed</Box>
      </div>
    </div>
  </div>`,...c.parameters?.docs?.source}}},l=[`Spacing`,`StackRowGrid`]}))();export{s as Spacing,c as StackRowGrid,l as __namedExportsOrder,r as default};