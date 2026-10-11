import {
    createContext,
    useCallback,
    useEffect,
    useState
} from "react";

import { getDashboardData } from "../services/dashboardApi";


export const DashboardContext = createContext(null);


// =========================
// GET PRODUCT COUNT
// =========================

const getProductCount = (transaction) => {

    if (Array.isArray(transaction?.items)) {
        return transaction.items.length;
    }

    if (Array.isArray(transaction?.products)) {
        return transaction.products.length;
    }

    if (transaction?.product_count !== undefined) {
        return Number(transaction.product_count);
    }

    if (transaction?.product_id !== undefined) {
        return 1;
    }

    return 0;
};


// =========================
// DASHBOARD PROVIDER
// =========================

export function DashboardProvider({ children }) {

    const [dashboardData, setDashboardData] = useState({
        products: [],
        suppliers: [],
        purchases: [],
        sales: [],

        totalProducts: 0,
        totalSuppliers: 0,
        totalPurchases: 0,
        totalSales: 0,

        totalStock: 0,
        purchaseValue: 0,
        salesValue: 0
    });

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // =========================
    // FETCH DASHBOARD DATA
    // =========================

    const fetchDashboardData = useCallback(async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getDashboardData();

            setDashboardData(data);

        } catch (error) {

            console.error(
                "Dashboard Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load dashboard data"
            );

        } finally {

            setLoading(false);

        }

    }, []);


    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {

        fetchDashboardData();

    }, [fetchDashboardData]);


    // =========================
    // RECENT ACTIVITY
    // =========================

    const recentActivity = [

        ...dashboardData.purchases.map(
            (purchase) => ({
                id: `purchase-${purchase.id}`,

                type: "Purchase",

                amount: Number(
                    purchase.total_amount ??
                    purchase.total ??
                    purchase.amount ??
                    0
                ),

                productCount:
                    getProductCount(purchase),

                date:
                    purchase.created_at ??
                    purchase.purchase_date ??
                    purchase.date
            })
        ),

        ...dashboardData.sales.map(
            (sale) => ({
                id: `sale-${sale.id}`,

                type: "Sale",

                amount: Number(
                    sale.total_amount ??
                    sale.total ??
                    sale.amount ??
                    0
                ),

                productCount:
                    getProductCount(sale),

                date:
                    sale.created_at ??
                    sale.sale_date ??
                    sale.date
            })
        )

    ]
        .sort(
            (a, b) =>
                new Date(b.date || 0) -
                new Date(a.date || 0)
        )
        .slice(0, 10);


    // =========================
    // CONTEXT VALUE
    // =========================

    const value = {

        ...dashboardData,

        recentActivity,

        loading,

        error,

        refreshDashboard:
            fetchDashboardData
    };


    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}