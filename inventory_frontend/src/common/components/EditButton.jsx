function EditButton({
    onClick,
    children = "Edit",
    disabled = false,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="
                rounded-lg
                bg-blue-50
                px-3
                py-2
                text-xs
                font-bold
                text-blue-700
                transition
                hover:bg-blue-100
                disabled:cursor-not-allowed
                disabled:opacity-50
            "
        >
            {children}
        </button>
    );
}

export default EditButton;
