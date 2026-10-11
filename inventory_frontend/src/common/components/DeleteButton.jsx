function DeleteButton({
    onClick,
    children = "Delete",
    disabled = false,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="
                rounded-lg
                bg-red-50
                px-3
                py-2
                text-xs
                font-bold
                text-red-600
                transition
                hover:bg-red-100
                disabled:cursor-not-allowed
                disabled:opacity-50
            "
        >
            {children}
        </button>
    );
}

export default DeleteButton;
