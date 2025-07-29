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

    @Value("${frontend.domain}")
    private String frontendDomain;


    @PostMapping("/login")
    @PreAuthorize("permitAll()")
    public CommonResponse<LoginResponseDTO> login(@RequestBody LoginRequestDTO loginRequestDTO) {
        LoginResponseDTO userInfo = userAuthService.login(loginRequestDTO);
        ResponseCookie cookie = ResponseCookie.from("refreshToken", userInfo.getRefreshToken())
//                .domain(frontendDomain)
                .httpOnly(true) 
                .secure(false)
                .path("/")
                .maxAge(refreshTokenMaxAge) // 30 days
                .sameSite("Lax")
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
//                .domain(frontendDomain)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0) // 쿠키 삭제
                .sameSite("Lax")
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
