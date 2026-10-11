function AddButton({
    onClick,
    children = "Add",
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="
                rounded-xl
                bg-blue-700
                px-6
                py-3
                text-sm
                font-bold
                text-white
                shadow-sm
                transition
                hover:bg-blue-800
                hover:shadow-md
            "
        >
            + {children}
        </button>
    );
}

export default AddButton;