import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from '../services/api';

// Async thunks
export const fetchEmployees = createAsyncThunk(
  'employees/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllEmployees();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employees');
    }
  }
);

export const fetchEmployeeById = createAsyncThunk(
  'employees/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await getEmployeeById(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employee');
    }
  }
);

export const addEmployee = createAsyncThunk(
  'employees/add',
  async (employeeData, { rejectWithValue }) => {
    try {
      const response = await createEmployee(employeeData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create employee');
    }
  }
);

export const modifyEmployee = createAsyncThunk(
  'employees/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateEmployee(id, data);
      return { id, data: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update employee');
    }
  }
);

export const removeEmployee = createAsyncThunk(
  'employees/delete',
  async (id, { rejectWithValue }) => {
    try {
      await deleteEmployee(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete employee');
    }
  }
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    employees: [],
    selectedEmployee: null,
    loading: false,
    error: null,
    searchTerm: '',
  },
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedEmployee: (state) => {
      state.selectedEmployee = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all employees
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch employee by ID
      .addCase(fetchEmployeeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEmployee = action.payload;
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add employee
      .addCase(addEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEmployee.fulfilled, (state, action) => {
        state.loading = false;
        // The API returns limited data, so we'll refetch
      })
      .addCase(addEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update employee
      .addCase(modifyEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(modifyEmployee.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.employees.findIndex(emp => emp.id === action.payload.id);
        if (index !== -1) {
          state.employees[index] = { ...state.employees[index], ...action.payload.data };
        }
      })
      .addCase(modifyEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete employee
      .addCase(removeEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = state.employees.filter(emp => emp.id !== action.payload);
      })
      .addCase(removeEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSearchTerm, clearError, clearSelectedEmployee } = employeeSlice.actions;

// Selectors
export const selectAllEmployees = (state) => state.employees.employees;
export const selectFilteredEmployees = (state) => {
  const { employees, searchTerm } = state.employees;
  if (!searchTerm) return employees;

  const term = searchTerm.toLowerCase();
  return employees.filter(emp =>
    emp.first_name.toLowerCase().includes(term) ||
    emp.last_name.toLowerCase().includes(term) ||
    emp.email.toLowerCase().includes(term) ||
    (emp.department && emp.department.toLowerCase().includes(term)) ||
    (emp.position && emp.position.toLowerCase().includes(term))
  );
};
export const selectSelectedEmployee = (state) => state.employees.selectedEmployee;
export const selectLoading = (state) => state.employees.loading;
export const selectError = (state) => state.employees.error;
export const selectSearchTerm = (state) => state.employees.searchTerm;

export default employeeSlice.reducer;
