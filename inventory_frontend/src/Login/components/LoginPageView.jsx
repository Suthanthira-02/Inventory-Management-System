import LoginForm from "./LoginForm";
import loginBackground from "../../assets/login-bg.jpg";

export default function LoginPageView() {
    return (
        <div className="min-h-screen w-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${loginBackground})` }}>
            <div className="flex min-h-screen w-full items-center justify-center bg-black/40 px-4 py-8">
                <LoginForm />
            </div>
        </div>
    );
}
