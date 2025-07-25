package com.ssafy.backend.user.exception;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.ErrorBody;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class UserAuthExceptionHandler {
    @ExceptionHandler(RefreshTokenInvalidException.class)
    public CommonResponse<ErrorBody> refreshTokenInvalidException(RefreshTokenInvalidException e, HttpServletRequest request) {
        log.warn("AUTH-001> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("AUTH-001", "Acess Token 재발급에 실패하였습니다."),
                HttpStatus.UNAUTHORIZED);
    }
}
