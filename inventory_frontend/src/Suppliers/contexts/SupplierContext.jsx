import {
    createContext,
    useEffect,
    useState,
} from "react";

import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
} from "../services/supplierApi";

const SupplierContext = createContext();

export function SupplierProvider({ children }) {

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================
    // LOAD SUPPLIERS
    // =========================

    const loadSuppliers = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getSuppliers();

            setSuppliers(
                data.suppliers || []
            );

        } catch (error) {

            console.error(
                "Get suppliers error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load suppliers."
            );

        } finally {

            setLoading(false);

        }
    };

    // =========================
    // ADD SUPPLIER
    // =========================

    const addSupplier = async (supplierData) => {

        try {

            setError("");

            const data =
                await createSupplier(supplierData);

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to create supplier."
                );

            }

            await loadSuppliers();

            return {
                success: true,
                message:
                    data.message ||
                    "Supplier created successfully.",
            };

        } catch (error) {

            console.error(
                "Create supplier error:",
                error
            );

            const message =
                error.response?.data?.message ||
                error.message ||
                "Unable to create supplier.";

            setError(message);

            return {
                success: false,
                message,
            };
        }
    };

    // =========================
    // EDIT SUPPLIER
    // =========================

    const editSupplier = async (
        supplierId,
        supplierData
    ) => {

        try {

            setError("");

            const data =
                await updateSupplier(
                    supplierId,
                    supplierData
                );

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to update supplier."
                );

            }

            await loadSuppliers();

            return {
                success: true,
                message:
                    data.message ||
                    "Supplier updated successfully.",
            };

        } catch (error) {

            console.error(
                "Update supplier error:",
                error
            );

            const message =
                error.response?.data?.message ||
                error.message ||
                "Unable to update supplier.";

            setError(message);

            return {
                success: false,
                message,
            };
        }
    };

    // =========================
    // DELETE SUPPLIER
    // =========================

    const removeSupplier = async (
        supplierId
    ) => {

        try {

            setError("");

            const data =
                await deleteSupplier(
                    supplierId
                );

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to delete supplier."
                );

            }

            await loadSuppliers();

            return {
                success: true,
                message:
                    data.message ||
                    "Supplier deleted successfully.",
            };

        } catch (error) {

            console.error(
                "Delete supplier error:",
                error
            );

            const message =
                error.response?.data?.message ||
                error.message ||
                "Unable to delete supplier.";

            setError(message);

            return {
                success: false,
                message,
            };
        }
    };

    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {
        loadSuppliers();
    }, []);

    return (
        <SupplierContext.Provider
            value={{
                suppliers,
                loading,
                error,
                loadSuppliers,
                addSupplier,
                editSupplier,
                removeSupplier,
            }}
        >
            {children}
        </SupplierContext.Provider>
    );
}

export default SupplierContext;