export interface CaseData {
  caseNumber?: string | null;
  subject?: string | null;
  description?: string | null;
  status?: string | null;
  caseOrigin?: string | null;
  accountName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  causeCode1?: string | null;
  causeCode2?: string | null;
  causeCode3?: string | null;
  resolutionLevel1?: string | null;
  resolutionLevel2?: string | null;
  resolutionLevel3?: string | null;
  resolutionDetails?: string | null;
  resolutionMethod?: string | null;
  closureDetails?: string | null;
}

export interface AuthData {
  authenticated: boolean;
  instanceUrl?: string;
  username?: string;
  loginTime?: string;
}