package com.ssafy.backend.user.service;

import com.ssafy.backend.security.dto.TokenDTO;
import com.ssafy.backend.security.util.JwtUtil;
import com.ssafy.backend.user.dto.GoogleUserInfoDTO;
import com.ssafy.backend.user.dto.request.LoginRequestDTO;
import com.ssafy.backend.user.dto.response.LoginResponseDTO;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.repository.UserRepository;
import com.ssafy.backend.user.util.GoogleOauthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final GoogleOauthUtil googleOauth;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO) {

        GoogleUserInfoDTO googleUserInfo = googleOauth.getGoogleUserInfo(loginRequestDTO.getOauthToken());

        User user = userRepository.findByGoogleEmail(googleUserInfo.getEmail());
        if(user == null) {
            user = new User();
            user.setGoogleEmail(googleUserInfo.getEmail());
            user.setUserName(googleUserInfo.getName());
            user.setProfileImage("placeholder.png");
            userRepository.save(user);
        }

        TokenDTO accessToken = jwtUtil.generateAccessToken(user);
        TokenDTO refreshToken = jwtUtil.generateRefreshToken(user.getUserId());


        return LoginResponseDTO.builder()
                .userId(user.getUserId())
                .googleEmail(user.getGoogleEmail())
                .userName(user.getUserName())
                .accessToken(accessToken.getTokenString())
                .accessTokenExpireDate(accessToken.getExpireDate())
                .refreshToken(refreshToken.getTokenString())
                .refreshTokenExpireDate(refreshToken.getExpireDate())
                .build();
    }
}
