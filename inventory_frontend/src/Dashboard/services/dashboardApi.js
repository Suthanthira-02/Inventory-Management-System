import api from "../../common/services/api";


// =========================
// GET DASHBOARD DATA
// =========================

export const getDashboardData = async () => {

    const [
        productsResponse,
        suppliersResponse,
        purchasesResponse,
        salesResponse
    ] = await Promise.all([
        api.get("/api/products/"),
        api.get("/api/suppliers/"),
        api.get("/api/purchases/"),
        api.get("/api/sales/")
    ]);

    const products = Array.isArray(productsResponse.data)
        ? productsResponse.data
        : productsResponse.data?.products || [];

    const suppliers = Array.isArray(suppliersResponse.data)
        ? suppliersResponse.data
        : suppliersResponse.data?.suppliers || [];

    const purchases = Array.isArray(purchasesResponse.data)
        ? purchasesResponse.data
        : purchasesResponse.data?.purchases || [];

    const sales = Array.isArray(salesResponse.data)
        ? salesResponse.data
        : salesResponse.data?.sales || [];


    // =========================
    // TOTAL STOCK
    // =========================

    const totalStock = products.reduce(
        (total, product) =>
            total + Number(
                product.stock_quantity ??
                product.quantity ??
                product.stock ??
                0
            ),
        0
    );


    // =========================
    // PURCHASE VALUE
    // =========================

    const purchaseValue = purchases.reduce(
        (total, purchase) =>
            total + Number(
                purchase.total_amount ??
                purchase.total ??
                purchase.amount ??
                0
            ),
        0
    );


    // =========================
    // SALES VALUE
    // =========================

    const salesValue = sales.reduce(
        (total, sale) =>
            total + Number(
                sale.total_amount ??
                sale.total ??
                sale.amount ??
                0
            ),
        0
    );


    return {
        products,
        suppliers,
        purchases,
        sales,

        totalProducts: products.length,
        totalSuppliers: suppliers.length,
        totalPurchases: purchases.length,
        totalSales: sales.length,

        totalStock,
        purchaseValue,
        salesValue
    };
};