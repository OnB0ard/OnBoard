package com.ssafy.backend.plan.exception;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.ErrorBody;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContextException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class PlanExceptionHandler {
    @ExceptionHandler(UserPlanExistException.class)
    public CommonResponse<ErrorBody> UserPlanExistException(UserPlanExistException e, HttpServletRequest request) {
        log.warn("PLAN-011> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("PLAN-011", "이미 여행 계획에 있는 사용자입니다."),
                HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UserCannotApproveException.class)
    public CommonResponse<ErrorBody> UserCannotApproveException(UserCannotApproveException e, HttpServletRequest request) {
        log.warn("PLAN-012> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("PLAN-012", "참여자에게는 권한이 없습니다."),
                HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NotInThisRoomException.class)
    public CommonResponse<ErrorBody> NotInThisRoomException(NotInThisRoomException e, HttpServletRequest request) {
        log.warn("PLAN-013> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("PLAN-013", "당신은 이 방에 속해있지 않습니다."),
                HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NotApplicantException.class)
    public CommonResponse<ErrorBody> NotApplicantException(NotApplicantException e, HttpServletRequest request) {
        log.warn("PLAN-014> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("PLAN-014", "참여 요청을 하지 않은 사용자입니다."),
                HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(PlanNotExistException.class)
    public  CommonResponse<ErrorBody> PlanNotExistException(PlanNotExistException e, HttpServletRequest request) {
        log.warn("PLAN-015> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("PLAN-015", "여행 계획방이 존재하지 않습니다."),
                HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UserNotExistException.class)
    public  CommonResponse<ErrorBody> UserNotExistException(UserNotExistException e, HttpServletRequest request) {
        log.warn("PLAN-016> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("PLAN-016", "사용자가 존재하지 않습니다."),
                HttpStatus.BAD_REQUEST);
    }
    @ExceptionHandler(CreatorCannotLeaveException.class)
    public  CommonResponse<ErrorBody> CreatorCannotLeaveException(CreatorCannotLeaveException e, HttpServletRequest request) {
        log.warn("PLAN-017> 요청 URI: " + request.getRequestURI() + ", 에러 메세지: " + e.getMessage());
        return new CommonResponse<>(new ErrorBody("PLAN-017", "방 생성자는 나갈 수 없습니다."),
                HttpStatus.BAD_REQUEST);
    }
}