import{j as t}from"./app-CN0qWgdP.js";import{r as n}from"./vendor-react-DKx4dq_U.js";import{b3 as h,b4 as x,b5 as u,b6 as b,b7 as g,b8 as m,b9 as p,ba as v,bb as f,bc as w,bd as j}from"./vendor-icons-BEtvqMt1.js";function C({value:s,onChange:i,placeholder:r="Tulis instruksi lengkap di sini...",minHeight:l="180px"}){const o=n.useRef(null);n.useEffect(()=>{o.current&&o.current.innerHTML!==(s||"")&&(o.current.innerHTML=s||"")},[s]);const e=(d,c=null)=>{document.execCommand(d,!1,c),o.current&&(i(o.current.innerHTML),o.current.focus())},a=()=>{o.current&&i(o.current.innerHTML)};return t.jsxs("div",{className:"w-full border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all",children:[t.jsxs("div",{className:"flex items-center gap-1 p-2 bg-slate-50/80 border-b border-slate-200/80 flex-wrap",children:[t.jsx("button",{type:"button",onClick:()=>e("bold"),className:"p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all",title:"Tebal (Bold)",children:t.jsx(h,{size:15})}),t.jsx("button",{type:"button",onClick:()=>e("italic"),className:"p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all",title:"Miring (Italic)",children:t.jsx(x,{size:15})}),t.jsx("button",{type:"button",onClick:()=>e("underline"),className:"p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all",title:"Garis Bawah (Underline)",children:t.jsx(u,{size:15})}),t.jsx("div",{className:"w-px h-4 bg-slate-300 mx-1"}),t.jsx("button",{type:"button",onClick:()=>e("formatBlock","<h3>"),className:"p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all font-bold text-xs",title:"Heading",children:"H3"}),t.jsx("button",{type:"button",onClick:()=>e("formatBlock","<p>"),className:"p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all font-bold text-xs",title:"Paragraph Biasa",children:"P"}),t.jsx("div",{className:"w-px h-4 bg-slate-300 mx-1"}),t.jsx("button",{type:"button",onClick:()=>e("insertUnorderedList"),className:"p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all",title:"Bullet List",children:t.jsx(b,{size:15})}),t.jsx("button",{type:"button",onClick:()=>e("insertOrderedList"),className:"p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all",title:"Numbered List",children:t.jsx(g,{size:15})}),t.jsx("button",{type:"button",onClick:()=>e("formatBlock","<blockquote>"),className:"p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all",title:"Kutipan (Quote)",children:t.jsx(m,{size:15})}),t.jsx("div",{className:"w-px h-4 bg-slate-300 mx-1"}),t.jsx("button",{type:"button",onClick:()=>e("justifyLeft"),className:"p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all",title:"Rata Kiri",children:t.jsx(p,{size:15})}),t.jsx("button",{type:"button",onClick:()=>e("justifyCenter"),className:"p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all",title:"Rata Tengah",children:t.jsx(v,{size:15})}),t.jsx("button",{type:"button",onClick:()=>e("justifyRight"),className:"p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all",title:"Rata Kanan",children:t.jsx(f,{size:15})}),t.jsx("div",{className:"w-px h-4 bg-slate-300 mx-1"}),t.jsx("button",{type:"button",onClick:()=>e("undo"),className:"p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white hover:shadow-xs transition-all",title:"Undo",children:t.jsx(w,{size:14})}),t.jsx("button",{type:"button",onClick:()=>e("redo"),className:"p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white hover:shadow-xs transition-all",title:"Redo",children:t.jsx(j,{size:14})})]}),t.jsx("div",{ref:o,contentEditable:!0,onInput:a,className:"p-4 outline-none text-sm text-slate-800 leading-relaxed prose prose-sm max-w-none focus:outline-none custom-editor-content",style:{minHeight:l},"data-placeholder":r}),t.jsx("style",{dangerouslySetInnerHTML:{__html:`
                .custom-editor-content:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                    cursor: text;
                }
                .custom-editor-content ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                .custom-editor-content ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                .custom-editor-content blockquote {
                    border-left: 3px solid #6366f1;
                    padding-left: 0.75rem;
                    color: #475569;
                    font-style: italic;
                    margin: 0.5rem 0;
                }
                .custom-editor-content h3 {
                    font-size: 1.1rem;
                    font-weight: 800;
                    margin: 0.5rem 0;
                    color: #0f172a;
                }
            `}})]})}export{C as R};
