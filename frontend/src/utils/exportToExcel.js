import * as XLSX from 'xlsx';

export const exportEmployeesToExcel = (employees, filename = 'employees') => {
  // Format the data for Excel
  const formattedData = employees.map((emp, index) => ({
    'No.': index + 1,
    'Employee ID': emp.id,
    'First Name': emp.first_name,
    'Last Name': emp.last_name,
    'Email': emp.email,
    'Phone': emp.phone || 'N/A',
    'Department': emp.department || 'N/A',
    'Position': emp.position || 'N/A',
    'Salary': emp.salary ? `$${parseFloat(emp.salary).toLocaleString()}` : 'N/A',
    'Hire Date': emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : 'N/A',
    'Status': emp.status ? emp.status.charAt(0).toUpperCase() + emp.status.slice(1) : 'N/A',
    'Created At': emp.created_at ? new Date(emp.created_at).toLocaleString() : 'N/A',
    'Updated At': emp.updated_at ? new Date(emp.updated_at).toLocaleString() : 'N/A'
  }));

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(formattedData);

  // Set column widths
  const columnWidths = [
    { wch: 5 },  // No.
    { wch: 12 }, // Employee ID
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 25 }, // Email
    { wch: 15 }, // Phone
    { wch: 15 }, // Department
    { wch: 20 }, // Position
    { wch: 15 }, // Salary
    { wch: 12 }, // Hire Date
    { wch: 10 }, // Status
    { wch: 20 }, // Created At
    { wch: 20 }  // Updated At
  ];
  ws['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');

  // Generate timestamp for filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const fullFilename = `${filename}_${timestamp}.xlsx`;

  // Write the file
  XLSX.writeFile(wb, fullFilename);

  return fullFilename;
};

export const exportFilteredEmployeesToExcel = (employees, searchTerm, filename = 'employees_filtered') => {
  return exportEmployeesToExcel(employees, filename);
};
