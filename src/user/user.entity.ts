

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
  email: string;
  role: string;
}

export const UserSchema = new Schema<User>({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});

export type UserDocument = User & Document;
