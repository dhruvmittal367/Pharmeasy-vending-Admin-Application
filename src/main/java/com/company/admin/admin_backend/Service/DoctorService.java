package com.company.admin.admin_backend.service;

import com.company.admin.admin_backend.dto.DoctorProfileRequest;
import com.company.admin.admin_backend.dto.DoctorProfileResponse;
import com.company.admin.admin_backend.entity.AppUser;
import com.company.admin.admin_backend.entity.Doctor;
import com.company.admin.admin_backend.repository.DoctorRepository;
import com.company.admin.admin_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    public DoctorService(DoctorRepository doctorRepository, UserRepository userRepository) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
    }

    // ─── Get profile by username (from JWT) ──────────────────────────────────

    public DoctorProfileResponse getProfile(String username) {
        AppUser user = getUserByUsername(username);

        boolean profileExists = doctorRepository.existsByUserId(user.getId());

        if (!profileExists) {
            return buildResponseFromUser(user, null);
        }

        Doctor doctor = doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));

        return buildResponseFromUser(user, doctor);
    }

    // ─── Create profile ───────────────────────────────────────────────────────

    public DoctorProfileResponse createProfile(String username, DoctorProfileRequest request) {
        AppUser user = getUserByUsername(username);

        if (doctorRepository.existsByUserId(user.getId())) {
            throw new RuntimeException("Doctor profile already exists. Use update instead.");
        }

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        mapRequestToDoctor(request, doctor);

        Doctor saved = doctorRepository.save(doctor);
        return buildResponseFromUser(user, saved);
    }

    // ─── Update profile ───────────────────────────────────────────────────────

    public DoctorProfileResponse updateProfile(String username, DoctorProfileRequest request) {
        AppUser user = getUserByUsername(username);

        Doctor doctor = doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Doctor profile not found. Create profile first."));

        mapRequestToDoctor(request, doctor);

        Doctor saved = doctorRepository.save(doctor);
        return buildResponseFromUser(user, saved);
    }

    // ─── Check if profile is complete ─────────────────────────────────────────

    public boolean isProfileComplete(String username) {
        AppUser user = getUserByUsername(username);
        return doctorRepository.existsByUserId(user.getId());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private AppUser getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    // ✅ FIX: converts empty strings to null for all optional fields
    // This prevents Duplicate entry '' errors on UNIQUE columns in MySQL
    private String nullIfBlank(String value) {
        return (value != null && !value.isBlank()) ? value : null;
    }

    private void mapRequestToDoctor(DoctorProfileRequest request, Doctor doctor) {
        doctor.setSpecialization(request.getSpecialization());
        doctor.setQualification(nullIfBlank(request.getQualification()));
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setRegistrationNumber(nullIfBlank(request.getRegistrationNumber()));  // ✅ UNIQUE column — must be null not ""
        doctor.setRegistrationCouncil(nullIfBlank(request.getRegistrationCouncil()));
        doctor.setRegistrationYear(request.getRegistrationYear());
        doctor.setBio(nullIfBlank(request.getBio()));
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setLanguagesSpoken(nullIfBlank(request.getLanguagesSpoken()));
        doctor.setAwards(nullIfBlank(request.getAwards()));
    }

    private DoctorProfileResponse buildResponseFromUser(AppUser user, Doctor doctor) {
        DoctorProfileResponse response = new DoctorProfileResponse();

        // User fields
        response.setUserId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setMobile(user.getMobile());
        response.setLocation(user.getLocation());
        response.setLicenseNumber(user.getLicenseNumber());

        if (doctor == null) {
            response.setProfileComplete(false);
            return response;
        }

        // Doctor fields
        response.setDoctorId(doctor.getId());
        response.setSpecialization(doctor.getSpecialization());
        response.setQualification(doctor.getQualification());
        response.setExperienceYears(doctor.getExperienceYears());
        response.setRegistrationNumber(doctor.getRegistrationNumber());
        response.setRegistrationCouncil(doctor.getRegistrationCouncil());
        response.setRegistrationYear(doctor.getRegistrationYear());
        response.setBio(doctor.getBio());
        response.setConsultationFee(doctor.getConsultationFee());
        response.setIsVerified(doctor.getIsVerified());
        response.setVerificationStatus(doctor.getVerificationStatus());
        response.setRating(doctor.getRating());
        response.setTotalReviews(doctor.getTotalReviews());
        response.setTotalConsultations(doctor.getTotalConsultations());
        response.setLanguagesSpoken(doctor.getLanguagesSpoken());
        response.setAwards(doctor.getAwards());
        response.setProfileComplete(true);

        return response;
    }
}