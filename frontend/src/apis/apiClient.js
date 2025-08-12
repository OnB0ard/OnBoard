// apiClient.js
import axios from 'axios';
import { useAuthStore } from "@/store/useAuthStore";

// 커스텀 훅 없이 순수 상태 접근용 getter 함수 (권장 방식)
let accessTokenGetter = () => null;
export const setAccessTokenGetter = (getterFn) => {
  accessTokenGetter = getterFn;
};

const apiClient = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL,
    baseURL: "https://i13a504.p.ssafy.io/api/v1/",

  timeout: 10000,
  headers: { },
});

// refresh
const refreshClient = axios.create({
  baseURL: "https://i13a504.p.ssafy.io/api/v1/",
  timeout: 10000,
  withCredentials: true, // 반드시 쿠키 포함
});

async function requestNewAccessToken() {
  const res = await refreshClient.get("refresh");
  const payload = res?.data;
  const token = payload?.body?.accessToken || payload?.accessToken;
  if (!token) throw new Error("No accessToken in refresh response");
  return token;
}

// 요청 인터셉터: API 요청을 보내기 전에 실행
apiClient.interceptors.request.use(
  (config) => {
    // 로그인 후 localStorage에 저장된 토큰 가져오기 (보안적으로 좋지 않다고 하여 Zustand 사용하여 store에 저장하는 방식으로 수정)
    // const token = localStorage.getItem('accessToken');

    const token = accessTokenGetter(); // Zustand로부터 토큰 가져오기
    
    // 토큰이 있으면 헤더에 자동으로 추가
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


let isRefreshing = false;
let subscribers = [];

const subscribeTokenRefresh = (cb) => subscribers.push(cb);
const onRefreshed = (token) => {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
};

// 응답 인터셉터: API 응답을 받은 후에 실행
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config: originalRequest } = error;
    if (!response) return Promise.reject(error);

    // 401만 처리, 무한루프 방지
    if (response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 동시에 여러 401 발생 시 첫 번째 요청만 refresh 호출
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await requestNewAccessToken();

          // 1) Zustand 갱신
          const { setAuth } = useAuthStore.getState();
          setAuth({ accessToken: newToken });

          // 2) apiClient가 읽을 getter 최신화
          setAccessTokenGetter(() => newToken);

          isRefreshing = false;
          onRefreshed(newToken);
        } catch (e) {
          isRefreshing = false;
          // 갱신 실패 → 인증 제거(선택)
          const { clearAuth } = useAuthStore.getState();
          clearAuth();
          return Promise.reject(e);
        }
      }

      // refresh 완료 후 원 요청 재시도
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;