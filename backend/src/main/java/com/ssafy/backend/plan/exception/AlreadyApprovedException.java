package com.ssafy.backend.plan.exception;

public class AlreadyApprovedException extends RuntimeException {
    public AlreadyApprovedException(String message) {
        super(message);
    }
}
