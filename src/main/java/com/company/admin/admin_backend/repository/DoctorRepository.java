package com.company.admin.admin_backend.repository;

import com.company.admin.admin_backend.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("SELECT d FROM Doctor d JOIN FETCH d.user WHERE d.user.username = :username")
    Optional<Doctor> findByUsername(@Param("username") String username);
}