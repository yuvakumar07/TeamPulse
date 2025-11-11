# Employee Management Portal

A full-stack web application for managing employee information built with React.js, Node.js, Express, and MySQL.

## Features

- **Employee CRUD Operations**: Create, Read, Update, and Delete employee records
- **Search Functionality**: Search employees by name, email, department, or position
- **Routing**: Multi-page application with React Router for seamless navigation
- **State Management**: Redux Toolkit for centralized and predictable state management
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Instant feedback on all operations
- **Form Validation**: Client-side validation for data integrity
- **Clean UI**: Modern and intuitive user interface with navigation bar

## Tech Stack

### Frontend
- React.js 18
- React Router DOM v6 for routing
- Redux Toolkit for state management
- React-Redux for React bindings
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
    │   │   ├── Navigation.js      # Navigation bar
    │   │   ├── Navigation.css
    │   │   ├── EmployeeList.js
    │   │   ├── EmployeeList.css
    │   │   ├── EmployeeForm.js
    │   │   └── EmployeeForm.css
    │   ├── pages/
    │   │   ├── Home.js            # Home page
    │   │   ├── Home.css
    │   │   ├── Employees.js       # Employees list page
    │   │   ├── Employees.css
    │   │   ├── AddEmployee.js     # Add employee page
    │   │   ├── EditEmployee.js    # Edit employee page
    │   │   └── EmployeeFormPage.css
    │   ├── redux/
    │   │   ├── store.js           # Redux store configuration
    │   │   └── employeeSlice.js   # Employee slice with actions/reducers
    │   ├── services/
    │   │   └── api.js             # API service layer
    │   ├── App.js                 # Main app with routing
    │   ├── App.css
    │   ├── index.js               # Entry point with Redux Provider
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

## Application Routes

The application uses React Router for navigation with the following routes:

- `/` - Home page with dashboard and statistics
- `/employees` - View all employees in a table
- `/employees/add` - Add a new employee
- `/employees/edit/:id` - Edit an existing employee

## State Management

The application uses Redux Toolkit for centralized state management:

- **Store**: Configured in `redux/store.js`
- **Employee Slice**: Manages employee state with async thunks for API calls
- **Selectors**: Optimized selectors for filtered data
- **Actions**: Async actions for CRUD operations (fetchEmployees, addEmployee, modifyEmployee, removeEmployee)

## Usage

1. **Home Page**: View statistics and navigate to different sections
2. **View Employees**: Navigate to /employees to see all employees in a table
3. **Search**: Use the search bar to filter employees in real-time
4. **Add Employee**: Click "Add New Employee" in the navigation or on the employees page
5. **Edit Employee**: Click the "Edit" button on any employee row
6. **Delete Employee**: Click the "Delete" button and confirm the action

## Features in Detail

### Navigation
- Sticky navigation bar with gradient design
- Active route highlighting
- Responsive mobile menu
- Quick access to all major sections

### Home Page
- Dashboard with statistics (total employees, active employees, departments, positions)
- Feature highlights
- Quick action buttons for common tasks
- Modern card-based layout

### Employee List
- Sortable table with all employee information
- Real-time search across multiple fields (Redux-powered)
- Status indicators (Active/Inactive)
- Formatted salary and dates
- Responsive design for mobile devices
- Navigate to edit page via routing

### Employee Forms (Add/Edit)
- Dedicated pages for adding and editing employees
- Form validation for required fields
- Email format validation
- Duplicate email prevention
- Date picker for hire date
- Status dropdown (Active/Inactive)
- Error handling and user feedback
- Redux integration for state management

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
