package com.luxstay.luxstay_hotels_v2.web;

import com.luxstay.luxstay_hotels_v2.domain.Employee;
import com.luxstay.luxstay_hotels_v2.domain.service.EmployeeService;
import com.luxstay.luxstay_hotels_v2.web.dto.EmployeeDtos;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/employees")
public class EmployeeController {

    private final EmployeeService service;

    public EmployeeController(EmployeeService service) {
        this.service = service;
    }

    @GetMapping
    public List<EmployeeDtos.Response> list(@RequestParam(required = false) String position) {
        return service.list(position).stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public EmployeeDtos.Response get(@PathVariable Long id) {
        return toDto(service.get(id));
    }

    @PostMapping
    public EmployeeDtos.Response create(@Valid @RequestBody EmployeeDtos.CreateRequest req) {
        return toDto(service.create(req.fullName(), req.address(), req.position(), req.sinNumber()));
    }

    @PutMapping("/{id}")
    public EmployeeDtos.Response update(@PathVariable Long id, @Valid @RequestBody EmployeeDtos.UpdateRequest req) {
        return toDto(service.update(id, req.fullName(), req.address(), req.position()));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    private EmployeeDtos.Response toDto(Employee e) {
        return new EmployeeDtos.Response(e.getId(), e.getFullName(), e.getAddress(), e.getPosition());
    }
}
