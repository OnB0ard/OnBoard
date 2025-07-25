package com.ssafy.backend.user.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.user.dto.request.LoginRequestDTO;
import com.ssafy.backend.user.dto.request.LogoutRequestDTO;
import com.ssafy.backend.user.dto.response.AccessTokenResponseDTO;
import com.ssafy.backend.user.dto.response.LoginResponseDTO;
import com.ssafy.backend.user.service.UserAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user")
public class UserAuthController {

    private final UserAuthService userAuthService;

    @Value("${jwt.refresh-token.expiration}")
    private int refreshTokenMaxAge;

    @PostMapping("/login")
    @PreAuthorize("permitAll()")
    public CommonResponse<LoginResponseDTO> login(@RequestBody LoginRequestDTO loginRequestDTO) {
        LoginResponseDTO userInfo = userAuthService.login(loginRequestDTO);
        ResponseCookie cookie = ResponseCookie.from("refreshToken", userInfo.getRefreshToken())
                .domain("http://localhost:5173/")
                .httpOnly(true)
                .secure(true)
                .path("")
                .maxAge(refreshTokenMaxAge) // 30 days
                .sameSite("None")
                .build();

        return CommonResponse.<LoginResponseDTO>builder()
                .body(userInfo)
                .cookie(cookie)
                .build();
    }

    @PostMapping("/logout")
    @PreAuthorize("permitAll()")
    public CommonResponse<SuccessResponseDTO> logout(@RequestBody LogoutRequestDTO logoutRequestDTO) {
        // 쿠키 삭제를 위한 ResponseCookie 생성
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .domain("http://localhost:5173/")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0) // 쿠키 삭제
                .sameSite("None")
                .build();

        return CommonResponse.<SuccessResponseDTO>builder()
                .body(new SuccessResponseDTO(userAuthService.logout(logoutRequestDTO)))
                .cookie(cookie)
                .status(HttpStatus.OK)
                .build();
    }

    @GetMapping("/refresh")
    @PreAuthorize("permitAll()")
    public CommonResponse<AccessTokenResponseDTO> refresh(@CookieValue("refreshToken") String refreshToken) {
        return new CommonResponse<>(userAuthService.reissueAccessToken(refreshToken), HttpStatus.OK);
    }

}
