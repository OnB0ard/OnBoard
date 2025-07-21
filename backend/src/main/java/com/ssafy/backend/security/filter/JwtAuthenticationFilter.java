package com.ssafy.backend.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.ErrorBody;
import com.ssafy.backend.security.entity.JwtUserInfo;
import com.ssafy.backend.security.entity.TokenType;
import com.ssafy.backend.security.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;


@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        //request에서 Authorization 헤더를 찾음
        String authorization = request.getHeader("Authorization");

        //Authorization 헤더 검증
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        //Bearer 부분 제거 후 순수 토큰만 획득
        String token = authorization.split(" ")[1];

        if (!jwtUtil.validateToken(token, TokenType.ACCESS)) {
            ErrorBody errorBody = new ErrorBody("TOKEN-01", "세션이 만료되었습니다. 다시 로그인해주세요.");
            CommonResponse<ErrorBody> errorResponse = new CommonResponse<>(errorBody, HttpStatus.UNAUTHORIZED);

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json; charset=UTF-8");
            response.getWriter().write(
                    new ObjectMapper().writeValueAsString(errorResponse)
            );
            response.getWriter().flush();
            return;
        }

        //토큰에서 userinfo 추출
        JwtUserInfo userInfo = jwtUtil.getUserInfoFromToken(token);

        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_USER") // 기본 사용자 권한 설정
        );

        // JwtUserInfo를 직접 Principal로 설정
        Authentication authToken = new UsernamePasswordAuthenticationToken(
                userInfo,
                null,
                authorities
        );

        SecurityContextHolder.getContext().setAuthentication(authToken);

        filterChain.doFilter(request, response);
    }
}