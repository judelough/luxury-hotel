package com.luxstay.luxstay_hotels_v2.domain.repo;

import com.luxstay.luxstay_hotels_v2.domain.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findBySinNumber(String sinNumber);
    boolean existsBySinNumber(String sinNumber);
    List<Employee> findByPositionIgnoreCase(String position);
}
