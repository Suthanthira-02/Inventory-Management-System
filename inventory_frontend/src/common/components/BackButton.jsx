import { useNavigate } from "react-router-dom";

function BackButton({
    to = "/dashboard",
    label = "Dashboard",
}) {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            onClick={() => navigate(to)}
            className="
                rounded-xl
                border
                border-slate-300
                bg-white
                px-5
                py-3
                text-sm
                font-semibold
                text-slate-700
                shadow-sm
                transition
                hover:bg-slate-50
                hover:shadow
            "
        >
            ← {label}
        </button>
    );
}

export default BackButton;