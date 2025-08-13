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
public class UserExceptionHandler {
    @ExceptionHandler(GoogleOauthException.class)
    public CommonResponse<ErrorBody> keyNotCreatedException(GoogleOauthException e, HttpServletRequest request) {
        log.warn("USER-001> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("USER-001", "구글 로그인에 실패하였습니다."),
                HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(NotYourAccountException.class)
    public CommonResponse<ErrorBody> NotYourAccountException(NotYourAccountException e, HttpServletRequest request) {
        log.warn("USER-002> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("USER-002", "본인의 계정이 아닙니다."),
                HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(IllegalFileExtensionException.class)
    public CommonResponse<ErrorBody> IllegalFileExtensionException(IllegalFileExtensionException e, HttpServletRequest request) {
        log.warn("USER-003> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("USER-003", "이미지 파일의 확장자는 PNG, JPEG 형식만 가능합니다."),
                HttpStatus.BAD_REQUEST);
    }
}
