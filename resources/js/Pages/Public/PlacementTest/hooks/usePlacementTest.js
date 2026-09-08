import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "@inertiajs/react";

export function usePlacementTest({ session, pages, isReview, userAnswers, examCategory = 'General' }) {
    const isIelts = examCategory === 'IELTS';
    const sessionToken = session?.session_token || session?.token || 'preview_token';
    const storageKey = `pt_answers_${sessionToken}`;
    const sectionTimersKey = `pt_section_timers_${sessionToken}`;
    const mainRef = useRef(null);

    // Initial page index (can restore from previous active section if saved)
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [saveStatus, setSaveStatus] = useState('saved'); // 'saving' | 'saved'
    const [sectionExpiryNotice, setSectionExpiryNotice] = useState(null); // notification string when section expires

    // Global total time left fallback (for non-IELTS exams)
    const [globalTimeLeft, setGlobalTimeLeft] = useState(
        Math.floor(session.remaining_seconds || 0)
    );

    // Initial answers from localStorage or props
    const initialAnswers = useMemo(() => {
        if (typeof window !== "undefined" && !isReview) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) return JSON.parse(saved);
            } catch (e) {}
        }
        return userAnswers || {};
    }, [storageKey, isReview]);

    const { data, setData, post, processing } = useForm({
        answers: isReview ? userAnswers : initialAnswers,
        summary_file: null,
    });

    // -------------------------------------------------------------
    // Section-Based Timers Logic (for IELTS)
    // -------------------------------------------------------------
    // Initialize or restore section timers state:
    // { [pageIndex]: { timeLeft: number, duration: number, isLocked: boolean } }
    const [sectionTimers, setSectionTimers] = useState(() => {
        if (typeof window === "undefined" || !isIelts || isReview) return {};
        try {
            const savedTimers = localStorage.getItem(sectionTimersKey);
            if (savedTimers) return JSON.parse(savedTimers);
        } catch (e) {}

        const initial = {};
        (pages || []).forEach((page, pIdx) => {
            const task = page?.questions?.[0] || {};
            // Default durations if not specified: Listening=30, Reading=60, Task1=20, Task2=40, Speaking=15
            const defaultMins = task.skill_type === 'listening' ? 30 :
                                task.skill_type === 'reading' ? 60 :
                                (task.title?.includes('Task 1') ? 20 : 40);
            const durationMins = parseInt(task.duration_minutes) || defaultMins;
            const durationSecs = durationMins * 60;

            initial[pIdx] = {
                timeLeft: durationSecs,
                totalDuration: durationSecs,
                isLocked: false,
                skillType: task.skill_type || 'task',
                title: task.title || `Section ${pIdx + 1}`,
            };
        });
        return initial;
    });

    // Ensure sectionTimers state has entry for all pages if pages prop arrives later
    useEffect(() => {
        if (!isIelts || isReview || !pages || pages.length === 0) return;
        setSectionTimers(prev => {
            let changed = false;
            const updated = { ...prev };
            pages.forEach((page, pIdx) => {
                if (!updated[pIdx]) {
                    changed = true;
                    const task = page?.questions?.[0] || {};
                    const defaultMins = task.skill_type === 'listening' ? 30 :
                                        task.skill_type === 'reading' ? 60 :
                                        (task.title?.includes('Task 1') ? 20 : 40);
                    const durationMins = parseInt(task.duration_minutes) || defaultMins;
                    const durationSecs = durationMins * 60;
                    updated[pIdx] = {
                        timeLeft: durationSecs,
                        totalDuration: durationSecs,
                        isLocked: false,
                        skillType: task.skill_type || 'task',
                        title: task.title || `Section ${pIdx + 1}`,
                    };
                }
            });
            return changed ? updated : prev;
        });
    }, [pages, isIelts, isReview]);

    // Persist sectionTimers changes to localStorage
    useEffect(() => {
        if (typeof window !== "undefined" && isIelts && !isReview && Object.keys(sectionTimers).length > 0) {
            try {
                localStorage.setItem(sectionTimersKey, JSON.stringify(sectionTimers));
            } catch (e) {}
        }
    }, [sectionTimers, isIelts, isReview, sectionTimersKey]);

    // Active Section Timer countdown (for IELTS)
    useEffect(() => {
        if (!isIelts || isReview || processing) return;

        const currentTimer = sectionTimers[currentPageIndex];
        if (!currentTimer) return;

        // Skip timer countdown if this section is speaking (live interview with teacher)
        if (currentTimer.skillType === 'speaking') return;

        if (currentTimer.timeLeft <= 0) {
            if (!currentTimer.isLocked) {
                // Lock this section and auto-advance to the next section
                setSectionTimers(prev => ({
                    ...prev,
                    [currentPageIndex]: {
                        ...prev[currentPageIndex],
                        isLocked: true,
                        timeLeft: 0,
                    }
                }));

                const nextPageIndex = currentPageIndex + 1;
                const nextTimer = sectionTimers[nextPageIndex];
                const sectionName = currentTimer.title || 'Sesi ini';

                if (nextPageIndex < (pages?.length || 0)) {
                    setSectionExpiryNotice(`Waktu untuk "${sectionName}" telah habis. Otomatis beralih ke sesi berikutnya.`);
                    setCurrentPageIndex(nextPageIndex);
                    // auto dismiss notice after 6 seconds
                    setTimeout(() => setSectionExpiryNotice(null), 6000);
                } else {
                    // All sections finished!
                    setSectionExpiryNotice(`Waktu seluruh sesi ujian telah selesai.`);
                    handleFinish();
                }
            }
            return;
        }

        const interval = setInterval(() => {
            setSectionTimers(prev => {
                const item = prev[currentPageIndex];
                if (!item || item.timeLeft <= 0 || item.isLocked) return prev;
                return {
                    ...prev,
                    [currentPageIndex]: {
                        ...item,
                        timeLeft: item.timeLeft - 1,
                    }
                };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isIelts, isReview, currentPageIndex, sectionTimers, processing, pages]);

    // Standard Global Timer countdown (for General and Kids exams)
    useEffect(() => {
        if (isIelts || isReview) return;
        if (globalTimeLeft <= 0) {
            if (!processing) {
                handleFinish();
            }
            return;
        }
        const timer = setInterval(() => {
            setGlobalTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [globalTimeLeft, processing, isReview, isIelts]);

    // Scroll to top when page changes
    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTop = 0;
        }
    }, [currentPageIndex]);

    const formatTime = (seconds) => {
        const safeSeconds = Math.max(0, Math.floor(seconds || 0));
        const h = Math.floor(safeSeconds / 3600);
        const m = Math.floor((safeSeconds % 3600) / 60);
        const s = safeSeconds % 60;
        if (h > 0)
            return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // Current active timer details
    const activeSectionTimer = sectionTimers[currentPageIndex];
    const currentTimeLeft = isIelts 
        ? (activeSectionTimer?.timeLeft ?? 0) 
        : globalTimeLeft;
    const isCurrentSectionLocked = isIelts && (activeSectionTimer?.isLocked || (activeSectionTimer?.timeLeft <= 0 && activeSectionTimer?.skillType !== 'speaking'));

    const questionMap = useMemo(() => {
        const map = [];
        (pages || []).forEach((page, pIdx) => {
            (page?.questions || []).forEach((q) => {
                if (q) {
                    map.push({ 
                        number: q.number, 
                        id: q.id, 
                        pageIndex: pIdx,
                        isLocked: isIelts ? (sectionTimers[pIdx]?.isLocked || false) : false
                    });
                }
            });
        });
        return map;
    }, [pages, isIelts, sectionTimers]);

    const saveToLocalStorage = (newAnswers) => {
        if (typeof window !== "undefined" && !isReview) {
            try {
                setSaveStatus('saving');
                const serializable = Object.fromEntries(
                    Object.entries(newAnswers).filter(([_, v]) => !(v instanceof File))
                );
                localStorage.setItem(storageKey, JSON.stringify(serializable));
                setTimeout(() => setSaveStatus('saved'), 400);
            } catch (e) {
                console.error("Local storage save error", e);
            }
        }
    };

    const handleOptionSelect = (questionId, optionId) => {
        if (isReview || isCurrentSectionLocked) return;
        const newAnswers = { ...data.answers, [questionId]: optionId };
        setData("answers", newAnswers);
        saveToLocalStorage(newAnswers);
    };

    const handleTextChange = (questionId, text) => {
        if (isReview || isCurrentSectionLocked) return;
        const newAnswers = { ...data.answers, [questionId]: text };
        setData("answers", newAnswers);
        saveToLocalStorage(newAnswers);
    };

    const handleFileSelect = (questionId, file) => {
        if (isReview || isCurrentSectionLocked) return;
        const newAnswers = { ...data.answers, [questionId]: file };
        setData("answers", newAnswers);
    };

    const handleFinish = () => {
        post(route("public.placement-test.submit", { token: sessionToken }), {
            onSuccess: () => {
                if (typeof window !== "undefined") {
                    localStorage.removeItem(storageKey);
                    localStorage.removeItem(sectionTimersKey);
                }
            },
        });
    };

    const confirmFinish = () => {
        if (confirm("Are you sure you want to finish and submit all your answers?")) {
            handleFinish();
        }
    };

    const getTimerColorClass = () => {
        if (isReview) return "bg-blue-50 text-blue-700 border-blue-200";
        if (activeSectionTimer?.skillType === 'speaking') return "bg-purple-50 text-purple-700 border-purple-200";
        if (currentTimeLeft <= 60)
            return "bg-rose-50 text-rose-700 border-rose-300 animate-pulse ring-2 ring-rose-500/20";
        if (currentTimeLeft <= 300)
            return "bg-amber-50 text-amber-700 border-amber-300";
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    };

    // Safe section navigation (prevents navigating back to locked expired sections in IELTS)
    const canNavigateToPage = (targetPageIndex) => {
        if (isReview || !isIelts) return true;
        const targetTimer = sectionTimers[targetPageIndex];
        if (targetTimer?.isLocked && targetPageIndex < currentPageIndex) {
            return false; // Cannot go back to locked previous sections
        }
        return true;
    };

    const navigateToPage = (targetPageIndex) => {
        if (!canNavigateToPage(targetPageIndex)) {
            alert("Sesi tersebut sudah berakhir dan terkunci. Anda tidak dapat mengubah jawaban sesi yang sudah lewat.");
            return;
        }
        setCurrentPageIndex(targetPageIndex);
    };

    return {
        currentPageIndex,
        setCurrentPageIndex: navigateToPage,
        mainRef,
        timeLeft: currentTimeLeft,
        activeSectionTimer,
        isSectionTimer: isIelts,
        isCurrentSectionLocked,
        sectionExpiryNotice,
        setSectionExpiryNotice,
        formatTime,
        questionMap,
        handleOptionSelect,
        handleTextChange,
        handleFileSelect,
        confirmFinish,
        getTimerColorClass,
        answers: data.answers,
        summaryFile: data.summary_file,
        setData,
        processing,
        saveStatus,
    };
}