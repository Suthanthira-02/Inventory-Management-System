import { LoginProvider } from "../contexts/LoginContext";
import LoginPageView from "../components/LoginPageView";

export default function Login() {
    return <LoginProvider><LoginPageView /></LoginProvider>;
}
