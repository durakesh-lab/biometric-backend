

// import { Document, Schema } from 'mongoose';

// // Define User Interface
// export interface User extends Document {
//   username: string;
//   password: string;
//   role: string;
// }

// // Define the User Schema
// export const UserSchema = new Schema<User>({
//   username: { type: String, unique: true, required: true },
//   password: { type: String, required: true },
//   role: { type: String, required: true },
// });

// // Export the Mongoose Document type
// export type UserDocument = User & Document;

import { Document, Schema } from 'mongoose';

export interface User extends Document {
  username: string;
  password: string;
  role: string;
  active_status: 'Active' | 'Inactive';
  email: string;
  firstName: string;  // Include this field
  lastName: string;
  joining_date: string;
  date_of_birth: string;
  branchId: string;
  companyId: string;
}

// Define the User Schema
// export const UserSchema = new Schema<User>({
//   username: { type: String, unique: true, required: true },
//   password: { type: String, required: true },
//   role: { type: String, required: true },
  
// });
export const UserSchema = new Schema({
  username: { type: String, unique: true, required: true },
  // email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Super Admin', 'HR Admin', 'Manager', 'Employee', 'Guest'],
    required: true,
  },
  active_status: {
    type: String,
    enum: ['Active', 'Inactive'],
    required: false,
  },
  email: { type: String, unique: true, sparse: true, default: null },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  joining_date: { type: String, required: false }, // or Date, based on how you're storing
  date_of_birth: { type: String, required: false }, // or Date
  branchId: { type: String, required: false },
  companyId: { type: String, required: false },
   deptId:{ type: String, required: false },
});
// Export the Mongoose Document type
export type UserDocument = User & Document;
