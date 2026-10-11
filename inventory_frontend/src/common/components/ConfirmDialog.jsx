function ConfirmDialog({
    open,
    title = "Confirm Action",
    message = "Are you sure you want to continue?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    loading = false,
    error = "",
}) {

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                {/* TITLE */}

                <h2 className="text-xl font-bold text-slate-800">
                    {title}
                </h2>


                {/* MESSAGE */}

                <p className="mt-2 text-sm leading-6 text-slate-500">
                    {message}
                </p>


                {/* ERROR */}

                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">

                        <p className="text-sm font-medium text-red-700">
                            {error}
                        </p>

                    </div>
                )}


                {/* BUTTONS */}

                <div className="mt-6 flex justify-end gap-3">

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="
                            rounded-xl
                            border
                            border-slate-300
                            px-5
                            py-2.5
                            text-sm
                            font-semibold
                            text-slate-700
                            transition
                            hover:bg-slate-50
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        {cancelText}
                    </button>


                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="
                            rounded-xl
                            bg-red-600
                            px-5
                            py-2.5
                            text-sm
                            font-bold
                            text-white
                            transition
                            hover:bg-red-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        {loading
                            ? `${confirmText}...`
                            : confirmText
                        }
                    </button>

                </div>

            </div>

        </div>
    );
}

export default ConfirmDialog;