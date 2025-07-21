package com.ssafy.backend.common.util;

import io.awspring.cloud.s3.ObjectMetadata;
import io.awspring.cloud.s3.S3Template;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@org.junit.jupiter.api.extension.ExtendWith(MockitoExtension.class)
class S3UtilTest {

    @Mock
    private S3Template s3Template;

    @InjectMocks
    private S3Util s3Util;

    private final String bucketName = "test-bucket";
    private final String key = "test-key";
    private final String contentType = "image/jpeg";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(s3Util, "bucketName", bucketName);
    }

    @Test
    @DisplayName("putObject 성공 시 true 반환")
    void putObject_success() {
        // given
        InputStream inputStream = new ByteArrayInputStream("test".getBytes());
        when(s3Template.upload(eq(bucketName), eq(key), any(InputStream.class), any(ObjectMetadata.class)))
                .thenReturn(null); // 실제 반환값은 사용하지 않으므로 null로 대체

        // when
        boolean result = s3Util.putObject(key, inputStream, contentType);

        // then
        assertThat(result).isTrue();
        verify(s3Template, times(1)).upload(eq(bucketName), eq(key), any(InputStream.class), any(ObjectMetadata.class));
    }

    @Test
    @DisplayName("putObject 실패 시 false 반환")
    void putObject_failure() {
        // given
        InputStream inputStream = new ByteArrayInputStream("test".getBytes());
        doThrow(new RuntimeException()).when(s3Template).upload(eq(bucketName), eq(key), any(InputStream.class), any(ObjectMetadata.class));

        // when
        boolean result = s3Util.putObject(key, inputStream, contentType);

        // then
        assertThat(result).isFalse();
        verify(s3Template, times(1)).upload(eq(bucketName), eq(key), any(InputStream.class), any(ObjectMetadata.class));
    }
}
