import React, { useState } from 'react';

const Tabs = ({ tabs }) => {
    const [activeTab, setActiveTab] = useState(tabs[0].name);

    const activeContent = tabs.find(tab => tab.name === activeTab)?.content;

    return (
        <div>
            <div className="sm:hidden">
                <label htmlFor="tabs" className="sr-only">Select a tab</label>
                <select
                    id="tabs"
                    name="tabs"
                    className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    onChange={(e) => setActiveTab(e.target.value)}
                    value={activeTab}
                >
                    {tabs.map((tab) => (
                        <option key={tab.name} value={tab.name}>{tab.name}</option>
                    ))}
                </select>
            </div>
            <div className="hidden sm:block">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`${
                                    tab.name === activeTab
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            <div className="pt-4">
                {activeContent}
            </div>
        </div>
    );
};

export default Tabs;
