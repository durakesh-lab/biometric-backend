// import { Schema, Document } from 'mongoose';

// export interface UserDocument extends Document {
//   username: string;
//   password: string;
// }

// export const UserSchema = new Schema<UserDocument>({
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
// });

// export class User {
//   username: string;
//   password: string;
// }

import { Document, Schema } from 'mongoose';

// Define User Interface
export interface User extends Document {
  username: string;
  password: string;
  role: string;
}

// Define the User Schema
export const UserSchema = new Schema<User>({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
});

// Export the Mongoose Document type
export type UserDocument = User & Document;
