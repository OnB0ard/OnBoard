package com.ssafy.backend.whiteBoard.exception;

public class WhiteBoardObjectNotExistException extends RuntimeException{
    public WhiteBoardObjectNotExistException(String message) {
        super(message);
    }
}
