package com.ssafy.backend.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
//                .allowedOrigins("http://localhost:5173") // 프론트 주소
                .allowedOrigins("*") // 프론트 주소
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true); // JWT 쿠키 등 허용 시 필요
    }
}