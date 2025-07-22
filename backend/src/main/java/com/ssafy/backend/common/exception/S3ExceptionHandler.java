package com.ssafy.backend.common.exception;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.ErrorBody;
import com.ssafy.backend.plan.exception.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class S3ExceptionHandler {
    @ExceptionHandler(S3UploadFailedException.class)
    public CommonResponse<ErrorBody> UserPlanExistException(UserPlanExistException e, HttpServletRequest request) {
        log.warn("S3-001> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("S3-001", "S3 업로드 실패하였습니다."),
                HttpStatus.BAD_REQUEST);
    }
}