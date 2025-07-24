import axios from 'axios';
import { useAuthStore } from "@/store/useAuthStore";

// 커스텀 훅 없이 순수 상태 접근용 getter 함수 (권장 방식)
let accessTokenGetter = () => null;
export const setAccessTokenGetter = (getterFn) => {
  accessTokenGetter = getterFn;
};

const apiClient = axios.create({
  baseURL: "http://i13a504.p.ssafy.io:8080/api/v1/",
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

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

// 응답 인터셉터: API 응답을 받은 후에 실행
apiClient.interceptors.response.use(
  (response) => {
    // 성공 응답은 그대로 반환
    return response;
  },
  (error) => {
    // 401 Unauthorized 에러 시 로그인 페이지로 이동
    if (error.response && error.response.status === 401) {
      console.error('인증이 만료되었습니다. 다시 로그인해주세요.');
      // window.location.href = '/login'; // 실제 프로젝트에서는 이렇게 처리
    }
    return Promise.reject(error);
  }
);

export default apiClient;