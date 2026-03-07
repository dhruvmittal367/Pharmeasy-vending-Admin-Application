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

    // Getters & Setters

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getRegistrationCouncil() { return registrationCouncil; }
    public void setRegistrationCouncil(String registrationCouncil) { this.registrationCouncil = registrationCouncil; }

    public Integer getRegistrationYear() { return registrationYear; }
    public void setRegistrationYear(Integer registrationYear) { this.registrationYear = registrationYear; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }

    public String getLanguagesSpoken() { return languagesSpoken; }
    public void setLanguagesSpoken(String languagesSpoken) { this.languagesSpoken = languagesSpoken; }

    public String getAwards() { return awards; }
    public void setAwards(String awards) { this.awards = awards; }
}