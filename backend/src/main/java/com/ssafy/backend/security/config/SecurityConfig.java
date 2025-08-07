package com.ssafy.backend.security.config;

import com.ssafy.backend.security.filter.JwtAuthenticationFilter;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@AllArgsConstructor
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtFilter;

    /**
     * 비밀번호 인코더(bcrypt 기본)
     * @return BCryptPasswordEncoder
     */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * rest 형식 인증을 위해 authenticationManager 빈 등록
     * @param config AuthenticationConfiguration
     * @return AuthenticationManager
     * @throws Exception 인증 매니저 설정 중 발생할 수 있는 예외
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Spring Security 필터 체인 설정
     * @param http HttpSecurity 객체
     * @return SecurityFilterChain
     * @throws Exception HTTP 보안 설정 중 발생할 수 있는 예외
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // JWT 사용을 위한 기본 설정
        http.csrf(AbstractHttpConfigurer::disable) // CSRF 토큰 필요 없음
                .cors(Customizer.withDefaults()); // 기본 CORS 정책 사용

        // JWT로 대체되므로 비활성화
        http.formLogin(AbstractHttpConfigurer::disable); // 폼 로그인 비활성화
        http.httpBasic(AbstractHttpConfigurer::disable); // HTTP Basic 인증 비활성화
        http.logout(AbstractHttpConfigurer::disable); // 기본 로그아웃 비활성화

        // JWT는 세션 생성 X
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

//        http.authorizeHttpRequests(authorize -> authorize
//                .anyRequest().permitAll()
//        );
        http.authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/ws/**").permitAll() // ✅ WebSocket 연결 허용
                .requestMatchers("/topic/**").permitAll() // ✅ 구독 주소도 허용
                .requestMatchers("/app/**").permitAll()   // ✅ 메시지 발행 주소 허용
                .anyRequest().permitAll()
        );
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
