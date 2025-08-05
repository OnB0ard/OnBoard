package com.ssafy.backend.whiteBoard.exception;

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
public class WhiteBoardObjectExceptionHandler {
    @ExceptionHandler(WhiteBoardObjectNotExistException.class)
    public CommonResponse<ErrorBody> WhiteBoardObjectNotExistException(WhiteBoardObjectNotExistException e, HttpServletRequest request) {
        log.warn("WhiteBoard-001> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("WhiteBoard-001", "화이트보드 객체가 존재하지 않습니다."),
                HttpStatus.BAD_REQUEST);
    }
    @ExceptionHandler(WhiteBoardObjectPlanMismatchException.class)
    public CommonResponse<ErrorBody> handleWhiteBoardObjectPlanMismatch(WhiteBoardObjectPlanMismatchException e, HttpServletRequest request) {
        log.warn("WhiteBoard-002> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("WhiteBoard-002", "요청한 플랜에 속하지 않는 화이트보드 객체입니다."),
                HttpStatus.BAD_REQUEST
        );
    }

}