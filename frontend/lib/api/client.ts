import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL:
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // ✅ Отправлять куки
    });

    // Интерсептор для добавления access токена
    this.client.interceptors.request.use(
      (config) => {
        const accessToken = this.getAccessToken();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        // ✅ Если данные это FormData — убираем Content-Type (браузер сам добавит)
        if (config.data instanceof FormData) {
          delete config.headers["Content-Type"];
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Интерсептор для обновления токена
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const response = await this.client.post("/auth/refresh/");
            const newAccessToken = response.data.access;
            this.setAccessToken(newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = "/auth/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  }

  private setAccessToken(token: string): void {
    localStorage.setItem("access_token", token);
  }

  private clearTokens(): void {
    localStorage.removeItem("access_token");
  }

  async login(email: string, password: string): Promise<{ user: any }> {
    const response = await this.client.post("/auth/login/", {
      email,
      password,
    });
    const { access, user } = response.data;
    this.setAccessToken(access);
    return { user };
  }

  async logout(): Promise<void> {
    try {
      await this.client.post("/auth/logout/");
    } catch (error) {
      console.error("Logout error:", error);
    }
    this.clearTokens();
    window.location.href = "/";
  }

  // ✅ GET с параметрами
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  // ✅ POST с поддержкой FormData
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  // ✅ PUT с поддержкой FormData
  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  // ✅ PATCH с поддержкой FormData
  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  // ✅ DELETE с параметрами
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
