package com.ssafy.backend.user.exception;

public class NotYourAccountException extends RuntimeException {
    public NotYourAccountException(String message) {
        super(message);
    }
}
