function DataTable({
    columns = [],
    data = [],
    loading = false,
    error = "",
    emptyMessage = "No records found.",
    rowKey = "id",
}) {
    const getAlignmentClass = (align = "left") => {
        if (align === "center") return "text-center";
        if (align === "right") return "text-right";
        return "text-left";
    };
    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <p className="text-sm text-slate-500">
                    Loading...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-600">
                {error}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full">

                    <thead className="bg-slate-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`
                                        px-6
                                        py-4
                                        ${getAlignmentClass(column.align)}
                                        text-xs
                                        font-bold
                                        uppercase
                                        tracking-wider
                                        text-slate-500
                                    `}
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-6 py-12 text-center text-sm text-slate-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr
                                    key={row[rowKey]}
                                    className="transition hover:bg-slate-50"
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`
                                                px-6
                                                py-4
                                                ${getAlignmentClass(column.align)}
                                                text-sm
                                                text-slate-700
                                            `}
                                        >
                                            {column.render
                                                ? column.render(
                                                    row,
                                                    rowIndex
                                                )
                                                : row[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}

                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DataTable;