import * as XLSX from 'xlsx';

export const exportEmployeesToExcel = (employees, filename = 'employees') => {
  // Helper function to format date as mm/dd/yy
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    return `${month}/${day}/${year}`;
  };

  // Helper function to format projects and teams
  const formatProjectsAndTeams = (allocatedProjects) => {
    if (!allocatedProjects) return 'N/A';

    const projects = allocatedProjects.split('||').map(item => {
      const [name, teamName, allocation] = item.split(':');
      const team = teamName && teamName !== 'Not Assigned' ? ` (${teamName})` : '';
      return `${name}${team}: ${allocation}%`;
    });

    return projects.join('; ');
  };

  // Helper function to calculate visa status
  const getVisaStatus = (visaEndDate) => {
    if (!visaEndDate) return 'N/A';

    const today = new Date();
    const endDate = new Date(visaEndDate);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays <= 30) return `Expiring Soon (${diffDays} days)`;
    if (diffDays <= 90) return `${diffDays} days remaining`;
    return `Valid (${diffDays} days)`;
  };

  // Format the data for Excel
  const formattedData = employees.map((emp, index) => ({
    'No.': index + 1,
    'Employee ID': emp.id,
    'SSO': emp.sso || 'N/A',
    'Name': emp.name,
    'Work Location': emp.work_location || 'N/A',
    'Joining Date': emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : 'N/A',
    'Role': emp.role || 'N/A',
    'Role Type': emp.role_type || 'N/A',
    'Phone': emp.phone || 'N/A',
    'Location': emp.location || 'N/A',
    'Criticality': emp.criticality || 'N/A',
    'Status': emp.status || 'N/A',
    'Skills': emp.skills || 'N/A',
    'Projects & Teams': formatProjectsAndTeams(emp.allocated_projects),
    'Visa Type': emp.visa_type || 'N/A',
    'Visa Status': getVisaStatus(emp.current_visa_end_date),
    'Last Working Day': emp.last_working_day ? new Date(emp.last_working_day).toLocaleDateString() : 'N/A',
    'Possible Candidate': emp.possible_candidate || 'N/A',
    'Asset ID': emp.asset_id || 'N/A',
    'Asset Return ID': emp.asset_return_id || 'N/A',
    'Comments': emp.comments || 'N/A',
    'Attrition': emp.attrition || 'N/A',
    'Offshore Manager ID': emp.offshore_manager_id || 'N/A',
    'Onsite Manager ID': emp.onsite_manager_id || 'N/A',
    'Created At': formatDate(emp.created_at),
    'Updated At': formatDate(emp.updated_at)
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
    { wch: 15 }, // Work Location
    { wch: 15 }, // Joining Date
    { wch: 20 }, // Role
    { wch: 15 }, // Role Type
    { wch: 15 }, // Phone
    { wch: 15 }, // Location
    { wch: 12 }, // Criticality
    { wch: 12 }, // Status
    { wch: 40 }, // Skills
    { wch: 50 }, // Projects & Teams
    { wch: 15 }, // Visa Type
    { wch: 25 }, // Visa Status
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
