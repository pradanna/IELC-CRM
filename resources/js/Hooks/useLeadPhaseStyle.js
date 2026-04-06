import { 
    UserPlus, 
    Target,
    MessageSquare,
    ClipboardCheck,
    UserCheck,
    CreditCard,
    Snowflake,
    UserX,
    HelpCircle,
    CheckCircle 
} from 'lucide-react';

/**
 * Custom hook to manage lead phase styling and icons consistently.
 * 
 * @returns {object} { getPhaseStyle }
 */
export default function useLeadPhaseStyle() {
    const phaseMap = {
        'lead': {
            label: 'Lead',
            icon: UserPlus,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            fill: 'fill-emerald-500'
        },
        'prospect': {
            label: 'Prospect',
            icon: Target,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            fill: 'fill-blue-500'
        },
        'consultation': {
            label: 'Consultation',
            icon: MessageSquare,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            fill: 'fill-amber-500'
        },
        'placement-test': {
            label: 'Placement Test',
            icon: ClipboardCheck,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-100',
            fill: 'fill-purple-500'
        },
        'pre-enrollment': {
            label: 'Pre-Enrollment',
            icon: UserCheck,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-100',
            fill: 'fill-indigo-500'
        },
        'invoice': {
            label: 'Invoice',
            icon: CreditCard,
            color: 'text-cyan-600',
            bg: 'bg-cyan-50',
            border: 'border-cyan-100',
            fill: 'fill-cyan-500'
        },
        'cold-leads': {
            label: 'Cold Leads',
            icon: Snowflake,
            color: 'text-slate-500',
            bg: 'bg-slate-50',
            border: 'border-slate-200',
            fill: 'fill-slate-400'
        },
        'dropout-leads': {
            label: 'Dropout Leads',
            icon: UserX,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            border: 'border-rose-100',
            fill: 'fill-rose-500',
            status: 'lost'
        },
        'enrollment': {
            label: 'Enrollment',
            icon: CheckCircle,
            color: 'text-emerald-700',
            bg: 'bg-emerald-100',
            border: 'border-emerald-200',
            fill: 'fill-emerald-600',
            status: 'closed'
        },
    };

    const getPhaseStyle = (code) => {
        // Return matching style or fallback
        const style = phaseMap[code?.toLowerCase()];
        
        if (style) return style;

        return {
            label: code?.replace(/-/g, ' ') || 'Unknown',
            icon: HelpCircle,
            color: 'text-gray-600',
            bg: 'bg-gray-50',
            border: 'border-gray-100',
            fill: 'fill-gray-500'
        };
    };

    return {
        getPhaseStyle,
        phaseMap
    };
}
