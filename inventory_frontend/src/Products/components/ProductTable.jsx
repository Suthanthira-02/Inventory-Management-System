import useProducts from "../hooks/useProducts";

function ProductTable({ onEdit }) {
    const {
        products,
        loading,
        error,
        removeProduct,
    } = useProducts();

    const handleDelete = async (product) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${product.name}"?`
        );

        if (!confirmed) {
            return;
        }

        const result = await removeProduct(product.id);

        if (!result.success) {
            alert(result.message);
        }
    };

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <p className="text-sm text-slate-500">
                    Loading products...
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
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                ID
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                Product
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                Description
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                Purchase Price
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                Selling Price
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                Stock
                            </th>

                            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {products.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="px-6 py-12 text-center text-sm text-slate-500"
                                >
                                    No products found.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr
                                    key={product.id}
                                    className="transition hover:bg-slate-50"
                                >
                                    {/* ID */}
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-600">
                                        #{product.id}
                                    </td>

                                    {/* PRODUCT NAME */}
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="font-semibold text-slate-800">
                                            {product.name}
                                        </div>
                                    </td>

                                    {/* DESCRIPTION */}
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs text-sm text-slate-500">
                                            {product.description || "-"}
                                        </div>
                                    </td>

                                    {/* PURCHASE PRICE */}
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                                        ₹{Number(product.price).toFixed(2)}
                                    </td>

                                    {/* SELLING PRICE */}
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-800">
                                        ₹{Number(product.selling_price).toFixed(2)}
                                    </td>

                                    {/* STOCK */}
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                                Number(product.quantity) > 0
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {product.quantity}
                                        </span>
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onEdit(product)
                                                }
                                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(product)
                                                }
                                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ProductTable;