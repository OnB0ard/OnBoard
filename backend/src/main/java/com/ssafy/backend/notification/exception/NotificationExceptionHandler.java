// com/ssafy/backend/notification/exception/NotificationExceptionHandler.java
package com.ssafy.backend.notification.exception;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.ErrorBody;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class NotificationExceptionHandler {

    @ExceptionHandler(NotificationNotFoundException.class)
    public CommonResponse<ErrorBody> handleNotificationNotFound(
            NotificationNotFoundException e, HttpServletRequest request) {
        log.warn("NOTI-001> URI: {}, msg: {}", request.getRequestURI(), e.getMessage());
        return new CommonResponse<>(
                new ErrorBody("NOTI-001", "알림이 존재하지 않습니다."),
                HttpStatus.NOT_FOUND
        );
    }

    @ExceptionHandler(NotificationAccessDeniedException.class)
    public CommonResponse<ErrorBody> handleNotificationAccessDenied(
            NotificationAccessDeniedException e, HttpServletRequest request) {
        log.warn("NOTI-002> URI: {}, msg: {}", request.getRequestURI(), e.getMessage());
        return new CommonResponse<>(
                new ErrorBody("NOTI-002", "본인 알림만 처리할 수 있습니다."),
                HttpStatus.FORBIDDEN
        );
    }
}
