package com.ssafy.backend.common.util;

import io.awspring.cloud.s3.ObjectMetadata;
import io.awspring.cloud.s3.S3Resource;
import io.awspring.cloud.s3.S3Template;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

@Slf4j
@Component
@RequiredArgsConstructor
public class S3Util {

    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucketName;
    private final S3Template s3Template;

    public boolean putObject(String key, InputStream inputStream, String contentType) {
        try {
            ObjectMetadata objectMetadata = ObjectMetadata.builder()
                    .contentType(contentType)
                    .build();
           s3Template.upload(bucketName, key, inputStream, objectMetadata);
           return true;
        } catch (Exception e) {
            log.error("S3 upload failed for key: {}", key, e);
            return false;
        }
    }

    public OutputStream getObject(String key) {
        try {
            S3Resource resource = s3Template.download(bucketName, key);
            InputStream is = resource.getInputStream();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            
            is.close();
            return baos;
        } catch (IOException e) {
            log.error("S3 download failed for key: {}", key, e);
            return null;
        }
    }

    public boolean deleteObject(String key) {
        try {
            s3Template.deleteObject(bucketName, key);
            return true;
        } catch (Exception e) {
            log.error("S3 delete failed for key: {}", key, e);
            return false;
        }
    }
}
