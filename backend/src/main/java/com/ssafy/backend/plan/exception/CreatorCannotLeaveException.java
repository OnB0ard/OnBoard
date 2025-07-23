package com.ssafy.backend.plan.exception;

public class CreatorCannotLeaveException extends RuntimeException {
    public CreatorCannotLeaveException(String message) {
        super(message);
    }
}
