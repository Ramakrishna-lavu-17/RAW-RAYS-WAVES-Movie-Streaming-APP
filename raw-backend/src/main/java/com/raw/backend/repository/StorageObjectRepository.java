package com.raw.backend.repository;

import com.raw.backend.entity.StorageObject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface StorageObjectRepository extends JpaRepository<StorageObject, Long> {

    Optional<StorageObject> findByBucketNameAndObjectKey(String bucketName, String objectKey);

    List<StorageObject> findByBucketNameAndObjectKeyStartingWith(String bucketName, String prefix);

    @Transactional
    @Modifying
    @Query("DELETE FROM StorageObject s WHERE s.bucketName = :bucketName AND s.objectKey LIKE CONCAT(:prefix, '%')")
    void deleteByBucketNameAndObjectKeyStartingWith(@Param("bucketName") String bucketName, @Param("prefix") String prefix);

    @Transactional
    @Modifying
    void deleteByBucketNameAndObjectKey(String bucketName, String objectKey);

    @Query("SELECT COALESCE(SUM(s.fileSize), 0) FROM StorageObject s WHERE s.bucketName = :bucketName")
    Long sumSizeByBucket(@Param("bucketName") String bucketName);

    @Query("SELECT COALESCE(SUM(s.fileSize), 0) FROM StorageObject s WHERE s.bucketName = :bucketName AND s.objectKey LIKE CONCAT(:prefix, '%')")
    Long sumSizeByBucketAndPrefix(@Param("bucketName") String bucketName, @Param("prefix") String prefix);

    @Query("SELECT s FROM StorageObject s WHERE s.bucketName = :bucketName AND s.objectKey LIKE CONCAT('movies/', :movieId, '/%')")
    List<StorageObject> findByMovieId(@Param("bucketName") String bucketName, @Param("movieId") String movieId);
}
