import { useEffect, useState } from "react";

import { getProducts } from "../../Products/services/productApi";
import CrudForm from "../../common/components/CrudForm";

import useSales from "../hooks/useSales";


// ============================================
// DEFAULT ITEM
// ============================================

const createEmptyItem = () => ({
    product_id: "",
    product_name: "",
    quantity: "",
    selling_price: 0,
    available_quantity: 0,
    search: "",
});


function SaleForm({
    sale = null,
    onSuccess,
    onCancel,
}) {

    const {
        addSale,
        editSale,
        customers,
        customersLoading,
        addCustomerForSale,
    } = useSales();


    // ========================================
    // PRODUCTS
    // ========================================

    const [products, setProducts] = useState([]);

    const [productsLoading, setProductsLoading] =
        useState(true);


    // ========================================
    // SALE ITEMS
    // ========================================

    const [items, setItems] = useState([
        createEmptyItem(),
    ]);


    // ========================================
    // FORM STATE
    // ========================================

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");


    // ========================================
    // CUSTOMER STATE
    // ========================================

    const [customerMode, setCustomerMode] =
        useState("existing");

    const [customerId, setCustomerId] =
        useState("");

    const [newCustomer, setNewCustomer] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
    });


    // ========================================
    // PAYMENT STATE
    // ========================================

    const [paymentType, setPaymentType] =
        useState("FULL");

    const [paidAmount, setPaidAmount] =
        useState("");


    // ========================================
    // LOAD PRODUCTS
    // ========================================

    useEffect(() => {

        const loadProducts = async () => {

            try {

                setProductsLoading(true);
                setError("");

                const response =
                    await getProducts();

                if (response.success) {

                    setProducts(
                        response.products || []
                    );

                } else {

                    setError(
                        response.message ||
                        "Unable to load products."
                    );
                }

            } catch (error) {

                console.error(
                    "Load products error:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Unable to load products."
                );

            } finally {

                setProductsLoading(false);
            }
        };


        loadProducts();

    }, []);


    // ========================================
    // LOAD SALE FOR EDIT
    // ========================================

    useEffect(() => {

        if (!sale) {

            setItems([
                createEmptyItem(),
            ]);

            setCustomerId("");
            setCustomerMode("existing");

            setNewCustomer({
                name: "",
                phone: "",
                email: "",
                address: "",
            });

            setPaymentType("FULL");
            setPaidAmount("");

            return;
        }


        // CUSTOMER

        if (sale.customer_id) {

            setCustomerId(
                String(sale.customer_id)
            );

            setCustomerMode("existing");

        } else {

            setCustomerId("");
            setCustomerMode("existing");
        }


        // PAYMENT

        if (sale.payment_type) {

            setPaymentType(
                sale.payment_type === "FULL"
                    ? "FULL"
                    : sale.payment_type
            );

        }

        if (sale.paid_amount !== undefined) {

            setPaidAmount(
                sale.paid_amount || ""
            );
        }


        // PRODUCTS

        if (
            !products.length ||
            !sale.items?.length
        ) {
            return;
        }


        const editItems =
            sale.items.map((item) => {

                const product =
                    products.find(
                        (product) =>
                            Number(product.id) ===
                            Number(item.product_id)
                    );


                return {

                    product_id:
                        item.product_id,

                    product_name:
                        item.product_name ||
                        product?.name ||
                        "",

                    quantity:
                        item.quantity,

                    selling_price:
                        Number(
                            item.selling_price ??
                            product?.selling_price ??
                            0
                        ),

                    available_quantity:
                        product
                            ? Number(
                                product.quantity
                            ) +
                            Number(
                                item.quantity
                            )
                            : 0,

                    search:
                        item.product_name ||
                        product?.name ||
                        "",
                };
            });


        setItems(editItems);

    }, [sale, products]);


    // ========================================
    // PRODUCT SEARCH
    // ========================================

    const getSuggestions = (
        search,
        currentProductId
    ) => {

        if (!search?.trim()) {
            return [];
        }


        const value =
            search
                .trim()
                .toLowerCase();


        return products.filter(
            (product) => {

                const matchesName =
                    product.name
                        ?.toLowerCase()
                        .includes(value);


                const matchesId =
                    String(product.id)
                        .includes(value);


                const alreadySelected =
                    items.some(
                        (item) =>
                            Number(
                                item.product_id
                            ) ===
                            Number(product.id) &&

                            Number(
                                currentProductId
                            ) !==
                            Number(product.id)
                    );


                return (
                    (
                        matchesName ||
                        matchesId
                    ) &&
                    !alreadySelected
                );
            }
        );
    };


    // ========================================
    // PRODUCT SEARCH CHANGE
    // ========================================

    const handleSearchChange = (
        index,
        value
    ) => {

        setItems((currentItems) => {

            const updated = [
                ...currentItems,
            ];


            updated[index] = {

                ...updated[index],

                search: value,

                product_id: "",

                product_name: "",

                selling_price: 0,

                available_quantity: 0,

                quantity: "",
            };


            return updated;
        });
    };


    // ========================================
    // SELECT PRODUCT
    // ========================================

    const handleSelectProduct = (
        index,
        product
    ) => {

        setItems((currentItems) => {

            const updated = [
                ...currentItems,
            ];


            updated[index] = {

                ...updated[index],

                product_id:
                    product.id,

                product_name:
                    product.name,

                selling_price:
                    Number(
                        product.selling_price || 0
                    ),

                available_quantity:
                    Number(
                        product.quantity || 0
                    ),

                search:
                    product.name,

                quantity: "",
            };


            return updated;
        });
    };


    // ========================================
    // QUANTITY CHANGE
    // ========================================

    const handleQuantityChange = (
        index,
        value
    ) => {

        setItems((currentItems) => {

            const updated = [
                ...currentItems,
            ];


            updated[index] = {

                ...updated[index],

                quantity: value,
            };


            return updated;
        });
    };


    // ========================================
    // ADD PRODUCT
    // ========================================

    const handleAddProduct = () => {

        setItems((currentItems) => [

            ...currentItems,

            createEmptyItem(),
        ]);
    };


    // ========================================
    // REMOVE PRODUCT
    // ========================================

    const handleRemoveProduct = (
        index
    ) => {

        setItems((currentItems) => {

            if (
                currentItems.length === 1
            ) {
                return currentItems;
            }


            return currentItems.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            );
        });
    };


    // ========================================
    // CUSTOMER CHANGE
    // ========================================

    const handleCustomerChange = (
        value
    ) => {

        setCustomerId(value);

        setCustomerMode(
            "existing"
        );

        setError("");
    };


    // ========================================
    // NEW CUSTOMER CHANGE
    // ========================================

    const handleNewCustomerChange = (
        event
    ) => {

        const {
            name,
            value,
        } = event.target;


        setNewCustomer((current) => ({

            ...current,

            [name]: value,
        }));


        setError("");
    };


    // ========================================
    // CREATE CUSTOMER
    // ========================================

    const handleCreateCustomer = async () => {

        if (
            !newCustomer.name.trim()
        ) {

            setError(
                "Customer name is required."
            );

            return;
        }


        try {

            setLoading(true);
            setError("");


            const result =
                await addCustomerForSale({

                    name:
                        newCustomer.name.trim(),

                    phone:
                        newCustomer.phone.trim(),

                    email:
                        newCustomer.email.trim(),

                    address:
                        newCustomer.address.trim(),

                    opening_balance: 0,
                });


            if (!result.success) {

                setError(
                    result.message ||
                    "Unable to create customer."
                );

                return;
            }


            const createdCustomer =
                result.customer ||
                result.data?.customer;


            if (!createdCustomer?.id) {

                setError(
                    "Customer was created, but customer ID was not returned."
                );

                return;
            }


            setCustomerId(
                String(
                    createdCustomer.id
                )
            );

            setCustomerMode(
                "existing"
            );


            setNewCustomer({

                name: "",
                phone: "",
                email: "",
                address: "",
            });

        } catch (error) {

            console.error(
                "Create customer error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to create customer."
            );

        } finally {

            setLoading(false);
        }
    };


    // ========================================
    // SUBTOTAL
    // ========================================

    const getSubtotal = (
        item
    ) => {

        return (
            Number(
                item.selling_price || 0
            ) *
            Number(
                item.quantity || 0
            )
        );
    };


    // ========================================
    // TOTAL
    // ========================================

    const totalAmount =
        items.reduce(
            (total, item) =>
                total +
                getSubtotal(item),
            0
        );


    // ========================================
    // CUSTOMER DUE
    // ========================================

    const customerDue =
        paymentType === "PARTIAL"
            ? Math.max(
                totalAmount -
                Number(
                    paidAmount || 0
                ),
                0
            )
            : paymentType === "CREDIT"
                ? totalAmount
                : 0;


    // ========================================
    // SUBMIT
    // ========================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();

        setError("");


        // ------------------------------------
        // PRODUCT LOADING
        // ------------------------------------

        if (productsLoading) {

            setError(
                "Products are still loading."
            );

            return;
        }


        // ------------------------------------
        // PRODUCT VALIDATION
        // ------------------------------------

        const invalidProduct =
            items.find(
                (item) =>
                    !item.product_id
            );


        if (invalidProduct) {

            setError(
                "Please select a product for every row."
            );

            return;
        }


        // ------------------------------------
        // QUANTITY VALIDATION
        // ------------------------------------

        const invalidQuantity =
            items.find(
                (item) =>
                    !item.quantity ||
                    Number(item.quantity) <= 0
            );


        if (invalidQuantity) {

            setError(
                "Quantity must be greater than 0."
            );

            return;
        }


        // ------------------------------------
        // STOCK VALIDATION
        // ------------------------------------

        const insufficientStock =
            items.find(
                (item) =>
                    Number(item.quantity) >
                    Number(
                        item.available_quantity
                    )
            );


        if (insufficientStock) {

            setError(
                `Not enough stock for ${insufficientStock.product_name}. Available stock: ${insufficientStock.available_quantity}.`
            );

            return;
        }


        // ------------------------------------
        // DUPLICATE PRODUCT VALIDATION
        // ------------------------------------

        const productIds =
            items.map(
                (item) =>
                    Number(
                        item.product_id
                    )
            );


        const hasDuplicate =
            new Set(
                productIds
            ).size !==
            productIds.length;


        if (hasDuplicate) {

            setError(
                "The same product cannot be added more than once."
            );

            return;
        }


        // ------------------------------------
        // CUSTOMER VALIDATION
        // ------------------------------------

        if (
            (
                paymentType === "CREDIT" ||
                paymentType === "PARTIAL"
            ) &&
            !customerId
        ) {

            setError(
                "Please select or create a customer for credit or partial payment."
            );

            return;
        }


        // ------------------------------------
        // PARTIAL PAYMENT VALIDATION
        // ------------------------------------

        if (
            paymentType === "PARTIAL"
        ) {

            const paid =
                Number(
                    paidAmount
                );


            if (
                !Number.isFinite(paid) ||
                paid <= 0
            ) {

                setError(
                    "Partial payment must be greater than 0."
                );

                return;
            }


            if (
                paid >= totalAmount
            ) {

                setError(
                    "For full payment, please select Full Payment instead."
                );

                return;
            }
        }


        // ------------------------------------
        // API DATA
        // ------------------------------------

        const saleData = {

            customer_id:
                customerId
                    ? Number(customerId)
                    : null,

            payment_type:
                paymentType === "FULL_ONLINE"
                    ? "FULL"
                    : paymentType,

            ...(paymentType === "PARTIAL"
                ? {
                    paid_amount:
                        Number(
                            paidAmount
                        ),
                }
                : {}),

            items:
                items.map(
                    (item) => ({

                        product_id:
                            Number(
                                item.product_id
                            ),

                        quantity:
                            Number(
                                item.quantity
                            ),
                    })
                ),
        };


        // ------------------------------------
        // SAVE
        // ------------------------------------

        try {

            setLoading(true);


            let result;


            if (sale) {

                result =
                    await editSale(
                        sale.id,
                        saleData
                    );

            } else {

                result =
                    await addSale(
                        saleData
                    );
            }


            if (result.success) {

                onSuccess();

            } else {

                setError(
                    result.message ||
                    "Unable to save sale."
                );
            }

        } catch (error) {

            console.error(
                "Save sale error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to save sale."
            );

        } finally {

            setLoading(false);
        }
    };


    // ========================================
    // UI
    // ========================================

    return (

        <CrudForm

            title={
                sale
                    ? "Edit Sale"
                    : "Add Sale"
            }

            description={
                sale
                    ? "Update the products and payment details in this sale."
                    : "Add products, select a customer and record the payment."
            }

            error={error}

            loading={loading}

            onSubmit={handleSubmit}

            onCancel={onCancel}

            submitText={
                sale
                    ? "Update Sale"
                    : "Create Sale"
            }
        >

            <div className="space-y-4">


                {/* ==================================
                    CUSTOMER
                ================================== */}

                <div
                    className="
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        p-4
                    "
                >

                    <div
                        className="
                            mb-3
                            flex
                            items-center
                            justify-between
                        "
                    >

                        <h3
                            className="
                                text-lg
                                font-semibold
                                text-slate-800
                            "
                        >
                            Customer
                        </h3>


                        <button
                            type="button"

                            onClick={() => {

                                setCustomerMode(
                                    customerMode === "new"
                                        ? "existing"
                                        : "new"
                                );

                                setError("");
                            }}

                            className="
                                rounded-lg
                                bg-blue-50
                                px-3
                                py-2
                                text-sm
                                font-semibold
                                text-blue-600
                                hover:bg-blue-100
                            "
                        >

                            {customerMode === "new"
                                ? "Select Existing"
                                : "+ New Customer"
                            }

                        </button>

                    </div>


                    {customerMode === "existing" ? (

                        <div className="space-y-2">

                            <select
                                value={
                                    customerId
                                }

                                onChange={(
                                    event
                                ) =>
                                    handleCustomerChange(
                                        event.target.value
                                    )
                                }

                                disabled={
                                    customersLoading
                                }

                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-slate-300
                                    bg-white
                                    px-3
                                    py-2.5
                                    text-sm
                                    outline-none
                                    focus:border-blue-500
                                    focus:ring-2
                                    focus:ring-blue-100
                                    disabled:bg-slate-100
                                "
                            >

                                <option value="">

                                    {customersLoading
                                        ? "Loading customers..."
                                        : "Walk-in Customer / No Customer"
                                    }

                                </option>


                                {customers.map(
                                    (customer) => (

                                        <option
                                            key={
                                                customer.id
                                            }

                                            value={
                                                customer.id
                                            }
                                        >

                                            {customer.name}

                                            {customer.phone
                                                ? ` - ${customer.phone}`
                                                : ""
                                            }

                                        </option>
                                    )
                                )}

                            </select>


                            {customerId && (

                                <p
                                    className="
                                        text-xs
                                        text-slate-500
                                    "
                                >
                                    This sale will be linked to the selected customer.
                                </p>
                            )}

                        </div>

                    ) : (

                        <div className="space-y-3">

                            <div
                                className="
                                    grid
                                    grid-cols-1
                                    gap-3
                                    md:grid-cols-2
                                "
                            >

                                <input
                                    name="name"

                                    value={
                                        newCustomer.name
                                    }

                                    onChange={
                                        handleNewCustomerChange
                                    }

                                    placeholder="Customer name *"

                                    className="
                                        rounded-lg
                                        border
                                        border-slate-300
                                        bg-white
                                        px-3
                                        py-2.5
                                        text-sm
                                        outline-none
                                        focus:border-blue-500
                                    "
                                />


                                <input
                                    name="phone"

                                    value={
                                        newCustomer.phone
                                    }

                                    onChange={
                                        handleNewCustomerChange
                                    }

                                    placeholder="Phone"

                                    className="
                                        rounded-lg
                                        border
                                        border-slate-300
                                        bg-white
                                        px-3
                                        py-2.5
                                        text-sm
                                        outline-none
                                        focus:border-blue-500
                                    "
                                />


                                <input
                                    name="email"

                                    type="email"

                                    value={
                                        newCustomer.email
                                    }

                                    onChange={
                                        handleNewCustomerChange
                                    }

                                    placeholder="Email"

                                    className="
                                        rounded-lg
                                        border
                                        border-slate-300
                                        bg-white
                                        px-3
                                        py-2.5
                                        text-sm
                                        outline-none
                                        focus:border-blue-500
                                    "
                                />


                                <input
                                    name="address"

                                    value={
                                        newCustomer.address
                                    }

                                    onChange={
                                        handleNewCustomerChange
                                    }

                                    placeholder="Address"

                                    className="
                                        rounded-lg
                                        border
                                        border-slate-300
                                        bg-white
                                        px-3
                                        py-2.5
                                        text-sm
                                        outline-none
                                        focus:border-blue-500
                                    "
                                />

                            </div>


                            <button
                                type="button"

                                onClick={
                                    handleCreateCustomer
                                }

                                disabled={
                                    loading
                                }

                                className="
                                    rounded-lg
                                    bg-blue-600
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition
                                    hover:bg-blue-700
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >

                                {loading
                                    ? "Creating..."
                                    : "Create & Select Customer"
                                }

                            </button>

                        </div>
                    )}

                </div>


                {/* ==================================
                    PAYMENT
                ================================== */}

                <div
                    className="
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        p-4
                    "
                >

                    <h3
                        className="
                            mb-3
                            text-lg
                            font-semibold
                            text-slate-800
                        "
                    >
                        Payment
                    </h3>


                    <div
                        className="
                            grid
                            grid-cols-1
                            gap-4
                            md:grid-cols-2
                        "
                    >

                        <div>

                            <label
                                className="
                                    mb-1.5
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                "
                            >
                                Payment Type
                            </label>


                            <select
                                value={
                                    paymentType
                                }

                                onChange={(
                                    event
                                ) => {

                                    const value =
                                        event.target.value;

                                    setPaymentType(
                                        value
                                    );


                                    if (
                                        value !==
                                        "PARTIAL"
                                    ) {

                                        setPaidAmount("");
                                    }

                                    setError("");
                                }}

                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-slate-300
                                    bg-white
                                    px-3
                                    py-2.5
                                    text-sm
                                    outline-none
                                    focus:border-blue-500
                                    focus:ring-2
                                    focus:ring-blue-100
                                "
                            >

                                <option value="FULL">
                                    Full Payment
                                </option>

                                <option value="FULL_ONLINE">
                                    Full Online
                                </option>

                                <option value="PARTIAL">
                                    Partial Payment
                                </option>

                                <option value="CREDIT">
                                    Credit / Pay Later
                                </option>

                            </select>

                        </div>


                        {paymentType === "PARTIAL" && (

                            <div>

                                <label
                                    className="
                                        mb-1.5
                                        block
                                        text-sm
                                        font-medium
                                        text-slate-700
                                    "
                                >
                                    Paid Amount
                                </label>


                                <input
                                    type="number"

                                    min="0.01"

                                    step="0.01"

                                    max={
                                        Math.max(
                                            totalAmount -
                                            0.01,
                                            0
                                        )
                                    }

                                    value={
                                        paidAmount
                                    }

                                    onChange={(
                                        event
                                    ) =>
                                        setPaidAmount(
                                            event.target.value
                                        )
                                    }

                                    placeholder="Enter paid amount"

                                    className="
                                        w-full
                                        rounded-lg
                                        border
                                        border-slate-300
                                        bg-white
                                        px-3
                                        py-2.5
                                        text-sm
                                        outline-none
                                        focus:border-blue-500
                                        focus:ring-2
                                        focus:ring-blue-100
                                    "
                                />

                            </div>
                        )}

                    </div>


                    {paymentType === "PARTIAL" && (

                        <div
                            className="
                                mt-4
                                rounded-lg
                                bg-amber-50
                                px-4
                                py-3
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                "
                            >

                                <span
                                    className="
                                        text-sm
                                        text-slate-600
                                    "
                                >
                                    Customer Due
                                </span>


                                <span
                                    className="
                                        font-semibold
                                        text-red-600
                                    "
                                >
                                    ₹
                                    {customerDue.toFixed(2)}
                                </span>

                            </div>

                        </div>
                    )}


                    {paymentType === "CREDIT" && (

                        <div
                            className="
                                mt-4
                                rounded-lg
                                bg-amber-50
                                px-4
                                py-3
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                "
                            >

                                <span
                                    className="
                                        text-sm
                                        text-slate-600
                                    "
                                >
                                    Customer Due
                                </span>


                                <span
                                    className="
                                        font-semibold
                                        text-red-600
                                    "
                                >
                                    ₹
                                    {totalAmount.toFixed(2)}
                                </span>

                            </div>

                        </div>
                    )}


                    {(
                        paymentType === "CREDIT" ||
                        paymentType === "PARTIAL"
                    ) &&
                        !customerId && (

                            <p
                                className="
                                    mt-3
                                    text-sm
                                    text-amber-600
                                "
                            >
                                Select or create a customer to record the amount due.
                            </p>
                        )}

                </div>


                {/* ==================================
                    PRODUCTS HEADER
                ================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                    "
                >

                    <h3
                        className="
                            text-lg
                            font-semibold
                            text-slate-800
                        "
                    >
                        Products
                    </h3>


                    <span
                        className="
                            text-sm
                            text-slate-500
                        "
                    >

                        {items.length}

                        {" product"}

                        {items.length !== 1
                            ? "s"
                            : ""
                        }

                    </span>

                </div>


                {/* ==================================
                    PRODUCT ITEMS
                ================================== */}

                {items.map(
                    (item, index) => {

                        const suggestions =
                            getSuggestions(
                                item.search,
                                item.product_id
                            );


                        return (

                            <div
                                key={index}

                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    p-4
                                "
                            >

                                <div
                                    className="
                                        grid
                                        grid-cols-1
                                        gap-4
                                        md:grid-cols-12
                                    "
                                >

                                    {/* PRODUCT */}

                                    <div
                                        className="
                                            relative
                                            md:col-span-5
                                        "
                                    >

                                        <label
                                            className="
                                                mb-1.5
                                                block
                                                text-sm
                                                font-medium
                                                text-slate-700
                                            "
                                        >
                                            Product
                                        </label>


                                        <input
                                            type="text"

                                            value={
                                                item.search
                                            }

                                            onChange={(
                                                event
                                            ) =>
                                                handleSearchChange(
                                                    index,
                                                    event.target.value
                                                )
                                            }

                                            placeholder="Search by product name or ID..."

                                            autoComplete="off"

                                            className="
                                                w-full
                                                rounded-lg
                                                border
                                                border-slate-300
                                                bg-white
                                                px-3
                                                py-2.5
                                                text-sm
                                                outline-none
                                                focus:border-blue-500
                                                focus:ring-2
                                                focus:ring-blue-100
                                            "
                                        />


                                        {/* SUGGESTIONS */}

                                        {item.search &&
                                            !item.product_id &&
                                            suggestions.length > 0 && (

                                                <div
                                                    className="
                                                        absolute
                                                        left-0
                                                        right-0
                                                        top-full
                                                        z-30
                                                        mt-1
                                                        max-h-56
                                                        overflow-y-auto
                                                        rounded-lg
                                                        border
                                                        border-slate-200
                                                        bg-white
                                                        shadow-lg
                                                    "
                                                >

                                                    {suggestions.map(
                                                        (product) => (

                                                            <button
                                                                key={
                                                                    product.id
                                                                }

                                                                type="button"

                                                                onClick={() =>
                                                                    handleSelectProduct(
                                                                        index,
                                                                        product
                                                                    )
                                                                }

                                                                className="
                                                                    flex
                                                                    w-full
                                                                    items-center
                                                                    justify-between
                                                                    px-4
                                                                    py-3
                                                                    text-left
                                                                    hover:bg-slate-50
                                                                "
                                                            >

                                                                <div>

                                                                    <p
                                                                        className="
                                                                            text-sm
                                                                            font-medium
                                                                            text-slate-800
                                                                        "
                                                                    >
                                                                        {product.name}
                                                                    </p>


                                                                    <p
                                                                        className="
                                                                            text-xs
                                                                            text-slate-500
                                                                        "
                                                                    >
                                                                        ID: {product.id}
                                                                    </p>

                                                                </div>


                                                                <div
                                                                    className="
                                                                        text-right
                                                                    "
                                                                >

                                                                    <p
                                                                        className="
                                                                            text-sm
                                                                            font-semibold
                                                                            text-slate-700
                                                                        "
                                                                    >
                                                                        ₹
                                                                        {Number(
                                                                            product.selling_price || 0
                                                                        ).toFixed(2)}
                                                                    </p>


                                                                    <p
                                                                        className="
                                                                            text-xs
                                                                            text-slate-500
                                                                        "
                                                                    >
                                                                        Stock:{" "}
                                                                        {product.quantity}
                                                                    </p>

                                                                </div>

                                                            </button>
                                                        )
                                                    )}

                                                </div>
                                            )}

                                    </div>


                                    {/* SELLING PRICE */}

                                    <div
                                        className="
                                            md:col-span-2
                                        "
                                    >

                                        <label
                                            className="
                                                mb-1.5
                                                block
                                                text-sm
                                                font-medium
                                                text-slate-700
                                            "
                                        >
                                            Selling Price
                                        </label>


                                        <div
                                            className="
                                                rounded-lg
                                                border
                                                border-slate-200
                                                bg-slate-100
                                                px-3
                                                py-2.5
                                                text-sm
                                                text-slate-700
                                            "
                                        >

                                            {item.product_id
                                                ? `₹${Number(
                                                    item.selling_price
                                                ).toFixed(2)}`
                                                : "-"
                                            }

                                        </div>

                                    </div>


                                    {/* STOCK */}

                                    <div
                                        className="
                                            md:col-span-2
                                        "
                                    >

                                        <label
                                            className="
                                                mb-1.5
                                                block
                                                text-sm
                                                font-medium
                                                text-slate-700
                                            "
                                        >
                                            Available
                                        </label>


                                        <div
                                            className="
                                                rounded-lg
                                                border
                                                border-slate-200
                                                bg-slate-100
                                                px-3
                                                py-2.5
                                                text-sm
                                                text-slate-700
                                            "
                                        >

                                            {item.product_id
                                                ? item.available_quantity
                                                : "-"
                                            }

                                        </div>

                                    </div>


                                    {/* QUANTITY */}

                                    <div
                                        className="
                                            md:col-span-2
                                        "
                                    >

                                        <label
                                            className="
                                                mb-1.5
                                                block
                                                text-sm
                                                font-medium
                                                text-slate-700
                                            "
                                        >
                                            Quantity
                                        </label>


                                        <input
                                            type="number"

                                            min="1"

                                            max={
                                                item.available_quantity ||
                                                undefined
                                            }

                                            value={
                                                item.quantity
                                            }

                                            onChange={(
                                                event
                                            ) =>
                                                handleQuantityChange(
                                                    index,
                                                    event.target.value
                                                )
                                            }

                                            disabled={
                                                !item.product_id
                                            }

                                            className="
                                                w-full
                                                rounded-lg
                                                border
                                                border-slate-300
                                                bg-white
                                                px-3
                                                py-2.5
                                                text-sm
                                                outline-none
                                                focus:border-blue-500
                                                focus:ring-2
                                                focus:ring-blue-100
                                                disabled:cursor-not-allowed
                                                disabled:bg-slate-100
                                            "
                                        />

                                    </div>


                                    {/* REMOVE */}

                                    <div
                                        className="
                                            flex
                                            items-end
                                            md:col-span-1
                                        "
                                    >

                                        <button
                                            type="button"

                                            onClick={() =>
                                                handleRemoveProduct(
                                                    index
                                                )
                                            }

                                            disabled={
                                                items.length === 1
                                            }

                                            className="
                                                w-full
                                                rounded-lg
                                                border
                                                border-red-200
                                                px-3
                                                py-2.5
                                                text-sm
                                                font-medium
                                                text-red-600
                                                hover:bg-red-50
                                                disabled:cursor-not-allowed
                                                disabled:opacity-40
                                            "
                                        >
                                            Remove
                                        </button>

                                    </div>

                                </div>


                                {/* SUBTOTAL */}

                                {item.product_id && (

                                    <div
                                        className="
                                            mt-3
                                            flex
                                            justify-end
                                        "
                                    >

                                        <p
                                            className="
                                                text-sm
                                                text-slate-600
                                            "
                                        >

                                            Subtotal:

                                            <span
                                                className="
                                                    ml-2
                                                    font-semibold
                                                    text-slate-800
                                                "
                                            >
                                                ₹
                                                {getSubtotal(
                                                    item
                                                ).toFixed(2)}
                                            </span>

                                        </p>

                                    </div>
                                )}

                            </div>
                        );
                    }
                )}


                {/* ==================================
                    ADD PRODUCT
                ================================== */}

                <button
                    type="button"

                    onClick={
                        handleAddProduct
                    }

                    className="
                        rounded-lg
                        border
                        border-blue-200
                        bg-blue-50
                        px-4
                        py-2.5
                        text-sm
                        font-semibold
                        text-blue-600
                        hover:bg-blue-100
                    "
                >
                    + Add Product
                </button>


                {/* ==================================
                    TOTAL
                ================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        rounded-xl
                        bg-slate-800
                        px-5
                        py-4
                        text-white
                    "
                >

                    <span
                        className="
                            text-sm
                            font-medium
                        "
                    >
                        Total Amount
                    </span>


                    <span
                        className="
                            text-xl
                            font-bold
                        "
                    >
                        ₹
                        {totalAmount.toFixed(2)}
                    </span>

                </div>


                {/* ==================================
                    PAYMENT SUMMARY
                ================================== */}

                {(
                    paymentType === "PARTIAL" ||
                    paymentType === "CREDIT"
                ) && customerId && (

                    <div
                        className="
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            p-4
                        "
                    >

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                            "
                        >

                            <span
                                className="
                                    text-sm
                                    text-slate-600
                                "
                            >
                                Customer Balance Added
                            </span>


                            <span
                                className="
                                    text-lg
                                    font-bold
                                    text-red-600
                                "
                            >
                                ₹
                                {customerDue.toFixed(2)}
                            </span>

                        </div>

                    </div>
                )}

            </div>

        </CrudForm>
    );
}


export default SaleForm;