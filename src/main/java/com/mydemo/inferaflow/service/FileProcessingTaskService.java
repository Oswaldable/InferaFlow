package com.mydemo.inferaflow.service;

import com.mydemo.inferaflow.model.FileUpload;
import com.mydemo.inferaflow.repository.FileUploadRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class FileProcessingTaskService {

    private static final Logger logger = LoggerFactory.getLogger(FileProcessingTaskService.class);

    private final FileUploadRepository fileUploadRepository;

    public FileProcessingTaskService(FileUploadRepository fileUploadRepository) {
        this.fileUploadRepository = fileUploadRepository;
    }

    @Transactional
    public void markPending(String fileMd5, String userId) {
        updateStatus(fileMd5, userId, FileUpload.ProcessingStatus.PENDING, null);
    }

    @Transactional
    public void markParsing(String fileMd5, String userId) {
        updateStatus(fileMd5, userId, FileUpload.ProcessingStatus.PARSING, null);
    }

    @Transactional
    public void markVectorizing(String fileMd5, String userId) {
        updateStatus(fileMd5, userId, FileUpload.ProcessingStatus.VECTORIZING, null);
    }

    @Transactional
    public void markCompleted(String fileMd5, String userId) {
        updateStatus(fileMd5, userId, FileUpload.ProcessingStatus.COMPLETED, null);
    }

    @Transactional
    public void markFailed(String fileMd5, String userId, String errorMessage) {
        String safeError = errorMessage == null ? "unknown error" : errorMessage;
        updateStatus(fileMd5, userId, FileUpload.ProcessingStatus.FAILED, safeError);
    }

    public List<FileUpload> getUserTasks(String userId) {
        return fileUploadRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<FileUpload> getUserTask(String userId, String fileMd5) {
        return fileUploadRepository.findByFileMd5AndUserId(fileMd5, userId);
    }

    private void updateStatus(String fileMd5, String userId, FileUpload.ProcessingStatus status, String errorMessage) {
        Optional<FileUpload> optional = Optional.empty();
        if (userId != null && !userId.isBlank()) {
            optional = fileUploadRepository.findByFileMd5AndUserId(fileMd5, userId);
        }
        if (optional.isEmpty()) {
            optional = fileUploadRepository.findByFileMd5(fileMd5);
        }

        if (optional.isEmpty()) {
            logger.warn("Skip task status update because file not found: fileMd5={}, userId={}, status={}", fileMd5, userId, status);
            return;
        }

        FileUpload fileUpload = optional.get();
        fileUpload.setProcessingStatus(status);
        fileUpload.setProcessingError(errorMessage);
        fileUpload.setProcessingUpdatedAt(LocalDateTime.now());
        fileUploadRepository.save(fileUpload);
        logger.info("Updated processing status: fileMd5={}, userId={}, status={}", fileMd5, fileUpload.getUserId(), status);
    }
}
