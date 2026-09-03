import React, { useRef, useEffect } from 'react';
import { 
    Bold, Italic, Underline, List, ListOrdered, AlignLeft, 
    AlignCenter, AlignRight, Heading1, Heading2, Heading3, Quote, Code, Undo, Redo 
} from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder = 'Tulis instruksi lengkap di sini...', minHeight = '180px' }) {
    const editorRef = useRef(null);

    // Sync external value to contentEditable when value changes externally
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const exec = (command, val = null) => {
        document.execCommand(command, false, val);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    return (
        <div className="w-full border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-slate-50/80 border-b border-slate-200/80 flex-wrap">
                <button
                    type="button"
                    onClick={() => exec('bold')}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all"
                    title="Tebal (Bold)"
                >
                    <Bold size={15} />
                </button>
                <button
                    type="button"
                    onClick={() => exec('italic')}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all"
                    title="Miring (Italic)"
                >
                    <Italic size={15} />
                </button>
                <button
                    type="button"
                    onClick={() => exec('underline')}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all"
                    title="Garis Bawah (Underline)"
                >
                    <Underline size={15} />
                </button>

                <div className="w-px h-4 bg-slate-300 mx-1" />

                <button
                    type="button"
                    onClick={() => exec('formatBlock', '<h3>')}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all font-bold text-xs"
                    title="Heading"
                >
                    H3
                </button>
                <button
                    type="button"
                    onClick={() => exec('formatBlock', '<p>')}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all font-bold text-xs"
                    title="Paragraph Biasa"
                >
                    P
                </button>

                <div className="w-px h-4 bg-slate-300 mx-1" />

                <button
                    type="button"
                    onClick={() => exec('insertUnorderedList')}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all"
                    title="Bullet List"
                >
                    <List size={15} />
                </button>
                <button
                    type="button"
                    onClick={() => exec('insertOrderedList')}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all"
                    title="Numbered List"
                >
                    <ListOrdered size={15} />
                </button>
                <button
                    type="button"
                    onClick={() => exec('formatBlock', '<blockquote>')}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all"
                    title="Kutipan (Quote)"
                >
                    <Quote size={15} />
                </button>

                <div className="w-px h-4 bg-slate-300 mx-1" />

                <button
                    type="button"
                    onClick={() => exec('justifyLeft')}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all"
                    title="Rata Kiri"
                >
                    <AlignLeft size={15} />
                </button>
                <button
                    type="button"
                    onClick={() => exec('justifyCenter')}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all"
                    title="Rata Tengah"
                >
                    <AlignCenter size={15} />
                </button>
                <button
                    type="button"
                    onClick={() => exec('justifyRight')}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white hover:shadow-xs transition-all"
                    title="Rata Kanan"
                >
                    <AlignRight size={15} />
                </button>

                <div className="w-px h-4 bg-slate-300 mx-1" />

                <button
                    type="button"
                    onClick={() => exec('undo')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white hover:shadow-xs transition-all"
                    title="Undo"
                >
                    <Undo size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => exec('redo')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white hover:shadow-xs transition-all"
                    title="Redo"
                >
                    <Redo size={14} />
                </button>
            </div>

            {/* Editable Content */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="p-4 outline-none text-sm text-slate-800 leading-relaxed prose prose-sm max-w-none focus:outline-none custom-editor-content"
                style={{ minHeight }}
                data-placeholder={placeholder}
            />

            <style dangerouslySetInnerHTML={{ __html: `
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
            `}} />
        </div>
    );
}
