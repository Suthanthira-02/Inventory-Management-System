import DashboardStats from "../components/DashboardStats";
import useDashboard from "../hooks/useDashboard";


function Dashboard() {

    const username =
        localStorage.getItem("user") || "Admin";


    const {
        recentActivity
    } = useDashboard();


    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {

        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/";
    };


    return (

        <div className="min-h-screen bg-slate-100">

            {/* =========================
                SIDEBAR
            ========================= */}

            <aside
                className="
                    fixed
                    left-0
                    top-0
                    z-40
                    flex
                    h-screen
                    w-20
                    flex-col
                    bg-slate-900
                    text-white
                    sm:w-56
                    lg:w-64
                "
            >

                {/* =========================
                    LOGO
                ========================= */}

                <div
                    className="
                        flex
                        h-20
                        shrink-0
                        items-center
                        justify-center
                        border-b
                        border-slate-700
                        px-3
                        sm:justify-start
                        sm:px-5
                        lg:px-6
                    "
                >

                    <div
                        className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-blue-600
                            text-xl
                        "
                    >
                        📦
                    </div>


                    <div className="ml-3 hidden sm:block">

                        <h1 className="text-sm font-bold tracking-wide">
                            INVENTORY
                        </h1>

                        <p className="text-xs tracking-widest text-blue-400">
                            MANAGEMENT
                        </p>

                    </div>

                </div>


                {/* =========================
                    NAVIGATION
                ========================= */}

                <nav
                    className="
                        mt-6
                        flex-1
                        overflow-y-auto
                        px-2
                        sm:px-3
                        lg:px-4
                    "
                >

                    {/* DASHBOARD */}

                    <a
                        href="/dashboard"
                        title="Dashboard"
                        className="
                            mb-2
                            flex
                            items-center
                            justify-center
                            gap-3
                            rounded-lg
                            bg-blue-600
                            px-3
                            py-3
                            text-sm
                            font-medium
                            sm:justify-start
                            sm:px-4
                        "
                    >

                        <span className="shrink-0">
                            📊
                        </span>

                        <span className="hidden sm:inline">
                            Dashboard
                        </span>

                    </a>


                    {/* PRODUCTS */}

                    <a
                        href="/products"
                        title="Products"
                        className="
                            mb-2
                            flex
                            items-center
                            justify-center
                            gap-3
                            rounded-lg
                            px-3
                            py-3
                            text-sm
                            font-medium
                            text-slate-300
                            transition
                            hover:bg-slate-800
                            hover:text-white
                            sm:justify-start
                            sm:px-4
                        "
                    >

                        <span className="shrink-0">
                            📦
                        </span>

                        <span className="hidden sm:inline">
                            Products
                        </span>

                    </a>


                    {/* SUPPLIERS */}

                    <a
                        href="/suppliers"
                        title="Suppliers"
                        className="
                            mb-2
                            flex
                            items-center
                            justify-center
                            gap-3
                            rounded-lg
                            px-3
                            py-3
                            text-sm
                            font-medium
                            text-slate-300
                            transition
                            hover:bg-slate-800
                            hover:text-white
                            sm:justify-start
                            sm:px-4
                        "
                    >

                        <span className="shrink-0">
                            🏢
                        </span>

                        <span className="hidden sm:inline">
                            Suppliers
                        </span>

                    </a>


                    {/* =========================
                        CUSTOMERS
                    ========================= */}

                    <a
                        href="/customers"
                        title="Customers"
                        className="
                            mb-2
                            flex
                            items-center
                            justify-center
                            gap-3
                            rounded-lg
                            px-3
                            py-3
                            text-sm
                            font-medium
                            text-slate-300
                            transition
                            hover:bg-slate-800
                            hover:text-white
                            sm:justify-start
                            sm:px-4
                        "
                    >

                        <span className="shrink-0">
                            👥
                        </span>

                        <span className="hidden sm:inline">
                            Customers
                        </span>

                    </a>


                    {/* PURCHASES */}

                    <a
                        href="/purchases"
                        title="Purchases"
                        className="
                            mb-2
                            flex
                            items-center
                            justify-center
                            gap-3
                            rounded-lg
                            px-3
                            py-3
                            text-sm
                            font-medium
                            text-slate-300
                            transition
                            hover:bg-slate-800
                            hover:text-white
                            sm:justify-start
                            sm:px-4
                        "
                    >

                        <span className="shrink-0">
                            🛒
                        </span>

                        <span className="hidden sm:inline">
                            Purchases
                        </span>

                    </a>


                    {/* SALES */}

                    <a
                        href="/sales"
                        title="Sales"
                        className="
                            mb-2
                            flex
                            items-center
                            justify-center
                            gap-3
                            rounded-lg
                            px-3
                            py-3
                            text-sm
                            font-medium
                            text-slate-300
                            transition
                            hover:bg-slate-800
                            hover:text-white
                            sm:justify-start
                            sm:px-4
                        "
                    >

                        <span className="shrink-0">
                            💰
                        </span>

                        <span className="hidden sm:inline">
                            Sales
                        </span>

                    </a>


                    {/* REPORTS */}

                    <a
                        href="/reports"
                        title="Reports"
                        className="
                            mb-2
                            flex
                            items-center
                            justify-center
                            gap-3
                            rounded-lg
                            px-3
                            py-3
                            text-sm
                            font-medium
                            text-slate-300
                            transition
                            hover:bg-slate-800
                            hover:text-white
                            sm:justify-start
                            sm:px-4
                        "
                    >

                        <span className="shrink-0">
                            📈
                        </span>

                        <span className="hidden sm:inline">
                            Reports
                        </span>

                    </a>

                </nav>


                {/* =========================
                    LOGOUT
                ========================= */}

                <div
                    className="
                        shrink-0
                        px-2
                        pb-4
                        sm:px-3
                        lg:px-4
                    "
                >

                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="
                            flex
                            w-full
                            items-center
                            justify-center
                            gap-3
                            rounded-lg
                            px-3
                            py-3
                            text-sm
                            font-medium
                            text-slate-300
                            transition
                            hover:bg-red-500/10
                            hover:text-red-400
                            sm:justify-start
                            sm:px-4
                        "
                    >

                        <span className="shrink-0">
                            🚪
                        </span>

                        <span className="hidden sm:inline">
                            Logout
                        </span>

                    </button>

                </div>

            </aside>


            {/* =========================
                MAIN CONTENT
            ========================= */}

            <main
                className="
                    ml-20
                    min-h-screen
                    sm:ml-56
                    lg:ml-64
                "
            >

                {/* =========================
                    HEADER
                ========================= */}

                <header
                    className="
                        flex
                        min-h-20
                        items-center
                        justify-between
                        gap-3
                        border-b
                        border-slate-200
                        bg-white
                        px-4
                        py-4
                        shadow-sm
                        sm:px-6
                        lg:px-8
                    "
                >

                    <div className="min-w-0">

                        <h1
                            className="
                                truncate
                                text-lg
                                font-bold
                                text-slate-800
                                sm:text-xl
                            "
                        >
                            Dashboard
                        </h1>

                        <p
                            className="
                                mt-1
                                hidden
                                text-sm
                                text-slate-500
                                sm:block
                            "
                        >
                            Overview of your inventory
                        </p>

                    </div>


                    {/* USER */}

                    <div
                        className="
                            flex
                            shrink-0
                            items-center
                            gap-2
                            sm:gap-3
                        "
                    >

                        <div className="hidden text-right sm:block">

                            <p className="text-sm font-semibold text-slate-800">
                                {username}
                            </p>

                            <p className="text-xs text-slate-500">
                                Administrator
                            </p>

                        </div>


                        <div
                            className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-full
                                bg-blue-100
                                text-sm
                                font-bold
                                text-blue-700
                                sm:h-10
                                sm:w-10
                                sm:text-base
                            "
                        >
                            {username
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                    </div>

                </header>


                {/* =========================
                    PAGE CONTENT
                ========================= */}

                <div
                    className="
                        p-4
                        sm:p-6
                        lg:p-8
                    "
                >

                    {/* =========================
                        WELCOME
                    ========================= */}

                    <div className="mb-6 sm:mb-7">

                        <h2
                            className="
                                text-xl
                                font-bold
                                text-slate-800
                                sm:text-2xl
                            "
                        >
                            Welcome, {username} 👋
                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >
                            Here's what's happening with your
                            inventory today.
                        </p>

                    </div>


                    {/* =========================
                        STATISTICS
                    ========================= */}

                    <DashboardStats />


                    {/* =========================
                        RECENT ACTIVITY
                    ========================= */}

                    <div
                        className="
                            mt-6
                            overflow-hidden
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            shadow-sm
                            sm:mt-7
                        "
                    >

                        {/* HEADER */}

                        <div
                            className="
                                border-b
                                border-slate-200
                                px-4
                                py-4
                                sm:px-6
                                sm:py-5
                            "
                        >

                            <h2 className="font-bold text-slate-800">
                                Recent Activity
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Your latest purchases and sales.
                            </p>

                        </div>


                        {/* =========================
                            NO ACTIVITY
                        ========================= */}

                        {recentActivity.length === 0 ? (

                            <div
                                className="
                                    flex
                                    min-h-48
                                    items-center
                                    justify-center
                                    px-4
                                    sm:px-6
                                "
                            >

                                <div className="text-center">

                                    <div className="text-4xl">
                                        📋
                                    </div>

                                    <p
                                        className="
                                            mt-3
                                            font-medium
                                            text-slate-600
                                        "
                                    >
                                        No recent activity
                                    </p>

                                    <p
                                        className="
                                            mt-1
                                            text-sm
                                            text-slate-400
                                        "
                                    >
                                        Start adding purchases and sales.
                                    </p>

                                </div>

                            </div>

                        ) : (

                            /* =========================
                               ACTIVITY LIST
                            ========================= */

                            <div className="divide-y divide-slate-100">

                                {recentActivity.map(
                                    (activity) => (

                                        <div
                                            key={activity.id}
                                            className="
                                                flex
                                                flex-col
                                                gap-3
                                                px-4
                                                py-4
                                                transition
                                                hover:bg-slate-50
                                                sm:flex-row
                                                sm:items-center
                                                sm:justify-between
                                                sm:px-6
                                            "
                                        >

                                            {/* ACTIVITY INFORMATION */}

                                            <div
                                                className="
                                                    flex
                                                    min-w-0
                                                    items-center
                                                    gap-3
                                                    sm:gap-4
                                                "
                                            >

                                                <div
                                                    className={`
                                                        flex
                                                        h-10
                                                        w-10
                                                        shrink-0
                                                        items-center
                                                        justify-center
                                                        rounded-xl
                                                        text-lg
                                                        sm:h-11
                                                        sm:w-11
                                                        ${
                                                            activity.type ===
                                                            "Purchase"
                                                                ? "bg-blue-50"
                                                                : "bg-green-50"
                                                        }
                                                    `}
                                                >

                                                    {activity.type ===
                                                    "Purchase"
                                                        ? "🛒"
                                                        : "💰"}

                                                </div>


                                                <div className="min-w-0">

                                                    <p
                                                        className="
                                                            font-semibold
                                                            text-slate-800
                                                        "
                                                    >
                                                        {activity.type}
                                                    </p>


                                                    {/* FIXED PRODUCT COUNT */}

                                                    <p
                                                        className="
                                                            mt-1
                                                            text-xs
                                                            text-slate-500
                                                        "
                                                    >

                                                        {activity.productCount}

                                                        {" "}

                                                        product

                                                        {activity.productCount !==
                                                        1
                                                            ? "s"
                                                            : ""}

                                                    </p>

                                                </div>

                                            </div>


                                            {/* =========================
                                                AMOUNT + DATE
                                            ========================= */}

                                            <div
                                                className="
                                                    pl-13
                                                    sm:pl-0
                                                    sm:text-right
                                                "
                                            >

                                                <p
                                                    className="
                                                        font-bold
                                                        text-slate-800
                                                    "
                                                >
                                                    ₹
                                                    {Number(
                                                        activity.amount
                                                    ).toFixed(2)}
                                                </p>


                                                <p
                                                    className="
                                                        mt-1
                                                        text-xs
                                                        text-slate-400
                                                    "
                                                >

                                                    {activity.date
                                                        ? new Date(
                                                            activity.date
                                                        ).toLocaleString()
                                                        : "-"}

                                                </p>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>

                </div>

            </main>

        </div>
    );
}


export default Dashboard;