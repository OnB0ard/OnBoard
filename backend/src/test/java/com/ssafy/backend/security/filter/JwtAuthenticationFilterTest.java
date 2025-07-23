package com.ssafy.backend.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.backend.security.dto.JwtUserInfo;
import com.ssafy.backend.security.entity.TokenType;
import com.ssafy.backend.security.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Authorization 헤더가 없는 경우 인증 없이 필터 체인을 계속 진행한다")
    void noAuthorizationHeader() throws Exception {
        // given
        when(request.getHeader("Authorization")).thenReturn(null);

        // when
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // then
        verify(filterChain, times(1)).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Bearer 형식이 아닌 Authorization 헤더인 경우 인증 없이 필터 체인을 계속 진행한다")
    void invalidAuthorizationHeaderFormat() throws Exception {
        // given
        when(request.getHeader("Authorization")).thenReturn("Invalid Token");

        // when
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // then
        verify(filterChain, times(1)).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("유효하지 않은 토큰인 경우 401 응답을 반환하고 필터 체인을 중단한다")
    void invalidToken() throws Exception {
        // given
        String token = "invalid.token.value";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtUtil.validateToken(token, TokenType.ACCESS)).thenReturn(false);

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        // when
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // then
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(response).setContentType("application/json; charset=UTF-8");
        verify(filterChain, never()).doFilter(request, response);

        String responseBody = stringWriter.toString();
        assertTrue(responseBody.contains("TOKEN-01"));
        assertTrue(responseBody.contains("세션이 만료되었습니다"));
    }

    @Test
    @DisplayName("유효한 토큰인 경우 인증 정보를 설정하고 필터 체인을 계속 진행한다")
    void validToken() throws Exception {
        // given
        String token = "valid.token.value";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtUtil.validateToken(token, TokenType.ACCESS)).thenReturn(true);

        JwtUserInfo userInfo = new JwtUserInfo(1L, "test@example.com", "");
        when(jwtUtil.getUserInfoFromToken(token)).thenReturn(userInfo);

        // when
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // then
        verify(filterChain, times(1)).doFilter(request, response);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(authentication);
        assertEquals(userInfo, authentication.getPrincipal());
        assertTrue(authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_USER")));
    }
}