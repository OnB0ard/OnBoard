package com.ssafy.backend.place.exception;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.ErrorBody;
import com.ssafy.backend.plan.exception.PlanNotExistException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class PlaceExceptionHandler {
    @ExceptionHandler(PlaceNotExistException.class)
    public CommonResponse<ErrorBody> PlaceNotExistException(PlaceNotExistException e, HttpServletRequest request) {
        log.warn("PLACE-001> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("PLACE-001", "여행지가 존재하지 않습니다."),
                HttpStatus.NOT_FOUND);
    }
}
