import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useDashboard } from './hooks/useDashboard';
import StatsCard from './partials/StatsCard';
import BranchPerformance from './partials/BranchPerformance';
import LeadSourceDistribution from './partials/LeadSourceDistribution';
import LeadsByCity from './partials/LeadsByCity';

export default function Dashboard({ stats }) {
    const { 
        summaryCards, 
        performanceData, 
        sourceData, 
        totalLeads,
        cityData
    } = useDashboard(stats);

    return (
        <AuthenticatedLayout>
            <Head title="Superadmin Dashboard" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                {/* Header Section */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Superadmin Dashboard
                    </h1>
                    <p className="text-sm font-medium text-gray-400">
                        Laporan performa cabang, pipeline CRM, dan statistik paket kursus real-time.
                    </p>
                </div>

                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {summaryCards.map((card, index) => (
                        <StatsCard key={index} {...card} />
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    <div className="flex flex-col">
                        <BranchPerformance performanceData={performanceData} />
                    </div>
                    <div className="flex flex-col">
                        <LeadSourceDistribution 
                            sourceData={sourceData} 
                            totalLeads={totalLeads} 
                        />
                    </div>
                </div>

                {/* Additional Analytics Section */}
                <div className="grid grid-cols-1 gap-8">
                    <LeadsByCity cityData={cityData} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
