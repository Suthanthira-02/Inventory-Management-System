import useDashboard from "../hooks/useDashboard";


function DashboardStats() {

    const {
        totalProducts,
        totalSuppliers,
        totalPurchases,
        totalSales,
        totalStock,
        purchaseValue,
        salesValue,
        loading
    } = useDashboard();


    if (loading) {

        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {[1, 2, 3, 4].map(
                    item => (
                        <div
                            key={item}
                            className="
                                h-32
                                animate-pulse
                                rounded-2xl
                                bg-white
                                shadow-sm
                            "
                        />
                    )
                )}

            </div>
        );
    }


    return (
        <>
            {/* =========================
                TOP STATISTICS
            ========================= */}

            <div className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
                lg:grid-cols-4
            ">

                {/* PRODUCTS */}

                <div className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                ">

                    <p className="text-sm text-slate-500">
                        Total Products
                    </p>

                    <h2 className="
                        mt-3
                        text-3xl
                        font-bold
                        text-slate-800
                    ">
                        {totalProducts}
                    </h2>

                </div>


                {/* SUPPLIERS */}

                <div className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                ">

                    <p className="text-sm text-slate-500">
                        Total Suppliers
                    </p>

                    <h2 className="
                        mt-3
                        text-3xl
                        font-bold
                        text-slate-800
                    ">
                        {totalSuppliers}
                    </h2>

                </div>


                {/* PURCHASES */}

                <div className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                ">

                    <p className="text-sm text-slate-500">
                        Total Purchases
                    </p>

                    <h2 className="
                        mt-3
                        text-3xl
                        font-bold
                        text-slate-800
                    ">
                        {totalPurchases}
                    </h2>

                </div>


                {/* SALES */}

                <div className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                ">

                    <p className="text-sm text-slate-500">
                        Total Sales
                    </p>

                    <h2 className="
                        mt-3
                        text-3xl
                        font-bold
                        text-slate-800
                    ">
                        {totalSales}
                    </h2>

                </div>

            </div>


            {/* =========================
                SECOND ROW
            ========================= */}

            <div className="
                mt-6
                grid
                grid-cols-1
                gap-4
                lg:grid-cols-3
            ">

                {/* TOTAL STOCK */}

                <div className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                ">

                    <p className="text-sm text-slate-500">
                        Total Stock
                    </p>

                    <h2 className="
                        mt-3
                        text-3xl
                        font-bold
                        text-slate-800
                    ">
                        {totalStock}
                    </h2>

                    <p className="
                        mt-1
                        text-sm
                        text-slate-400
                    ">
                        Units currently in inventory
                    </p>

                </div>


                {/* PURCHASE VALUE */}

                <div className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                ">

                    <p className="text-sm text-slate-500">
                        Purchase Value
                    </p>

                    <h2 className="
                        mt-3
                        text-3xl
                        font-bold
                        text-slate-800
                    ">
                        ₹{Number(
                            purchaseValue
                        ).toFixed(2)}
                    </h2>

                    <p className="
                        mt-1
                        text-sm
                        text-slate-400
                    ">
                        Total purchase amount
                    </p>

                </div>


                {/* SALES VALUE */}

                <div className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    shadow-sm
                ">

                    <p className="text-sm text-slate-500">
                        Sales Value
                    </p>

                    <h2 className="
                        mt-3
                        text-3xl
                        font-bold
                        text-slate-800
                    ">
                        ₹{Number(
                            salesValue
                        ).toFixed(2)}
                    </h2>

                    <p className="
                        mt-1
                        text-sm
                        text-slate-400
                    ">
                        Total sales amount
                    </p>

                </div>

            </div>
        </>
    );
}


export default DashboardStats;