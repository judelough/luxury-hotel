package com.luxstay.luxstay_hotels_v2.domain.service;

import com.luxstay.luxstay_hotels_v2.domain.Customer;
import com.luxstay.luxstay_hotels_v2.domain.enums.IdType;
import com.luxstay.luxstay_hotels_v2.domain.repo.CustomerRepository;
import com.luxstay.luxstay_hotels_v2.web.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository repo;

    public CustomerService(CustomerRepository repo) {
        this.repo = repo;
    }


    public List<Customer> list() {
        return repo.findAll();
    }

    public Customer get(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
    }


    /**
     * Business rule:
     * - Unique customer = (idNumber + email)
     * - idType does NOT participate in uniqueness
     */
    public Customer findOrCreate(
            String fullName,
            String address,
            LocalDate dateOfBirth,
            String idNumber,
            IdType idType,
            String email
    ) {
        validateRequired(fullName, "fullName");
        validateRequired(address, "address");
        validateRequired(idNumber, "idNumber");
        validateRequired(email, "email");

        if (dateOfBirth == null) {
            throw new IllegalArgumentException("dateOfBirth is required");
        }
        if (idType == null) {
            throw new IllegalArgumentException("idType is required");
        }

        String normalizedEmail = normalizeEmail(email);
        String normalizedIdNumber = idNumber.trim();

        return repo.findByIdNumberAndEmailIgnoreCase(normalizedIdNumber, normalizedEmail)
                .orElseGet(() -> repo.save(
                        Customer.builder()
                                .fullName(fullName.trim())
                                .address(address.trim())
                                .dateOfBirth(dateOfBirth)
                                .idNumber(normalizedIdNumber)
                                .idType(idType)
                                .email(normalizedEmail)
                                .registrationDate(LocalDate.now())
                                .build()
                ));
    }


    public Customer update(Long id, String fullName, String address, String email) {
        Customer existing = get(id);

        validateRequired(fullName, "fullName");
        validateRequired(address, "address");
        validateRequired(email, "email");

        String normalizedEmail = normalizeEmail(email);

        // If email changed → enforce uniqueness (idNumber + email)
        if (!normalizedEmail.equalsIgnoreCase(existing.getEmail())) {
            repo.findByIdNumberAndEmailIgnoreCase(existing.getIdNumber(), normalizedEmail)
                    .ifPresent(other -> {
                        if (!other.getId().equals(existing.getId())) {
                            throw new IllegalArgumentException(
                                    "Customer already exists with the same idNumber and email"
                            );
                        }
                    });
            existing.setEmail(normalizedEmail);
        }

        existing.setFullName(fullName.trim());
        existing.setAddress(address.trim());

        return repo.save(existing);
    }


    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new ResourceNotFoundException("Customer not found: " + id);
        }
        repo.deleteById(id);
    }


    private static void validateRequired(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
