import api from "../../common/services/api";

export const loginUser = async (username, password) => {

    const response = await api.post(
        "/api/auth/login",
        {
            username,
            password,
        }
    );

    return response.data;
};