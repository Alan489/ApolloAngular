import { LoginToken } from './authenticationtoken';

export interface Session {
  id: number;
  username: string;
  sysName: string;
  accessLevel: number;
  token: LoginToken;
  signature: string;
  isMDT: boolean;
  unitAssignment: string | undefined;
  sysLat: number;
  sysLon: number;
  googleLink: string;
  name: string;
}
