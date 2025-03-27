export enum Role {
  ADMIN = "ADMIN",
  SUPPORT = "SUPPORT",
  CLIENT = "CLIENT",
}

export const isAdmin = (role?: string): boolean => {
  return role === Role.ADMIN
}

