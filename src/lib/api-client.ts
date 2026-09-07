import axios from "axios";

export class ApiError extends Error {
  code?: string;
  data?: Record<string, unknown>;

  constructor(message: string, code?: string, data?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.data = data;
  }
}

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
    "x-mcp-csrf": "1",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? "Unexpected error contacting the server.";
    return Promise.reject(new ApiError(message, error.response?.data?.code, error.response?.data));
  }
);
