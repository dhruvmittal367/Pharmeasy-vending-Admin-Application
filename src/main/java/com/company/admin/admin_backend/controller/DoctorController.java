package com.company.admin.admin_backend.controller;

import com.company.admin.admin_backend.dto.DoctorProfileRequest;
import com.company.admin.admin_backend.dto.DoctorProfileResponse;
import com.company.admin.admin_backend.entity.AppUser;
import com.company.admin.admin_backend.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/doctor")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    // DoctorController.java

    @GetMapping("/profile")
    public ResponseEntity<DoctorProfileResponse> getProfile(
            @AuthenticationPrincipal AppUser appUser) {
        if (appUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(doctorService.getProfile(appUser.getUsername()));
    }

    @PostMapping("/profile")
    public ResponseEntity<DoctorProfileResponse> createProfile(
            @AuthenticationPrincipal AppUser appUser,
            @Valid @RequestBody DoctorProfileRequest request) {
        if (appUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(doctorService.createProfile(appUser.getUsername(), request));
    }

    @PutMapping("/profile")
    public ResponseEntity<DoctorProfileResponse> updateProfile(
            @AuthenticationPrincipal AppUser appUser,
            @Valid @RequestBody DoctorProfileRequest request) {
        if (appUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(doctorService.updateProfile(appUser.getUsername(), request));
    }

    @GetMapping("/profile/status")
    public ResponseEntity<Map<String, Boolean>> getProfileStatus(
            @AuthenticationPrincipal AppUser appUser) {
        return ResponseEntity.ok(Map.of("profileComplete",
                doctorService.isProfileComplete(appUser.getUsername())));
    }
}