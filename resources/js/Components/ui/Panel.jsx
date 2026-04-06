export default function Panel({ title, description, action, children }) {
    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-5 sm:p-6">
            {/* Header Section (Hanya dirender jika ada title/description/action) */}
            {(title || description || action) && (
                <div className="sm:flex sm:items-center sm:justify-between mb-6 border-b border-gray-100 pb-4">
                    <div className="sm:flex-auto">
                        {title && (
                            <h2 className="text-base font-semibold leading-6 text-gray-900">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="mt-1 text-sm text-gray-500">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Action Button Section */}
                    {action && (
                        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                            {action}
                        </div>
                    )}
                </div>
            )}

            {/* Content Section (Tempat DataTable atau form berada) */}
            <div className="flow-root">{children}</div>
        </div>
    );
}
