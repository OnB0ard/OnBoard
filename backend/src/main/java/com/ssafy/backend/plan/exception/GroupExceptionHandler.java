package com.ssafy.backend.plan.exception;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.ErrorBody;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GroupExceptionHandler {
    @ExceptionHandler(UserPlanExistException.class)
    public CommonResponse<ErrorBody> UserPlanExistException(UserPlanExistException e, HttpServletRequest request) {
        log.warn("GROUP-011> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("GROUP-011", "이미 그룹에 있는 사용자입니다."),
                HttpStatus.BAD_REQUEST);
    }
}