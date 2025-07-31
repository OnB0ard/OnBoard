package com.ssafy.backend.plan.exception;

public class BookmarkNotExistException extends RuntimeException {
    public BookmarkNotExistException(String message) {
        super(message);
    }
}
