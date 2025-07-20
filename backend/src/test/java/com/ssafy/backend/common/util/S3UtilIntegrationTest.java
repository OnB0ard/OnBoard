package com.ssafy.backend.common.util;

import io.awspring.cloud.s3.S3Template;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("local")
public class S3UtilIntegrationTest {

    @Autowired
    private S3Util s3Util;

    @Autowired
    private S3Template s3Template;

    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucketName;

    private final String testKey = "test/integration-test-file.txt";
    private final String testContent = "Hello, S3 Integration Test!";
    private final String contentType = "text/plain";

    @BeforeEach
    void setup() {
        // 테스트용 객체 생성
        InputStream inputStream = new ByteArrayInputStream(testContent.getBytes(StandardCharsets.UTF_8));
        s3Util.putObject(testKey, inputStream, contentType);
    }

    @AfterEach
    void cleanup() {
        // 테스트 후 객체 삭제
        s3Template.deleteObject(bucketName, testKey);
    }

    @Test
    @DisplayName("S3에 객체를 업로드하고 정상적으로 처리되는지 확인")
    void testPutObject() {
        // Given
        String newKey = "test/new-test-file.txt";
        InputStream inputStream = new ByteArrayInputStream("New test content".getBytes(StandardCharsets.UTF_8));

        // When
        boolean result = s3Util.putObject(newKey, inputStream, contentType);

        // Then
        assertThat(result).isTrue();

        // Cleanup
        s3Util.deleteObject(newKey);
    }

    @Test
    @DisplayName("S3에서 객체를 가져오고 내용이 정확한지 확인")
    void testGetObject() {
        // When
        ByteArrayOutputStream outputStream = (ByteArrayOutputStream) s3Util.getObject(testKey);

        // Then
        assertThat(outputStream).isNotNull();
        String content = outputStream.toString(StandardCharsets.UTF_8);
        assertThat(content).isEqualTo(testContent);
    }

    @Test
    @DisplayName("S3에서 객체를 삭제하고 정상적으로 처리되는지 확인")
    void testDeleteObject() {
        // Given
        String deleteKey = "test/delete-test-file.txt";
        InputStream inputStream = new ByteArrayInputStream("Delete test content".getBytes(StandardCharsets.UTF_8));
        s3Util.putObject(deleteKey, inputStream, contentType);

        // When
        boolean result = s3Util.deleteObject(deleteKey);

        // Then
        assertThat(result).isTrue();
    }
}
