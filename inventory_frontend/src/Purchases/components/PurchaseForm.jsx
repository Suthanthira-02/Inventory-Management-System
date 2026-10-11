import { useEffect, useState } from "react";
import CrudForm from "../../common/components/CrudForm";
import { getSuppliers } from "../../Suppliers/services/supplierApi";
import { getProducts } from "../../Products/services/productApi";
import usePurchases from "../hooks/usePurchases";

function PurchaseForm({ purchase, onSuccess, onCancel }) {
    const { addPurchase, editPurchase } = usePurchases();

    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);

    const [loadingData, setLoadingData] = useState(true);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    // Supplier
    const [supplierId, setSupplierId] = useState(null);
    const [supplierText, setSupplierText] = useState("");
    const [showSupplierSuggestions, setShowSupplierSuggestions] =
        useState(false);

    // Purchase items
    const [items, setItems] = useState([
        {
            product_id: null,
            productText: "",
            description: "",
            quantity: "",
            purchase_price: "",
            selling_price: "",
        },
    ]);

    // =========================================================
    // LOAD SUPPLIERS + PRODUCTS
    // =========================================================

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingData(true);
                setError("");

                const [supplierResponse, productResponse] =
                    await Promise.all([
                        getSuppliers(),
                        getProducts(),
                    ]);

                setSuppliers(
                    supplierResponse.suppliers || []
                );

                setProducts(
                    productResponse.products || []
                );
            } catch (err) {
                console.error("Failed to load purchase form data:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load suppliers and products."
                );
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, []);

    // =========================================================
    // LOAD PURCHASE WHEN EDITING
    // =========================================================

    useEffect(() => {
        if (!purchase) {
            setSupplierId(null);
            setSupplierText("");

            setItems([
                {
                    product_id: null,
                    productText: "",
                    description: "",
                    quantity: "",
                    purchase_price: "",
                    selling_price: "",
                },
            ]);

            return;
        }

        // Supplier
        setSupplierId(purchase.supplier_id || null);
        setSupplierText(purchase.supplier_name || "");

        // Items
        const purchaseItems = (purchase.items || []).map((item) => {
            const existingProduct = products.find(
                (product) => product.id === item.product_id
            );

            return {
                product_id: item.product_id || null,

                productText:
                    item.product_name ||
                    existingProduct?.name ||
                    "",

                description:
                    existingProduct?.description ||
                    "",

                quantity:
                    item.quantity !== undefined
                        ? String(item.quantity)
                        : "",

                purchase_price:
                    item.purchase_price !== undefined
                        ? String(item.purchase_price)
                        : "",

                selling_price:
                    existingProduct?.selling_price !== undefined
                        ? String(existingProduct.selling_price)
                        : "",
            };
        });

        setItems(
            purchaseItems.length > 0
                ? purchaseItems
                : [
                    {
                        product_id: null,
                        productText: "",
                        description: "",
                        quantity: "",
                        purchase_price: "",
                        selling_price: "",
                    },
                ]
        );
    }, [purchase, products]);

    // =========================================================
    // SUPPLIER SUGGESTIONS
    // =========================================================

    const filteredSuppliers = suppliers.filter((supplier) => {
        const search = supplierText.toLowerCase().trim();

        if (!search) return true;

        return (
            supplier.name?.toLowerCase().includes(search) ||
            String(supplier.id).includes(search)
        );
    });

    const selectSupplier = (supplier) => {
        setSupplierId(supplier.id);
        setSupplierText(supplier.name);
        setShowSupplierSuggestions(false);
    };

    // =========================================================
    // PRODUCT SUGGESTIONS
    // =========================================================

    const getFilteredProducts = (text) => {
        const search = text.toLowerCase().trim();

        if (!search) {
            return products;
        }

        return products.filter((product) => {
            return (
                product.name?.toLowerCase().includes(search) ||
                String(product.id).includes(search)
            );
        });
    };

    // =========================================================
    // SELECT EXISTING PRODUCT
    // =========================================================

    const selectProduct = (index, product) => {
        setItems((currentItems) => {
            const updatedItems = [...currentItems];

            updatedItems[index] = {
                ...updatedItems[index],

                product_id: product.id,

                productText: product.name || "",

                description: product.description || "",

                purchase_price:
                    product.price !== undefined &&
                    product.price !== null
                        ? String(product.price)
                        : "",

                selling_price:
                    product.selling_price !== undefined &&
                    product.selling_price !== null
                        ? String(product.selling_price)
                        : "",
            };

            return updatedItems;
        });
    };

    // =========================================================
    // PRODUCT TEXT CHANGE
    // =========================================================

    const handleProductTextChange = (index, value) => {
        setItems((currentItems) => {
            const updatedItems = [...currentItems];

            const currentItem = updatedItems[index];

            updatedItems[index] = {
                ...currentItem,

                product_id: null,

                productText: value,

                // Clear these when user starts typing
                // a new product name.
                description:
                    currentItem.product_id !== null
                        ? ""
                        : currentItem.description,

                purchase_price:
                    currentItem.product_id !== null
                        ? ""
                        : currentItem.purchase_price,

                selling_price:
                    currentItem.product_id !== null
                        ? ""
                        : currentItem.selling_price,
            };

            return updatedItems;
        });
    };

    // =========================================================
    // CHANGE ITEM FIELD
    // =========================================================

    const handleItemChange = (index, field, value) => {
        setItems((currentItems) => {
            const updatedItems = [...currentItems];

            updatedItems[index] = {
                ...updatedItems[index],
                [field]: value,
            };

            return updatedItems;
        });
    };

    // =========================================================
    // ADD ITEM
    // =========================================================

    const addItem = () => {
        setItems((currentItems) => [
            ...currentItems,
            {
                product_id: null,
                productText: "",
                description: "",
                quantity: "",
                purchase_price: "",
                selling_price: "",
            },
        ]);
    };

    // =========================================================
    // REMOVE ITEM
    // =========================================================

    const removeItem = (index) => {
        setItems((currentItems) => {
            if (currentItems.length === 1) {
                return currentItems;
            }

            return currentItems.filter(
                (_, itemIndex) => itemIndex !== index
            );
        });
    };

    // =========================================================
    // SUBTOTAL
    // =========================================================

    const getSubtotal = (item) => {
        const quantity = Number(item.quantity || 0);
        const purchasePrice = Number(
            item.purchase_price || 0
        );

        return quantity * purchasePrice;
    };

    // =========================================================
    // TOTAL
    // =========================================================

    const totalAmount = items.reduce(
        (total, item) => total + getSubtotal(item),
        0
    );

    // =========================================================
    // VALIDATION
    // =========================================================

    const validateForm = () => {
        if (!supplierId) {
            return "Please select a supplier.";
        }

        if (!items.length) {
            return "Please add at least one product.";
        }

        const productNames = [];

        for (let index = 0; index < items.length; index++) {
            const item = items[index];

            const productName = item.productText?.trim();

            if (!productName) {
                return `Please enter a product name for item ${
                    index + 1
                }.`;
            }

            const quantity = Number(item.quantity);

            if (
                !item.quantity ||
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                return `Quantity must be a positive whole number for item ${
                    index + 1
                }.`;
            }

            const purchasePrice = Number(
                item.purchase_price
            );

            if (
                item.purchase_price === "" ||
                Number.isNaN(purchasePrice) ||
                purchasePrice < 0
            ) {
                return `Please enter a valid purchase price for ${
                    productName
                }.`;
            }

            const sellingPrice = Number(
                item.selling_price
            );

            if (
                item.selling_price === "" ||
                Number.isNaN(sellingPrice) ||
                sellingPrice < 0
            ) {
                return `Please enter a valid selling price for ${
                    productName
                }.`;
            }

            // Check duplicate products/names
            const normalizedName =
                productName.toLowerCase();

            if (productNames.includes(normalizedName)) {
                return `Product "${productName}" is added more than once.`;
            }

            productNames.push(normalizedName);
        }

        return null;
    };

    // =========================================================
    // SUBMIT
    // =========================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        const purchaseData = {
            supplier_id: Number(supplierId),

            items: items.map((item) => {
                const productItem = {
                    // IMPORTANT:
                    // Backend requires product_name
                    // even when product_id is supplied.
                    product_name: item.productText.trim(),

                    description:
                        item.description?.trim() || "",

                    quantity: Number(item.quantity),

                    purchase_price:
                        Number(item.purchase_price),

                    selling_price:
                        Number(item.selling_price),
                };

                // Only send product_id for existing products.
                if (item.product_id) {
                    productItem.product_id =
                        Number(item.product_id);
                }

                return productItem;
            }),
        };

        try {
            setLoading(true);

            let result;

            if (purchase) {
                result = await editPurchase(
                    purchase.id,
                    purchaseData
                );
            } else {
                result = await addPurchase(
                    purchaseData
                );
            }

            if (result.success) {
                onSuccess?.(result.message);
            } else {
                setError(
                    result.message ||
                    "Unable to save purchase."
                );
            }
        } catch (err) {
            console.error(
                "Purchase form submit error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to save purchase."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loadingData) {
        return (
            <div className="rounded-xl bg-white p-6 shadow">
                <div className="flex items-center justify-center py-10">
                    <div className="text-sm text-gray-500">
                        Loading suppliers and products...
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================
    // FORM
    // =========================================================

    return (
        <CrudForm
            title={
                purchase
                    ? "Edit Purchase"
                    : "Create Purchase"
            }
            onSubmit={handleSubmit}
            onCancel={onCancel}
            loading={loading}
            error={error}
        >
            <div className="space-y-6">

                {/* =========================================
                    SUPPLIER
                ========================================= */}

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Supplier
                    </label>

                    <div className="relative">
                        <input
                            type="text"
                            value={supplierText}
                            onChange={(event) => {
                                setSupplierText(
                                    event.target.value
                                );
                                setSupplierId(null);
                                setShowSupplierSuggestions(
                                    true
                                );
                            }}
                            onFocus={() =>
                                setShowSupplierSuggestions(
                                    true
                                )
                            }
                            placeholder="Search supplier..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        {showSupplierSuggestions && (
                            <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">

                                {filteredSuppliers.length > 0 ? (
                                    filteredSuppliers.map(
                                        (supplier) => (
                                            <button
                                                key={
                                                    supplier.id
                                                }
                                                type="button"
                                                onMouseDown={(
                                                    event
                                                ) =>
                                                    event.preventDefault()
                                                }
                                                onClick={() =>
                                                    selectSupplier(
                                                        supplier
                                                    )
                                                }
                                                className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                                            >
                                                <div className="font-medium text-gray-800">
                                                    {
                                                        supplier.name
                                                    }
                                                </div>

                                                {supplier.phone && (
                                                    <div className="text-xs text-gray-500">
                                                        {
                                                            supplier.phone
                                                        }
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    )
                                ) : (
                                    <div className="px-4 py-3 text-sm text-gray-500">
                                        No suppliers found.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {supplierId && (
                        <p className="mt-1 text-xs text-green-600">
                            Supplier selected
                        </p>
                    )}
                </div>

                {/* =========================================
                    PRODUCTS
                ========================================= */}

                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800">
                                Purchase Items
                            </h3>

                            <p className="text-xs text-gray-500">
                                Select an existing product or
                                type a new product name.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={addItem}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                            + Add Product
                        </button>
                    </div>

                    <div className="space-y-4">

                        {items.map((item, index) => {
                            const filteredProducts =
                                getFilteredProducts(
                                    item.productText
                                );

                            const subtotal =
                                getSubtotal(item);

                            const isExistingProduct =
                                Boolean(
                                    item.product_id
                                );

                            return (
                                <div
                                    key={index}
                                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                                >

                                    {/* ITEM HEADER */}

                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                                                {index + 1}
                                            </span>

                                            <span className="text-sm font-semibold text-gray-700">
                                                Product
                                            </span>

                                            {isExistingProduct ? (
                                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                                    Existing
                                                </span>
                                            ) : item.productText ? (
                                                <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                                                    New Product
                                                </span>
                                            ) : null}
                                        </div>

                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeItem(
                                                        index
                                                    )
                                                }
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    {/* PRODUCT NAME */}

                                    <div className="relative">
                                        <label className="mb-2 block text-xs font-medium text-gray-600">
                                            Product Name
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                item.productText
                                            }
                                            onChange={(event) =>
                                                handleProductTextChange(
                                                    index,
                                                    event.target
                                                        .value
                                                )
                                            }
                                            placeholder="Search existing product or enter new product name"
                                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                        {item.productText &&
                                            !isExistingProduct && (
                                                <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">

                                                    {filteredProducts.length >
                                                    0 ? (
                                                        filteredProducts.map(
                                                            (
                                                                product
                                                            ) => (
                                                                <button
                                                                    key={
                                                                        product.id
                                                                    }
                                                                    type="button"
                                                                    onMouseDown={(
                                                                        event
                                                                    ) =>
                                                                        event.preventDefault()
                                                                    }
                                                                    onClick={() =>
                                                                        selectProduct(
                                                                            index,
                                                                            product
                                                                        )
                                                                    }
                                                                    className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                                                                >
                                                                    <div className="font-medium text-gray-800">
                                                                        {
                                                                            product.name
                                                                        }
                                                                    </div>

                                                                    <div className="mt-1 flex gap-3 text-xs text-gray-500">
                                                                        <span>
                                                                            ID:{" "}
                                                                            {
                                                                                product.id
                                                                            }
                                                                        </span>

                                                                        <span>
                                                                            Stock:{" "}
                                                                            {
                                                                                product.quantity
                                                                            }
                                                                        </span>

                                                                        <span>
                                                                            Buy: ₹
                                                                            {Number(
                                                                                product.price ||
                                                                                0
                                                                            ).toFixed(
                                                                                2
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </button>
                                                            )
                                                        )
                                                    ) : (
                                                        <div className="px-4 py-3 text-sm text-gray-500">
                                                            No existing
                                                            product found.
                                                            This will be
                                                            treated as a new
                                                            product.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                    </div>

                                    {/* DESCRIPTION */}

                                    <div className="mt-4">
                                        <label className="mb-2 block text-xs font-medium text-gray-600">
                                            Description
                                            <span className="ml-1 font-normal text-gray-400">
                                                (optional)
                                            </span>
                                        </label>

                                        <textarea
                                            value={
                                                item.description
                                            }
                                            onChange={(event) =>
                                                handleItemChange(
                                                    index,
                                                    "description",
                                                    event.target
                                                        .value
                                                )
                                            }
                                            rows={2}
                                            placeholder="Product description"
                                            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    {/* PRICES + QUANTITY */}

                                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

                                        {/* PURCHASE PRICE */}

                                        <div>
                                            <label className="mb-2 block text-xs font-medium text-gray-600">
                                                Purchase Price
                                            </label>

                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                                    ₹
                                                </span>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        item.purchase_price
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleItemChange(
                                                            index,
                                                            "purchase_price",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="0.00"
                                                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-8 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                            </div>
                                        </div>

                                        {/* SELLING PRICE */}

                                        <div>
                                            <label className="mb-2 block text-xs font-medium text-gray-600">
                                                Selling Price
                                            </label>

                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                                    ₹
                                                </span>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        item.selling_price
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleItemChange(
                                                            index,
                                                            "selling_price",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="0.00"
                                                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-8 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                            </div>
                                        </div>

                                        {/* QUANTITY */}

                                        <div>
                                            <label className="mb-2 block text-xs font-medium text-gray-600">
                                                Quantity
                                            </label>

                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={
                                                    item.quantity
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleItemChange(
                                                        index,
                                                        "quantity",
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                                placeholder="0"
                                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>
                                    </div>

                                    {/* SUBTOTAL */}

                                    <div className="mt-4 flex items-center justify-between rounded-lg bg-white px-4 py-3">
                                        <span className="text-sm text-gray-500">
                                            Subtotal
                                        </span>

                                        <span className="text-base font-semibold text-gray-800">
                                            ₹
                                            {subtotal.toFixed(
                                                2
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* =========================================
                    TOTAL
                ========================================= */}

                <div className="flex items-center justify-between rounded-xl bg-blue-50 px-5 py-4">
                    <div>
                        <p className="text-sm font-medium text-gray-600">
                            Total Purchase Amount
                        </p>

                        <p className="text-xs text-gray-500">
                            {items.length} product
                            {items.length !== 1
                                ? "s"
                                : ""}
                        </p>
                    </div>

                    <p className="text-2xl font-bold text-blue-700">
                        ₹{totalAmount.toFixed(2)}
                    </p>
                </div>

            </div>
        </CrudForm>
    );
}

export default PurchaseForm;