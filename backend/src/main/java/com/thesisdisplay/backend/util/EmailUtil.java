package com.thesisdisplay.backend.util;

public final class EmailUtil {

    private EmailUtil() {
    }

    public static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
