import { useCallback } from "react";
import { loginWithGoogle } from "@/apis/authApi";
import { useAuthStore } from "@/store/useAuthStore"; // Zustand 스토어 불러오기
import { setAccessTokenGetter } from "@/apis/apiClient"; // apiClient 토큰 getter 설정

export const useGoogleLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth); // 상태 업데이트 함수
  const getAccessToken = useAuthStore((state) => state.accessToken); // 토큰 getter

  return useCallback(() => {
    // const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const clientId = "406153969379-njhcgskl5tuv1utb2unqmvgoe4igjfe9.apps.googleusercontent.com";
    const redirectUri = `${window.location.origin}/popup.html`;
    const scope = "email profile openid";
    const state = Math.random().toString(36).substring(2);

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${encodeURIComponent(
      scope
    )}&state=${state}&prompt=select_account&include_granted_scopes=true`;

    const popup = window.open(oauthUrl, "googleOAuth", "width=500,height=600");

    const listener = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "OAUTH_SUCCESS") {
        const { access_token } = event.data.params;

        try {
          console.log("받은 access_token:", access_token);
          console.log("access_token 길이:", access_token?.length);
          
          const response = await loginWithGoogle(access_token);

          if (response.code === 200) {
            const data = response.body;

            // JWT 및 사용자 정보 저장
            setAuth({
              userId: data.userId,
              userName: data.userName,
              googleEmail: data.googleEmail,
              profileImage: data.profileImage,
              accessToken: data.accessToken,
              // refreshToken: data.refreshToken,
            });

            // apiClient에 토큰 getter 설정
            setAccessTokenGetter(() => data.accessToken);

            console.log("로그인 성공! 사용자 상태 저장 완료");
            console.log(data);

            // Show toast
            window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: '로그인 되었습니다!', type: 'success', duration: 2000 } }));
          } else {
            console.error("서버 응답 에러:", response);
          }
        } catch (e) {
          console.error("로그인 실패", e);
        }

        window.removeEventListener("message", listener);
        popup?.close();
      }
    };

    window.addEventListener("message", listener);
  }, [setAuth]);
};
