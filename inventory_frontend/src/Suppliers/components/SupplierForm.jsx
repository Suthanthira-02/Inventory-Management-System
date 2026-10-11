import { useEffect, useState } from "react";

import CrudForm from "../../common/components/CrudForm";
import useSuppliers from "../hooks/useSuppliers";

function SupplierForm({
    supplier = null,
    onSuccess,
    onCancel,
}) {
    const {
        addSupplier,
        editSupplier,
    } = useSuppliers();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isEditing = Boolean(supplier);

    // =========================
    // LOAD SUPPLIER FOR EDIT
    // =========================

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name || "",
                email: supplier.email || "",
                phone: supplier.phone || "",
                address: supplier.address || "",
            });
        } else {
            setFormData({
                name: "",
                email: "",
                phone: "",
                address: "",
            });
        }

        setError("");
    }, [supplier]);

    // =========================
    // HANDLE INPUT
    // =========================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =========================
    // SUBMIT
    // =========================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        if (!formData.name.trim()) {
            setError("Supplier name is required.");
            return;
        }

        if (!formData.email.trim()) {
            setError("Email is required.");
            return;
        }

        if (!formData.phone.trim()) {
            setError("Phone number is required.");
            return;
        }

        if (!formData.address.trim()) {
            setError("Address is required.");
            return;
        }

        const supplierData = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
        };

        try {
            setLoading(true);

            let result;

            if (isEditing) {
                result = await editSupplier(
                    supplier.id,
                    supplierData
                );
            } else {
                result = await addSupplier(
                    supplierData
                );
            }

            if (!result.success) {
                setError(result.message);
                return;
            }

            onSuccess?.();

        } catch (error) {
            console.error(
                "Supplier form error:",
                error
            );

            setError(
                error.message ||
                "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <CrudForm
            title={
                isEditing
                    ? "Edit Supplier"
                    : "Add Supplier"
            }
            description={
                isEditing
                    ? "Update the supplier details."
                    : "Enter the details for the new supplier."
            }
            error={error}
            loading={loading}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            submitText={
                isEditing
                    ? "Update Supplier"
                    : "Add Supplier"
            }
        >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Supplier Name */}

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Supplier Name
                    </label>

                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter supplier name"
                        className="
                            w-full rounded-xl border border-slate-300
                            px-4 py-3 text-sm outline-none
                            transition focus:border-blue-500
                            focus:ring-2 focus:ring-blue-100
                        "
                    />
                </div>

                {/* Email */}

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Email
                    </label>

                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        className="
                            w-full rounded-xl border border-slate-300
                            px-4 py-3 text-sm outline-none
                            transition focus:border-blue-500
                            focus:ring-2 focus:ring-blue-100
                        "
                    />
                </div>

                {/* Phone */}

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Phone
                    </label>

                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        className="
                            w-full rounded-xl border border-slate-300
                            px-4 py-3 text-sm outline-none
                            transition focus:border-blue-500
                            focus:ring-2 focus:ring-blue-100
                        "
                    />
                </div>

                {/* Address */}

                <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Address
                    </label>

                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Enter supplier address"
                        className="
                            w-full resize-none rounded-xl
                            border border-slate-300 px-4 py-3
                            text-sm outline-none transition
                            focus:border-blue-500
                            focus:ring-2 focus:ring-blue-100
                        "
                    />
                </div>

            </div>
        </CrudForm>
    );
}

export default SupplierForm;