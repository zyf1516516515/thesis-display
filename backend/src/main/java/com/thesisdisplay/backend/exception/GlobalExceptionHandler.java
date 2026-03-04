package com.thesisdisplay.backend.exception;

import com.thesisdisplay.backend.dto.ErrorResponse;
import com.thesisdisplay.backend.util.MailCodes;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult()
            .getAllErrors()
            .stream()
            .map(error -> {
                if (error instanceof FieldError fieldError) {
                    return fieldError.getField() + ": " + fieldError.getDefaultMessage();
                }
                return error.getDefaultMessage();
            })
            .toList();

        return ResponseEntity.badRequest().body(new ErrorResponse(
            MailCodes.INVALID_PAYLOAD,
            "Payload validation failed.",
            details
        ));
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(new ErrorResponse(
            ex.getCode(),
            ex.getMessage(),
            List.of()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(
            MailCodes.INTERNAL_ERROR,
            "Unexpected internal error.",
            List.of(ex.getMessage() == null ? "Unknown" : ex.getMessage())
        ));
    }
}
