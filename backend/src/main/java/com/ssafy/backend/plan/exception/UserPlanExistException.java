package com.ssafy.backend.plan.exception;

public class UserPlanExistException extends RuntimeException {
    public UserPlanExistException(String message) {
        super(message);
    }
}