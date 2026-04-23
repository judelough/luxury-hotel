package com.luxstay.luxstay_hotels_v2.domain.repo;

import com.luxstay.luxstay_hotels_v2.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByIdNumberAndEmailIgnoreCase(String idNumber, String email);

    Optional<Customer> findByIdNumberAndEmailIsNull(String idNumber);

    Optional<Customer> findByEmailIgnoreCase(String email);


}
