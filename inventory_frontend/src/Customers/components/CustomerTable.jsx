import DataTable from "../../common/components/DataTable";
import EditButton from "../../common/components/EditButton";
import DeleteButton from "../../common/components/DeleteButton";

export default function CustomerTable({ customers, loading, error, onEdit, onDelete, onLedger }) {
    const columns = [
        { key: "id", label: "ID", align: "center", render: (customer, index) => index + 1 },
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        {
            key: "current_balance",
            label: "Balance",
            align: "right",
            render: (customer) => `₹${Number(customer.current_balance ?? customer.opening_balance ?? 0).toFixed(2)}`,
        },
        {
            key: "actions",
            label: "Actions",
            align: "center",
            render: (customer) => (
                <div className="flex justify-center gap-2">
                    <EditButton onClick={() => onEdit(customer)} />
                    <button
                        type="button"
                        className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                        onClick={() => onLedger(customer)}
                    >
                        Ledger
                    </button>
                    <DeleteButton onClick={() => onDelete(customer)} />
                </div>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={customers}
            loading={loading}
            error={error}
            emptyMessage="No customers found."
        />
    );
}
