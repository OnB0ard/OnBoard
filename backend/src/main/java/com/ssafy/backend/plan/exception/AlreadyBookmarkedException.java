package com.ssafy.backend.plan.exception;

public class AlreadyBookmarkedException extends RuntimeException {
    public AlreadyBookmarkedException(String message) {
        super(message);
    }
}
