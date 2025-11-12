import * as XLSX from 'xlsx';

export const exportEmployeesToExcel = (employees, filename = 'employees') => {
  // Format the data for Excel
  const formattedData = employees.map((emp, index) => ({
    'No.': index + 1,
    'Employee ID': emp.id,
    'SSO': emp.sso || 'N/A',
    'Name': emp.name,
    'Role': emp.role || 'N/A',
    'Role Type': emp.role_type || 'N/A',
    'Phone': emp.phone || 'N/A',
    'Location': emp.location || 'N/A',
    'Criticality': emp.criticality || 'N/A',
    'Status': emp.status || 'N/A',
    'Skills': emp.skills || 'N/A',
    'Last Working Day': emp.last_working_day ? new Date(emp.last_working_day).toLocaleDateString() : 'N/A',
    'Possible Candidate': emp.possible_candidate || 'N/A',
    'Asset ID': emp.asset_id || 'N/A',
    'Asset Return ID': emp.asset_return_id || 'N/A',
    'Comments': emp.comments || 'N/A',
    'Attrition': emp.attrition || 'N/A',
    'Offshore Manager ID': emp.offshore_manager_id || 'N/A',
    'Onsite Manager ID': emp.onsite_manager_id || 'N/A',
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
    { wch: 12 }, // SSO
    { wch: 20 }, // Name
    { wch: 20 }, // Role
    { wch: 15 }, // Role Type
    { wch: 15 }, // Phone
    { wch: 15 }, // Location
    { wch: 12 }, // Criticality
    { wch: 12 }, // Status
    { wch: 40 }, // Skills
    { wch: 18 }, // Last Working Day
    { wch: 20 }, // Possible Candidate
    { wch: 15 }, // Asset ID
    { wch: 18 }, // Asset Return ID
    { wch: 30 }, // Comments
    { wch: 12 }, // Attrition
    { wch: 18 }, // Offshore Manager ID
    { wch: 18 }, // Onsite Manager ID
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
