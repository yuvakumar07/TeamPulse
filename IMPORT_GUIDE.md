# Employee Import Guide

## Overview
The Employee Management Portal now supports importing employee data from Excel (.xlsx, .xls) or CSV files.

## Features
- **Bulk Import**: Import multiple employees at once
- **Template Download**: Download a pre-formatted template with sample data
- **Data Preview**: Preview first 5 rows before importing
- **Error Reporting**: Detailed error messages for failed imports
- **Validation**: Automatic validation of required fields and data formats
- **Date Handling**: Automatic conversion of Excel dates and various date formats
- **Visa Status Calculation**: Automatic calculation of visa status based on dates

## How to Use

### Step 1: Access Import Feature
1. Navigate to the Employees page
2. Click the **"Import"** button in the toolbar (requires `employees.create` permission)

### Step 2: Download Template (Recommended)
1. In the Import dialog, click **"Download Template"**
2. This will download an Excel file with:
   - All required column headers
   - Sample data showing the expected format
   - Properly formatted columns

### Step 3: Prepare Your Data
Fill in the template with your employee data. Here are the available fields:

#### Required Fields
- **Name**: Employee's full name (Required)

#### Optional Fields
- **SSO**: Employee SSO ID (must be unique)
- **Role**: Job title/role
- **Role Type**: DEV, QA, Contract, Part-Time, etc.
- **Phone**: Contact number
- **Location**: Work location
- **Criticality**: Low, Medium, High, Critical (default: Medium)
- **Status**: Active, Inactive, On Leave, Terminated (default: Active)
- **Skills**: Comma-separated list of skills
- **Last Working Day**: Date in format YYYY-MM-DD or Excel date
- **Possible Candidate**: Alternative candidate information
- **Asset ID**: Asset identifier
- **Asset Return ID**: Asset return identifier
- **Comments**: Additional notes
- **Attrition**: Yes, No, At Risk (default: No)

#### H1B/Visa Fields
- **Visa Type**: H1B, H4, L1, L2, F1, OPT, CPT, Green Card, US Citizen, None (default: None)
- **Current Visa Start Date**: Visa start date (YYYY-MM-DD or Excel date)
- **Current Visa End Date**: Visa end date (YYYY-MM-DD or Excel date)
- **I94 Expiry Date**: I94 expiration date (YYYY-MM-DD or Excel date)
- **Passport Number**: Passport number
- **Passport Expiry Date**: Passport expiration date (YYYY-MM-DD or Excel date)
- **Sponsor Company**: Sponsoring company name
- **Visa Notes**: Additional visa-related notes

### Step 4: Upload File
1. Click **"Select File"** or drag and drop your file
2. Supported formats: .xlsx, .xls, .csv
3. Maximum file size: 10MB
4. Preview will show the first 5 rows and first 5 columns

### Step 5: Import
1. Review the preview
2. Click **"Upload"** to start the import
3. Wait for the import to complete
4. Review the results:
   - **Success Count**: Number of employees successfully imported
   - **Failed Count**: Number of employees that failed
   - **Error Details**: Table showing specific errors with row numbers

## Important Notes

### Column Name Flexibility
The import function supports multiple column name variations:
- Case-insensitive (e.g., "Name", "name", "NAME")
- Spaces or underscores (e.g., "Role Type", "role type", "role_type", "ROLE TYPE")

### Date Formats
The system automatically handles:
- Excel serial date numbers
- ISO format: YYYY-MM-DD
- Common date strings that JavaScript can parse

### Duplicate SSO Handling
- If an SSO already exists in the database, that row will fail with error "SSO already exists"
- Other rows will continue to import successfully

### Visa Status Auto-Calculation
The visa status is automatically calculated based on:
- **Not Applicable**: For None, US Citizen, or Green Card visa types
- **In Process**: When dates are not provided or start date is in the future
- **Active**: When current date is between start and end dates
- **Expired**: When end date has passed

## Sample Data Format

```
| SSO    | Name      | Role               | Role Type | Phone      | Location  | Criticality | Status | Skills            | Visa Type | Current Visa Start Date | Current Visa End Date |
|--------|-----------|-------------------|-----------|------------|-----------|-------------|--------|-------------------|-----------|------------------------|----------------------|
| SSO001 | John Doe  | Software Engineer | DEV       | 555-0101   | New York  | High        | Active | Java, Python      | H1B       | 2024-01-01            | 2026-12-31          |
| SSO002 | Jane Smith| Marketing Manager | DEV       | 555-0102   | San Francisco | Critical | Active | Digital Marketing | US Citizen|                       |                      |
```

## Troubleshooting

### Common Errors
1. **"Name is required"**: Ensure every row has a name value
2. **"SSO already exists"**: The SSO is already in the database - update or use a different SSO
3. **"File is empty or has no valid data"**: Check that your file has data rows (not just headers)
4. **"Invalid file type"**: Ensure you're uploading .xlsx, .xls, or .csv files only

### Best Practices
1. Always download and use the template
2. Keep column headers in the first row
3. Don't leave empty rows between data
4. Use consistent date formats
5. Validate data before importing
6. Start with a small test import to verify format

## Permissions
The import feature requires the `employees.create` permission. Users without this permission will not see the Import button.

## Audit Logging
All import operations are logged in the audit_logs table with:
- Admin ID
- Action type: IMPORT
- Success/failure counts
- Timestamp and IP address
