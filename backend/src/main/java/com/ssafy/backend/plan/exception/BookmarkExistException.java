package com.ssafy.backend.plan.exception;

public class BookmarkExistException extends RuntimeException {
    public BookmarkExistException(String message) {
        super(message);
    }
}
