import React, { useState, useEffect, useMemo } from 'react';
import { 
    Headphones, BookOpen, PenTool, Mic, FileText, Music, 
    ExternalLink, Upload, Download, CheckCircle2, AlertCircle, Maximize2, 
    Minimize2, ChevronDown, ChevronUp, Save, Eye, Sparkles
} from 'lucide-react';
import RichTextEditor from '@/Components/ui/RichTextEditor';

/**
 * Component for rendering IELTS Diagnostic / Academic Placement Test tasks:
 * - Listening (Audio player + Booklet PDF + 40 Input fields)
 * - Reading (Booklet Passage PDF + 40 Input fields)
 * - Writing (Task 1 & Task 2 prompts, Booklet PDF/chart, RichText essay box with live word count)
 * - Speaking (Guidance & consultation instructions)
 * - Review mode for consultants & teachers
 */
export default function IeltsDigitalAnswerSheet({
    task,
    answer,
    onAnswerChange,
    onFileSelect,
    isReview = false,
}) {
    const skill = task.skill_type || 'writing';
    const isObjectiveModule = skill === 'listening' || skill === 'reading';
    const isWritingModule = skill === 'writing';
    const isSpeakingModule = skill === 'speaking';

    // Parse existing answers: either string (essay), object (grid 1-40), or JSON string
    const parsedData = useMemo(() => {
        if (!answer) return { text: '', grid: {}, file: null, evaluation: null, bandScore: null };
        if (typeof answer === 'string') {
            try {
                const parsed = JSON.parse(answer);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.grid || parsed['1'])) {
                    return {
                        text: parsed.text || '',
                        grid: parsed.grid || parsed,
                        file: null,
                        evaluation: null,
                        bandScore: null,
                    };
                }
            } catch (e) {
                // Regular string / essay text
            }
            return { text: answer, grid: {}, file: null, evaluation: null, bandScore: null };
        }
        if (typeof answer === 'object') {
            if (answer instanceof File) {
                return { text: '', grid: {}, file: answer, evaluation: null, bandScore: null };
            }

            let nestedGrid = answer.grid || (answer['1'] !== undefined ? answer : {});
            let nestedText = answer.text || answer.essay_text || answer.answer_text || '';

            // If essay_text is a JSON string representing grid/composite
            if (typeof nestedText === 'string' && nestedText.startsWith('{') && (!nestedGrid || Object.keys(nestedGrid).length === 0)) {
                try {
                    const parsedJson = JSON.parse(nestedText);
                    if (parsedJson && (parsedJson.grid || parsedJson['1'])) {
                        nestedGrid = parsedJson.grid || parsedJson;
                        nestedText = parsedJson.text || '';
                    }
                } catch (e) {}
            }

            return {
                text: nestedText,
                grid: nestedGrid,
                file: answer.file || null,
                filePath: answer.file_path || null,
                evaluation: answer.evaluation || null,
                bandScore: answer.band_score || null,
                evaluatorNotes: answer.evaluator_notes || null,
            };
        }
        return { text: '', grid: {}, file: null, evaluation: null, bandScore: null };
    }, [answer]);

    const [gridAnswers, setGridAnswers] = useState(parsedData.grid || {});
    const [essayText, setEssayText] = useState(parsedData.text || '');
    const [isPdfExpanded, setIsPdfExpanded] = useState(false);
    const [activeSectionTab, setActiveSectionTab] = useState(1); // Section 1-4 (1-10, 11-20, 21-30, 31-40)

    // Sync from props
    useEffect(() => {
        if (parsedData.grid && Object.keys(parsedData.grid).length > 0) {
            setGridAnswers(parsedData.grid);
        }
        if (parsedData.text) {
            setEssayText(parsedData.text);
        }
    }, [parsedData]);

    // Handle single grid slot change (No. 1 - 40)
    const handleGridItemChange = (slotNumber, value) => {
        if (isReview) return;
        const updated = {
            ...gridAnswers,
            [slotNumber]: value,
        };
        setGridAnswers(updated);
        // Persist composite payload
        onAnswerChange(task.id, {
            grid: updated,
            text: essayText,
        });
    };

    // Handle Essay Text change
    const handleEssayChange = (value) => {
        if (isReview) return;
        setEssayText(value);
        onAnswerChange(task.id, {
            grid: gridAnswers,
            text: value,
        });
    };

    // Calculate Word Count for essays
    const wordCount = useMemo(() => {
        if (!essayText) return 0;
        const clean = essayText.replace(/<[^>]*>/g, ' ').trim();
        if (!clean) return 0;
        const words = clean.split(/\s+/).filter(w => w.length > 0);
        return words.length;
    }, [essayText]);

    // Count filled answer slots in grid (1 - 40)
    const filledGridCount = useMemo(() => {
        return Object.values(gridAnswers).filter(val => val && val.toString().trim() !== '').length;
    }, [gridAnswers]);

    const minWordsTarget = task.min_words || (skill === 'writing' && task.title?.includes('Task 1') ? 150 : 250);

    return (
        <div className="space-y-6">
            {/* 1. Header Banner & Task Description */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black shadow-sm ${
                            skill === 'listening' ? 'bg-sky-50 text-sky-600 border border-sky-200' :
                            skill === 'reading' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            skill === 'writing' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                            'bg-purple-50 text-purple-600 border border-purple-200'
                        }`}>
                            {skill === 'listening' && <Headphones size={22} />}
                            {skill === 'reading' && <BookOpen size={22} />}
                            {skill === 'writing' && <PenTool size={22} />}
                            {skill === 'speaking' && <Mic size={22} />}
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {skill.toUpperCase()} MODULE • {task.duration_minutes ? `${task.duration_minutes} MINS` : 'DIAGNOSTIC'}
                            </span>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                                {task.title}
                            </h2>
                        </div>
                    </div>

                    {/* Progress or Score Indicator */}
                    {isObjectiveModule && (
                        <div className="flex items-center gap-2.5">
                            {isReview && (parsedData.evaluation || parsedData.bandScore) && (
                                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-800">
                                    <span>Score:</span>
                                    <span className="text-emerald-700 font-black">
                                        {parsedData.evaluation ? `${parsedData.evaluation.raw_score} / ${parsedData.evaluation.total_questions} correct` : ''}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase">
                                        Band {parsedData.bandScore || parsedData.evaluation?.band_score}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-black">
                                <span className="text-slate-500">Answered:</span>
                                <span className={`font-black ${filledGridCount === 40 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                    {filledGridCount} / 40
                                </span>
                            </div>
                        </div>
                    )}

                    {isWritingModule && (
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-black">
                            <span className="text-slate-500">Word Count:</span>
                            <span className={`font-black ${wordCount >= minWordsTarget ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {wordCount} {minWordsTarget ? `/ ${minWordsTarget}` : 'words'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Rich Instructions */}
                {task.description && (
                    <div 
                        className="mt-4 text-xs text-slate-600 font-medium leading-relaxed prose prose-sm max-w-none prose-headings:font-bold prose-p:my-1.5 prose-ul:my-1.5"
                        dangerouslySetInnerHTML={{ __html: task.description }}
                    />
                )}
            </div>

            {/* 2. Audio Player Bar (Listening Only) */}
            {skill === 'listening' && task.audio_path && (
                <div className="bg-sky-500 text-white rounded-3xl p-5 shadow-lg shadow-sky-500/20">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <Music size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-wider">Listening Audio Track</h3>
                                <p className="text-[10px] text-sky-100 font-medium">Play the audio once while completing the answer sheet below</p>
                            </div>
                        </div>
                        <a 
                            href={task.audio_path} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all"
                        >
                            <span>Open Audio Separately</span>
                            <ExternalLink size={13} />
                        </a>
                    </div>
                    <audio 
                        controls 
                        preload="auto"
                        className="w-full h-10 rounded-xl"
                    >
                        <source src={task.audio_path} type="audio/mpeg" />
                        <source src={task.audio_path} />
                        Your browser does not support direct audio playback. Please click 'Open Audio Separately'.
                    </audio>
                </div>
            )}

            {/* 3. Main Workspace: Split-Screen for Objective (Listening & Reading) */}
            {isObjectiveModule && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Pane: Question Booklet PDF Viewer */}
                    <div className={`${isPdfExpanded ? 'lg:col-span-12' : 'lg:col-span-7'} transition-all duration-300 space-y-3`}>
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-rose-500" />
                                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                    Question Booklet PDF
                                </span>
                            </div>
                        <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPdfExpanded(!isPdfExpanded)}
                                    className="p-1.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 shadow-xs"
                                    title={isPdfExpanded ? "Close Full Screen" : "Full Screen PDF"}
                                >
                                    {isPdfExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                    <span>{isPdfExpanded ? 'Close Full Screen' : 'Full Screen PDF'}</span>
                                </button>
                                {task.question_pdf_path && (
                                    <a
                                        href={task.question_pdf_path}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1.5 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-all text-xs font-bold flex items-center gap-1 px-2.5"
                                    >
                                        <ExternalLink size={14} />
                                        <span className="hidden sm:inline">Open in New Tab</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Regular PDF Box */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-inner h-[680px] relative">
                            {task.question_pdf_path ? (
                                <iframe
                                    src={task.question_pdf_path}
                                    title="Question Booklet"
                                    className="w-full h-full border-0"
                                    allow="autoplay"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                                    <FileText size={48} className="text-slate-600 mb-3" />
                                    <p className="text-sm font-bold">No question document uploaded</p>
                                </div>
                            )}
                        </div>

                        {/* Fullscreen PDF Modal Overlay */}
                        {isPdfExpanded && task.question_pdf_path && (
                            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between pb-3 text-white">
                                    <div className="flex items-center gap-2 font-bold text-sm">
                                        <FileText size={18} className="text-rose-400" />
                                        <span>{task.title} - Question Booklet (Full Screen)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <a
                                            href={task.question_pdf_path}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                                        >
                                            <ExternalLink size={14} />
                                            <span>Open in Tab</span>
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => setIsPdfExpanded(false)}
                                            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                                        >
                                            <Minimize2 size={14} />
                                            <span>Exit Full Screen (ESC)</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
                                    <iframe
                                        src={task.question_pdf_path}
                                        title="Full Screen Question Booklet"
                                        className="w-full h-full border-0"
                                        allow="autoplay"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Pane: Interactive Digital Answer Sheet (1–40) */}
                    <div className={`${isPdfExpanded ? 'lg:col-span-12' : 'lg:col-span-5'} space-y-4`}>
                        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                        Digital Answer Sheet (1–40)
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        Type your answers directly into the numbered slots below
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                                    <CheckCircle2 size={12} /> Auto-Saved
                                </span>
                            </div>

                            {/* Section Quick Jump Tabs */}
                            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                                {[
                                    { sec: 1, range: '1 - 10' },
                                    { sec: 2, range: '11 - 20' },
                                    { sec: 3, range: '21 - 30' },
                                    { sec: 4, range: '31 - 40' },
                                ].map((item) => (
                                    <button
                                        key={item.sec}
                                        type="button"
                                        onClick={() => setActiveSectionTab(item.sec)}
                                        className={`py-2 px-1 text-[11px] font-black rounded-xl transition-all ${
                                            activeSectionTab === item.sec
                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Part {item.sec}
                                        <span className="block text-[9px] font-medium opacity-70">{item.range}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Numbered Input Cells Grid for the Active Section */}
                            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                                {Array.from({ length: 10 }, (_, i) => {
                                    const slotNum = (activeSectionTab - 1) * 10 + i + 1;
                                    const value = gridAnswers[slotNum] || '';
                                    const isFilled = value.toString().trim() !== '';
                                    const itemEval = parsedData.evaluation?.item_results?.[slotNum];
                                    const isCorrect = itemEval?.is_correct;

                                    return (
                                        <div 
                                            key={slotNum} 
                                            className={`flex flex-col gap-1.5 p-2 rounded-2xl border transition-all ${
                                                isReview && itemEval
                                                    ? (isCorrect 
                                                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/10' 
                                                        : (isFilled ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-500/10' : 'bg-slate-50/70 border-slate-200/80'))
                                                    : (isFilled 
                                                        ? 'bg-indigo-50/40 border-indigo-200 ring-1 ring-indigo-500/10' 
                                                        : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300')
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-black text-xs transition-colors ${
                                                    isReview && itemEval
                                                        ? (isCorrect ? 'bg-emerald-600 text-white shadow-xs' : (isFilled ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-500'))
                                                        : (isFilled ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-500')
                                                }`}>
                                                    {slotNum}
                                                </div>

                                                {isReview ? (
                                                    <div className="flex-1 flex items-center justify-between text-xs font-bold text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                                        <span>{value || <span className="text-slate-300 italic">(Blank)</span>}</span>
                                                        {itemEval && isFilled && (
                                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                                isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                            }`}>
                                                                {isCorrect ? 'Correct' : 'Incorrect'}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={value}
                                                        onChange={(e) => handleGridItemChange(slotNum, e.target.value)}
                                                        placeholder={`Answer for No. ${slotNum}`}
                                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                                                    />
                                                )}
                                            </div>

                                            {/* In Review Mode: Show Acceptable Answer Keys if incorrect */}
                                            {isReview && itemEval && !isCorrect && itemEval.acceptable_keys?.length > 0 && (
                                                <div className="pl-11 pr-2 text-[10px] text-slate-500 font-medium">
                                                    <span className="font-bold text-slate-700">Correct Key:</span> {itemEval.acceptable_keys.join(' / ')}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Alternative File Upload Option */}
                            <div className="pt-3 border-t border-slate-100">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                                    Or Upload Scanned/PDF Answer Sheet (Optional)
                                </label>
                                {isReview ? (
                                    parsedData.filePath && (
                                        <a
                                            href={parsedData.filePath}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                                        >
                                            <FileText size={14} /> View Uploaded File
                                        </a>
                                    )
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={(e) => onFileSelect(task.id, e.target.files[0])}
                                        />
                                        <div className="border border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl p-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 transition-all cursor-pointer">
                                            <Upload size={14} className="text-slate-400" />
                                            <span className="truncate">
                                                {answer instanceof File ? answer.name : 'Upload File / Photo of Answer Sheet'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Main Workspace: Writing Modules (Task 1 & Task 2) */}
            {isWritingModule && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Pane: Question Booklet / Prompt Chart */}
                    <div className="lg:col-span-5 space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                <FileText size={16} className="text-amber-500" />
                                Question Booklet & Prompt
                            </span>
                            <div className="flex items-center gap-2">
                                {task.question_pdf_path && (
                                    <button
                                        type="button"
                                        onClick={() => setIsPdfExpanded(!isPdfExpanded)}
                                        className="p-1 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center gap-1 px-2.5 py-1"
                                        title={isPdfExpanded ? "Close Full Screen" : "Full Screen Prompt"}
                                    >
                                        <Maximize2 size={13} />
                                        <span>Full Screen</span>
                                    </button>
                                )}
                                {task.question_pdf_path && (
                                    <a
                                        href={task.question_pdf_path}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 rounded-xl text-indigo-600 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1"
                                    >
                                        <ExternalLink size={13} /> New Tab
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-inner h-[580px] relative">
                            {task.question_pdf_path ? (
                                <iframe
                                    src={task.question_pdf_path}
                                    title="Writing Task Booklet"
                                    className="w-full h-full border-0"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                                    <PenTool size={48} className="text-slate-600 mb-3" />
                                    <p className="text-sm font-bold">Instructions are displayed at the top of the page</p>
                                </div>
                            )}
                        </div>

                        {/* Fullscreen Writing Prompt Modal Overlay */}
                        {isPdfExpanded && task.question_pdf_path && (
                            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between pb-3 text-white">
                                    <div className="flex items-center gap-2 font-bold text-sm">
                                        <FileText size={18} className="text-amber-400" />
                                        <span>{task.title} - Prompt (Full Screen)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <a
                                            href={task.question_pdf_path}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                                        >
                                            <ExternalLink size={14} />
                                            <span>Open in Tab</span>
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => setIsPdfExpanded(false)}
                                            className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/30 transition-all active:scale-95"
                                        >
                                            <Minimize2 size={14} />
                                            <span>Exit Full Screen (ESC)</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
                                    <iframe
                                        src={task.question_pdf_path}
                                        title="Full Screen Writing Prompt Booklet"
                                        className="w-full h-full border-0"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Pane: Live Online Essay Editor */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                        Type Your Essay / Response
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        Minimum {minWordsTarget} words • Formal academic style
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isReview && (
                                        <button
                                            type="button"
                                            onClick={() => window.print()}
                                            className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                                        >
                                            <Download size={13} />
                                            <span>Print / Save</span>
                                        </button>
                                    )}
                                    <span className={`px-3 py-1 rounded-xl text-xs font-black border ${
                                        wordCount >= minWordsTarget 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {wordCount} / {minWordsTarget} words
                                    </span>
                                </div>
                            </div>

                            {isReview ? (
                                <div 
                                    className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm text-slate-800 leading-relaxed font-medium prose prose-sm max-w-none min-h-[300px]"
                                    dangerouslySetInnerHTML={{ __html: essayText || "(No response text entered)" }}
                                />
                            ) : (
                                <RichTextEditor
                                    value={essayText}
                                    onChange={handleEssayChange}
                                    placeholder="Start typing your IELTS essay response here..."
                                    minHeight="350px"
                                />
                            )}

                            {/* File Upload Option */}
                            <div className="pt-3 border-t border-slate-100">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                                    Or Upload Word/PDF Document (Optional)
                                </label>
                                {isReview ? (
                                    parsedData.filePath && (
                                        <a
                                            href={parsedData.filePath}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                                        >
                                            <FileText size={14} /> Download Response File
                                        </a>
                                    )
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={(e) => onFileSelect(task.id, e.target.files[0])}
                                        />
                                        <div className="border border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl p-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 transition-all cursor-pointer">
                                            <Upload size={14} className="text-slate-400" />
                                            <span className="truncate">
                                                {answer instanceof File ? answer.name : 'Upload Supplementary File (DOCX/PDF)'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Speaking Guidance Module */}
            {isSpeakingModule && (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm max-w-2xl mx-auto">
                    <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto shadow-sm">
                        <Mic size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        Speaking Interview with IELC Certified Examiner
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        The IELTS Speaking test is 11–14 minutes long and will be conducted live online with one of our certified examiners during your scheduled consultation appointment.
                    </p>
                    <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs font-bold text-purple-900">
                        No written submission is required for the Speaking section on this page.
                    </div>
                </div>
            )}
        </div>
    );
}
