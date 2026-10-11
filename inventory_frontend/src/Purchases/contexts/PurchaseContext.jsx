import { createContext, useEffect, useState } from "react";

import {
    getPurchases,
    createPurchase,
    updatePurchase,
    returnPurchase,
    deletePurchase,
} from "../services/purchaseApi";

const PurchaseContext = createContext();

export function PurchaseProvider({ children }) {

    const [purchases, setPurchases] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // ============================================
    // LOAD PURCHASES
    // ============================================

    const loadPurchases = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getPurchases();

            if (data.success) {

                setPurchases(data.purchases || []);

            } else {

                setError(
                    data.message ||
                    "Failed to load purchases."
                );
            }

        } catch (error) {

            console.error(
                "Load purchases error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load purchases."
            );

        } finally {

            setLoading(false);
        }
    };


    // ============================================
    // ADD PURCHASE
    // ============================================

    const addPurchase = async (purchaseData) => {

        try {

            const data = await createPurchase(
                purchaseData
            );

            if (data.success) {

                await loadPurchases();

                return {
                    success: true,
                    message:
                        data.message ||
                        "Purchase created successfully.",
                };
            }

            return {
                success: false,
                message:
                    data.message ||
                    "Failed to create purchase.",
            };

        } catch (error) {

            console.error(
                "Add purchase error:",
                error
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Unable to create purchase.",
            };
        }
    };


    // ============================================
    // EDIT PURCHASE
    // ============================================

    const editPurchase = async (
        purchaseId,
        purchaseData
    ) => {

        try {

            const data = await updatePurchase(
                purchaseId,
                purchaseData
            );

            if (data.success) {

                await loadPurchases();

                return {
                    success: true,
                    message:
                        data.message ||
                        "Purchase updated successfully.",
                };
            }

            return {
                success: false,
                message:
                    data.message ||
                    "Failed to update purchase.",
            };

        } catch (error) {

            console.error(
                "Edit purchase error:",
                error
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Unable to update purchase.",
            };
        }
    };


    // ============================================
    // RETURN PURCHASE
    // ============================================

    const returnPurchaseItem = async (
        purchaseId
    ) => {

        try {

            const data = await returnPurchase(
                purchaseId
            );

            if (data.success) {

                await loadPurchases();

                return {
                    success: true,
                    message:
                        data.message ||
                        "Purchase returned successfully.",
                };
            }

            return {
                success: false,
                message:
                    data.message ||
                    "Failed to return purchase.",
            };

        } catch (error) {

            console.error(
                "Return purchase error:",
                error
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Unable to return purchase.",
            };
        }
    };


    // ============================================
    // DELETE PURCHASE
    // ============================================

    const removePurchase = async (purchaseId) => {

        try {

            console.log(
                "DELETE PURCHASE ID:",
                purchaseId
            );

            const data = await deletePurchase(
                purchaseId
            );

            console.log(
                "DELETE PURCHASE RESPONSE:",
                data
            );

            if (data.success) {

                await loadPurchases();

                return {
                    success: true,
                    message:
                        data.message ||
                        "Purchase deleted successfully.",
                };
            }

            return {
                success: false,
                message:
                    data.message ||
                    "Failed to delete purchase.",
            };

        } catch (error) {

            console.error(
                "DELETE PURCHASE ERROR:",
                error
            );

            console.error(
                "BACKEND RESPONSE:",
                error.response?.data
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Unable to delete purchase.",
            };
        }
    };


    // ============================================
    // INITIAL LOAD
    // ============================================

    useEffect(() => {

        loadPurchases();

    }, []);


    return (

        <PurchaseContext.Provider
            value={{
                purchases,
                loading,
                error,

                loadPurchases,

                addPurchase,
                editPurchase,

                returnPurchase:
                    returnPurchaseItem,

                removePurchase,
            }}
        >

            {children}

        </PurchaseContext.Provider>
    );
}

export default PurchaseContext;