package com.ssafy.backend.plan.exception;

public class PlanNotExistException extends RuntimeException {
    public PlanNotExistException(String message) {
        super(message);
    }
}
