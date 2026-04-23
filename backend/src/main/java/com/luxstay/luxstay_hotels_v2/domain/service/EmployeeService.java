package com.luxstay.luxstay_hotels_v2.domain.service;

import com.luxstay.luxstay_hotels_v2.domain.Employee;
import com.luxstay.luxstay_hotels_v2.domain.repo.EmployeeRepository;
import com.luxstay.luxstay_hotels_v2.web.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository repo;

    public EmployeeService(EmployeeRepository repo) {
        this.repo = repo;
    }

    public List<Employee> list(String position) {
        if (position != null && !position.isBlank()) {
            return repo.findByPositionIgnoreCase(position);
        }
        return repo.findAll();
    }

    public Employee get(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + id));
    }

    public Employee create(String fullName, String address, String position, String sinNumber) {
        if (repo.existsBySinNumber(sinNumber)) {
            throw new IllegalArgumentException("An employee with this sinNumber already exists");
        }

        Employee e = Employee.builder()
                .id(null)
                .fullName(fullName)
                .address(address)
                .position(position)
                .sinNumber(sinNumber)
                .build();

        return repo.save(e);
    }

    public Employee update(Long id, String fullName, String address, String position) {
        Employee existing = get(id);
        existing.setFullName(fullName);
        existing.setAddress(address);
        existing.setPosition(position);
        return repo.save(existing);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) throw new ResourceNotFoundException("Employee not found: " + id);
        repo.deleteById(id);
    }
}
