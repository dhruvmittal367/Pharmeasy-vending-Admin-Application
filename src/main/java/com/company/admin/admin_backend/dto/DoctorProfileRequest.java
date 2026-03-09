package com.company.admin.admin_backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class DoctorProfileRequest {

    @NotBlank(message = "Specialization is required")
    private String specialization;

    private String qualification;
    private Integer experienceYears;
    private String registrationNumber;
    private String registrationCouncil;
    private Integer registrationYear;
    private String bio;
    private BigDecimal consultationFee;
    private String languagesSpoken;
    private String awards;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    // ✅ FIX: returns null instead of "" for optional fields
    // Prevents Duplicate entry '' violations on UNIQUE columns in MySQL
    private String nullIfBlank(String value) {
        return (value != null && !value.isBlank()) ? value : null;
    }

    // ─── Getters & Setters ────────────────────────────────────────────────────

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualification() { return nullIfBlank(qualification); }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public String getRegistrationNumber() { return nullIfBlank(registrationNumber); }  // ✅ UNIQUE column
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getRegistrationCouncil() { return nullIfBlank(registrationCouncil); }
    public void setRegistrationCouncil(String registrationCouncil) { this.registrationCouncil = registrationCouncil; }

    public Integer getRegistrationYear() { return registrationYear; }
    public void setRegistrationYear(Integer registrationYear) { this.registrationYear = registrationYear; }

    public String getBio() { return nullIfBlank(bio); }
    public void setBio(String bio) { this.bio = bio; }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }

    public String getLanguagesSpoken() { return nullIfBlank(languagesSpoken); }
    public void setLanguagesSpoken(String languagesSpoken) { this.languagesSpoken = languagesSpoken; }

    public String getAwards() { return nullIfBlank(awards); }
    public void setAwards(String awards) { this.awards = awards; }
}