-- Create database
CREATE DATABASE IF NOT EXISTS employee_management;

USE employee_management;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  department VARCHAR(50),
  position VARCHAR(50),
  salary DECIMAL(10, 2),
  hire_date DATE,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO employees (first_name, last_name, email, phone, department, position, salary, hire_date, status) VALUES
('John', 'Doe', 'john.doe@company.com', '555-0101', 'Engineering', 'Software Engineer', 75000.00, '2023-01-15', 'active'),
('Jane', 'Smith', 'jane.smith@company.com', '555-0102', 'Marketing', 'Marketing Manager', 80000.00, '2023-02-20', 'active'),
('Robert', 'Johnson', 'robert.johnson@company.com', '555-0103', 'Sales', 'Sales Representative', 60000.00, '2023-03-10', 'active'),
('Emily', 'Williams', 'emily.williams@company.com', '555-0104', 'HR', 'HR Specialist', 65000.00, '2023-04-05', 'active'),
('Michael', 'Brown', 'michael.brown@company.com', '555-0105', 'Engineering', 'Senior Developer', 95000.00, '2022-12-01', 'active');
