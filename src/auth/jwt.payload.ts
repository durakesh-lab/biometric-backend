// export class JwtPayload {
//     username: string;
//     sub: string;  // This is the user's ID (or unique identifier)
//   }
  
export class JwtPayload {
  username: string;
  sub: string;  // User ID
  role: string;  // User role (Super Admin, HR Admin, etc.)
}
