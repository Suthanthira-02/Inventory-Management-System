import { createContext, useEffect, useState } from "react";

import {
    getSales,
    createSale,
    updateSale,
    returnSale as returnSaleApi,
    refundSale as refundSaleApi,
    deleteSale,
} from "../services/saleApi";

import {
    getCustomers,
    createCustomer,
} from "../../Customers/services/customerApi";


const SaleContext = createContext(null);


// ============================================
// PROVIDER
// ============================================

export const SaleProvider = ({ children }) => {

    const [sales, setSales] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [customers, setCustomers] = useState([]);
    const [customersLoading, setCustomersLoading] = useState(true);


    // ========================================
    // LOAD SALES
    // ========================================

    const loadSales = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getSales();

            if (data.success) {

                setSales(data.sales || []);

            } else {

                setError(
                    data.message ||
                    "Unable to load sales."
                );
            }

        } catch (error) {

            console.error(
                "Load sales error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load sales."
            );

        } finally {

            setLoading(false);
        }
    };


    // ========================================
    // ADD SALE
    // ========================================

    const addSale = async (saleData) => {

        try {

            const data =
                await createSale(saleData);

            if (data.success) {

                await loadSales();

                return {
                    success: true,
                    message:
                        data.message ||
                        "Sale created successfully.",
                };
            }

            return {
                success: false,
                message:
                    data.message ||
                    "Unable to create sale.",
            };

        } catch (error) {

            console.error(
                "Create sale error:",
                error
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Unable to create sale.",
            };
        }
    };


    // ========================================
    // EDIT SALE
    // ========================================

    const editSale = async (
        saleId,
        saleData
    ) => {

        try {

            const data =
                await updateSale(
                    saleId,
                    saleData
                );

            if (data.success) {

                await loadSales();

                return {
                    success: true,
                    message:
                        data.message ||
                        "Sale updated successfully.",
                };
            }

            return {
                success: false,
                message:
                    data.message ||
                    "Unable to update sale.",
            };

        } catch (error) {

            console.error(
                "Update sale error:",
                error
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Unable to update sale.",
            };
        }
    };


    // ========================================
    // RETURN SALE
    // ========================================

    const returnSale = async (saleId) => {

        try {

            const data =
                await returnSaleApi(
                    saleId
                );

            if (data.success) {

                await loadSales();

                return {
                    success: true,
                    message:
                        data.message ||
                        "Sale returned successfully.",
                };
            }

            return {
                success: false,
                message:
                    data.message ||
                    "Unable to return sale.",
            };

        } catch (error) {

            console.error(
                "Return sale error:",
                error
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Unable to return sale.",
            };
        }
    };


    // ========================================
    // REFUND SALE
    // ========================================

    const refundSale = async (saleId) => {

        try {

            const data =
                await refundSaleApi(
                    saleId
                );

            if (data.success) {

                await loadSales();

                return {
                    success: true,
                    message:
                        data.message ||
                        "Sale refunded successfully.",
                };
            }

            return {
                success: false,
                message:
                    data.message ||
                    "Unable to refund sale.",
            };

        } catch (error) {

            console.error(
                "Refund sale error:",
                error
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Unable to refund sale.",
            };
        }
    };


    // ========================================
    // DELETE SALE
    // ========================================

    const removeSale = async (saleId) => {

        try {

            const data =
                await deleteSale(
                    saleId
                );

            if (data.success) {

                await loadSales();

                return {
                    success: true,
                    message:
                        data.message ||
                        "Sale deleted successfully.",
                };
            }

            return {
                success: false,
                message:
                    data.message ||
                    "Unable to delete sale.",
            };

        } catch (error) {

            console.error(
                "Delete sale error:",
                error
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Unable to delete sale.",
            };
        }
    };


    // ========================================
    // LOAD CUSTOMERS
    // ========================================

    const loadCustomers = async () => {

        try {

            setCustomersLoading(true);

            const data = await getCustomers();

            if (data.success) {
                setCustomers(data.customers || []);
            }

        } catch (error) {

            console.error(
                "Load customers error:",
                error
            );

        } finally {

            setCustomersLoading(false);
        }
    };


    // ========================================
    // CREATE CUSTOMER FROM SALE
    // ========================================

    const addCustomerForSale = async (
        customerData
    ) => {

        try {

            const data =
                await createCustomer(
                    customerData
                );

            if (data.success) {

                await loadCustomers();

                return {
                    success: true,
                    customer:
                        data.customer,
                    message:
                        data.message ||
                        "Customer created successfully.",
                };
            }

            return {
                success: false,
                message:
                    data.message ||
                    "Unable to create customer.",
            };

        } catch (error) {

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Unable to create customer.",
            };
        }
    };


    // ========================================
    // INITIAL LOAD
    // ========================================

    useEffect(() => {

        loadSales();
        loadCustomers();

    }, []);


    // ========================================
    // PROVIDER
    // ========================================

    return (

        <SaleContext.Provider
            value={{
                sales,
                customers,
                customersLoading,
                loading,
                error,
                loadSales,
                loadCustomers,
                addCustomerForSale,
                addSale,
                editSale,
                returnSale,
                refundSale,
                removeSale,
            }}
        >
            {children}
        </SaleContext.Provider>
    );
};


// IMPORTANT:
// DEFAULT EXPORT
// ============================================

export default SaleContext;