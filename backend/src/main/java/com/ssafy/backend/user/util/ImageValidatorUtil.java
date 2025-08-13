package com.ssafy.backend.user.util;

import com.ssafy.backend.user.exception.IllegalFileExtensionException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Component
public class ImageValidatorUtil {
    private static final byte[] PNG = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };

    private static final byte[] JPEG = new byte[]{
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF
    };

    public void checkFileExtension(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            byte[] head = new byte[8];
            int read = is.read(head);
            if (read < 3) {
                throw new IllegalFileExtensionException("유효하지 않은 이미지 파일입니다.");
            }

            if (startsWith(head, PNG) || startsWith(head, JPEG)) {
                return;
            }

            throw new IllegalFileExtensionException("PNG 또는 JPEG 형식만 업로드 가능합니다.");
        } catch (IOException e) {
            throw new IllegalFileExtensionException("파일 검사 중 오류: " + e.getMessage());
        }
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}
