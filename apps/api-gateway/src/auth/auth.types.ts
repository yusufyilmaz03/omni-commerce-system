export interface AuthenticatedUser {
  email: string;
  id: string;
  name: string;
}

export interface StoredUser extends AuthenticatedUser {
  passwordHash: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

export interface JwtPayload {
  email: string;
  name: string;
  sub: string;
}
