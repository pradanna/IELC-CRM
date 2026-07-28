/**
 * Custom hook to manage branch badge colors consistently across CRM views.
 * 
 * @returns {object} { getBranchStyle }
 */
export default function useBranchStyle() {
    const predefinedBranches = {
        'solo': {
            bg: 'bg-indigo-50/80',
            text: 'text-indigo-700',
            border: 'border-indigo-200',
            icon: 'text-indigo-500',
            dot: 'bg-indigo-500',
            badge: 'bg-indigo-100 text-indigo-800'
        },
        'semarang': {
            bg: 'bg-emerald-50/80',
            text: 'text-emerald-700',
            border: 'border-emerald-200',
            icon: 'text-emerald-500',
            dot: 'bg-emerald-500',
            badge: 'bg-emerald-100 text-emerald-800'
        },
        'yogyakarta': {
            bg: 'bg-purple-50/80',
            text: 'text-purple-700',
            border: 'border-purple-200',
            icon: 'text-purple-500',
            dot: 'bg-purple-500',
            badge: 'bg-purple-100 text-purple-800'
        },
        'jogja': {
            bg: 'bg-purple-50/80',
            text: 'text-purple-700',
            border: 'border-purple-200',
            icon: 'text-purple-500',
            dot: 'bg-purple-500',
            badge: 'bg-purple-100 text-purple-800'
        },
        'surabaya': {
            bg: 'bg-amber-50/80',
            text: 'text-amber-700',
            border: 'border-amber-200',
            icon: 'text-amber-500',
            dot: 'bg-amber-500',
            badge: 'bg-amber-100 text-amber-800'
        },
        'jakarta': {
            bg: 'bg-sky-50/80',
            text: 'text-sky-700',
            border: 'border-sky-200',
            icon: 'text-sky-500',
            dot: 'bg-sky-500',
            badge: 'bg-sky-100 text-sky-800'
        },
    };

    const fallbackPalette = [
        { bg: 'bg-rose-50/80', text: 'text-rose-700', border: 'border-rose-200', icon: 'text-rose-500', dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-800' },
        { bg: 'bg-teal-50/80', text: 'text-teal-700', border: 'border-teal-200', icon: 'text-teal-500', dot: 'bg-teal-500', badge: 'bg-teal-100 text-teal-800' },
        { bg: 'bg-cyan-50/80', text: 'text-cyan-700', border: 'border-cyan-200', icon: 'text-cyan-500', dot: 'bg-cyan-500', badge: 'bg-cyan-100 text-cyan-800' },
        { bg: 'bg-violet-50/80', text: 'text-violet-700', border: 'border-violet-200', icon: 'text-violet-500', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-800' },
        { bg: 'bg-fuchsia-50/80', text: 'text-fuchsia-700', border: 'border-fuchsia-200', icon: 'text-fuchsia-500', dot: 'bg-fuchsia-500', badge: 'bg-fuchsia-100 text-fuchsia-800' },
    ];

    const getBranchStyle = (branchName) => {
        if (!branchName || branchName.toLowerCase() === 'unassigned') {
            return {
                bg: 'bg-slate-100',
                text: 'text-slate-600',
                border: 'border-slate-200',
                icon: 'text-slate-400',
                dot: 'bg-slate-400',
                badge: 'bg-slate-200 text-slate-700'
            };
        }

        const nameLower = branchName.toLowerCase().trim();
        for (const [key, style] of Object.entries(predefinedBranches)) {
            if (nameLower.includes(key)) {
                return style;
            }
        }

        let hash = 0;
        for (let i = 0; i < nameLower.length; i++) {
            hash = nameLower.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % fallbackPalette.length;
        return fallbackPalette[index];
    };

    return { getBranchStyle };
}
