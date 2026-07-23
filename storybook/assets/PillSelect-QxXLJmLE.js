import{i as e}from"./preload-helper-xPQekRTU.js";import{t}from"./iframe-Dgn4eSi2.js";import{n,t as r}from"./cx-DHrSZD_0.js";function i({options:e,value:t,onValueChange:r,ariaLabel:i,className:o}){return(0,a.jsx)(`div`,{className:n(`pill-select`,o),role:`group`,"aria-label":i,children:e.map(e=>(0,a.jsxs)(`button`,{type:`button`,className:n(`pill`,e.value===t&&`on`),"aria-pressed":e.value===t,onClick:()=>r(e.value),children:[e.label,e.count!=null&&(0,a.jsx)(`span`,{className:`ct`,children:e.count})]},String(e.value)))})}var a,o=e((()=>{r(),a=t(),i.__docgenInfo={description:`A wrapping row of discrete selectable pills (single-select), each with an
optional trailing count — e.g. spell-level tabs "Lv 1 (3)". Unlike the
connected \`Segmented\` control, pills are separate, wrap to multiple rows, and
the active pill takes a brass outline.

@category Controls`,methods:[],displayName:`PillSelect`,props:{options:{required:!0,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{
  value: T;
  label: ReactNode;
  /** Optional trailing count, rendered as a dim "(n)". */
  count?: number;
}`,signature:{properties:[{key:`value`,value:{name:`T`,required:!0}},{key:`label`,value:{name:`ReactNode`,required:!0}},{key:`count`,value:{name:`number`,required:!1},description:`Optional trailing count, rendered as a dim "(n)".`}]}}],raw:`PillOption<T>[]`},description:``},value:{required:!0,tsType:{name:`T`},description:``},onValueChange:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(next: T) => void`,signature:{arguments:[{type:{name:`T`},name:`next`}],return:{name:`void`}}},description:``},ariaLabel:{required:!1,tsType:{name:`string`},description:`Group label for assistive tech.`},className:{required:!1,tsType:{name:`string`},description:``}}}}));export{o as n,i as t};