import { useCallback } from "react";

export const useGoogleLogin = () => {
  return useCallback(() => {
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
          const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          const profile = await res.json();
          console.log("사용자 정보:", profile);
        } catch (e) {
          console.error("사용자 정보 요청 실패", e);
        }

        window.removeEventListener("message", listener);
        popup?.close();
      }
    };

    window.addEventListener("message", listener);
  }, []);
};
