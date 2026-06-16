import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status == 401 && typeof window !== "undefined") {
      const path = window.location.pathname;

      if (path !== "/sign-in" && path !== "/sign-up") {
        window.location.href = "/sign-in";
      }
    }
    return Promise.reject(error); 
  },
);
