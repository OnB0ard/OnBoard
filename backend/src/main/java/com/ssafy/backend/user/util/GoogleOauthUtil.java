package com.ssafy.backend.user.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.backend.user.dto.GoogleUserInfoDTO;
import com.ssafy.backend.user.exception.GoogleOauthException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Slf4j
@Component
public class GoogleOauthUtil {
    private static String GOOGLE_OAUTH_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

    public GoogleUserInfoDTO getGoogleUserInfo(String accessToken) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(java.net.URI.create(GOOGLE_OAUTH_URL))
                    .header("Authorization", "Bearer " + accessToken)
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.error("구글 인증정보 조회 실패: {}", response.body());
                throw new RuntimeException("구글 인증과정 오류");
            }

            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.readValue(response.body(), GoogleUserInfoDTO.class);
        } catch (Exception e) {
            log.error("구글 인증정보를 조회하는 과정에서 에러가 발생하였습니다. : {}", e.getMessage());
            throw new GoogleOauthException("구글 인증과정 오류");
        }
    }
}
