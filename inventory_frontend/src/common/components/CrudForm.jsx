function CrudForm({
    title,
    description,
    error = "",
    loading = false,
    onSubmit,
    onCancel,
    submitText = "Save",
    children,
}) {
    return (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                    {title}
                </h2>

                {description && (
                    <p className="mt-1 text-sm text-slate-500">
                        {description}
                    </p>
                )}
            </div>

            {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <form
                onSubmit={onSubmit}
                className="space-y-5"
            >
                {children}

                <div className="flex gap-3 pt-2">

                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            rounded-xl
                            bg-blue-700
                            px-6
                            py-3
                            text-sm
                            font-bold
                            text-white
                            hover:bg-blue-800
                            disabled:cursor-not-allowed
                            disabled:bg-blue-400
                        "
                    >
                        {loading ? "Saving..." : submitText}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            px-6
                            py-3
                            text-sm
                            font-semibold
                            text-slate-700
                            hover:bg-slate-50
                        "
                    >
                        Cancel
                    </button>

                </div>
            </form>
        </div>
    );
}

export default CrudForm;