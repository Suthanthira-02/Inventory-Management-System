function PageHeader({
    title,
    description,
    action,
}) {
    return (
        <header className="border-b border-slate-200 bg-white shadow-sm">
            <div
                className="
                    flex
                    min-h-20
                    items-center
                    justify-between
                    gap-4
                    px-6
                    py-4
                    lg:px-10
                "
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {title}
                    </h1>

                    {description && (
                        <p className="mt-1 text-sm text-slate-500">
                            {description}
                        </p>
                    )}
                </div>

                {action && (
                    <div className="shrink-0">
                        {action}
                    </div>
                )}
            </div>
        </header>
    );
}

export default PageHeader;