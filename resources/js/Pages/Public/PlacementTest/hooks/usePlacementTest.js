import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "@inertiajs/react";

export function usePlacementTest({ session, pages, isReview, userAnswers }) {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const mainRef = useRef(null);
    const [timeLeft, setTimeLeft] = useState(
        Math.floor(session.remaining_seconds || 0)
    );

    const storageKey = `pt_answers_${session.token}`;
    const initialAnswers =
        typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem(storageKey) || "{}")
            : {};

    const { data, setData, post, processing } = useForm({
        answers: isReview ? userAnswers : initialAnswers,
        summary_file: null,
    });

    // Scroll to top when page changes
    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTop = 0;
        }
    }, [currentPageIndex]);

    // Timer Logic
    useEffect(() => {
        if (isReview) return;
        if (timeLeft <= 0) {
            if (!processing) {
                handleFinish();
            }
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, processing, isReview]);

    const formatTime = (seconds) => {
        const safeSeconds = Math.max(0, Math.floor(seconds));
        const h = Math.floor(safeSeconds / 3600);
        const m = Math.floor((safeSeconds % 3600) / 60);
        const s = safeSeconds % 60;
        if (h > 0)
            return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const questionMap = useMemo(() => {
        const map = [];
        pages.forEach((page, pIdx) => {
            page.questions.forEach((q) => {
                map.push({ number: q.number, id: q.id, pageIndex: pIdx });
            });
        });
        return map;
    }, [pages]);

    const handleOptionSelect = (questionId, optionId) => {
        if (isReview) return;
        const newAnswers = { ...data.answers, [questionId]: optionId };
        setData("answers", newAnswers);
        if (typeof window !== "undefined") {
            // Only store text/id based answers, not files in local storage
            const serializable = Object.fromEntries(
                Object.entries(newAnswers).filter(([_, v]) => !(v instanceof File))
            );
            localStorage.setItem(storageKey, JSON.stringify(serializable));
        }
    };

    const handleTextChange = (questionId, text) => {
        if (isReview) return;
        const newAnswers = { ...data.answers, [questionId]: text };
        setData("answers", newAnswers);
        if (typeof window !== "undefined") {
            localStorage.setItem(storageKey, JSON.stringify(newAnswers));
        }
    };

    const handleFileSelect = (questionId, file) => {
        if (isReview) return;
        setData("answers", { ...data.answers, [questionId]: file });
        // Files are not stored in localStorage
    };

    const handleFinish = () => {
        post(route("public.placement-test.submit", { token: session.token }), {
            onSuccess: () => {
                if (typeof window !== "undefined") {
                    localStorage.removeItem(storageKey);
                }
            },
        });
    };

    const confirmFinish = () => {
        if (confirm("Are you sure you want to finish and submit your answers?")) {
            handleFinish();
        }
    };

    const getTimerColorClass = () => {
        if (isReview) return "bg-blue-50 text-blue-700 border-blue-200";
        if (timeLeft <= 300)
            return "bg-red-50 text-red-700 border-red-200 animate-pulse";
        if (timeLeft <= 600)
            return "bg-amber-50 text-amber-700 border-amber-200";
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    };

    return {
        currentPageIndex,
        setCurrentPageIndex,
        mainRef,
        timeLeft,
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
    };
}
