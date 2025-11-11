# Employee Management Portal

A full-stack web application for managing employee information built with React.js, Node.js, Express, and MySQL.

## Features

- **Employee CRUD Operations**: Create, Read, Update, and Delete employee records
- **Search Functionality**: Search employees by name, email, department, or position
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Instant feedback on all operations
- **Form Validation**: Client-side validation for data integrity
- **Clean UI**: Modern and intuitive user interface

## Tech Stack

### Frontend
- React.js 18
- Axios for API calls
- CSS3 for styling

### Backend
- Node.js
- Express.js
- MySQL2
- CORS
- dotenv

## Project Structure

```
TeamPulse/
├── backend/
│   ├── config/
│   │   ├── database.js       # MySQL connection configuration
│   │   └── schema.sql        # Database schema and sample data
│   ├── controllers/
│   │   └── employeeController.js  # Business logic
│   ├── routes/
│   │   └── employeeRoutes.js      # API routes
│   ├── .env.example          # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── server.js             # Entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── EmployeeList.js
    │   │   ├── EmployeeList.css
    │   │   ├── EmployeeForm.js
    │   │   └── EmployeeForm.css
    │   ├── services/
    │   │   └── api.js        # API service layer
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    ├── .gitignore
    └── package.json
```

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- MySQL (v5.7 or higher)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TeamPulse
```

### 2. Database Setup

1. Start your MySQL server

2. Create the database and tables:

```bash
mysql -u root -p < backend/config/schema.sql
```

Or manually execute the SQL commands:

```sql
CREATE DATABASE IF NOT EXISTS employee_management;

USE employee_management;

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
```

### 3. Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

4. Update the `.env` file with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=employee_management
DB_PORT=3306
PORT=5000
```

5. Start the backend server:

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The backend server will start on `http://localhost:5000`

### 4. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. (Optional) Create a `.env` file in the frontend directory if you need to customize the API URL:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the React development server:

```bash
npm start
```

The frontend application will open in your browser at `http://localhost:3000`

## API Endpoints

### Employees

- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Request Body Example (POST/PUT)

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@company.com",
  "phone": "555-0101",
  "department": "Engineering",
  "position": "Software Engineer",
  "salary": 75000.00,
  "hire_date": "2024-01-15",
  "status": "active"
}
```

## Usage

1. **View Employees**: The main page displays a list of all employees
2. **Search**: Use the search bar to filter employees
3. **Add Employee**: Click "Add New Employee" button to open the form
4. **Edit Employee**: Click the "Edit" button on any employee row
5. **Delete Employee**: Click the "Delete" button and confirm the action

## Features in Detail

### Employee List
- Sortable table with all employee information
- Real-time search across multiple fields
- Status indicators (Active/Inactive)
- Formatted salary and dates
- Responsive design for mobile devices

### Employee Form
- Form validation for required fields
- Email format validation
- Duplicate email prevention
- Date picker for hire date
- Status dropdown (Active/Inactive)
- Error handling and user feedback

## Development

### Backend Development

```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development

```bash
cd frontend
npm start  # React development server with hot reload
```

## Production Build

### Frontend

```bash
cd frontend
npm run build
```

The production-ready files will be in the `frontend/build` directory.

## Troubleshooting

### Backend won't start
- Check if MySQL is running
- Verify database credentials in `.env`
- Ensure the database and table exist
- Check if port 5000 is available

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check CORS settings if running on different domains
- Verify API URL in frontend configuration

### Database connection errors
- Confirm MySQL service is running
- Check username and password
- Verify database name exists
- Check MySQL port (default: 3306)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues, questions, or contributions, please open an issue in the repository.
