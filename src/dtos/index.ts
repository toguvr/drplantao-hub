export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
  role?: string;
}

export interface Enterprise {
  id: string;
  title: string;
  logo?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export interface UserEnterprise {
  id: string;
  user_id: string;
  enterprise_id: string;
  role: 'org_admin' | 'org_viewer';
  enterprise: Enterprise;
  user?: User;
  created_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  cidade?: string;
  uf?: string;
  logo_url?: string;
  adminFee?: number;
  tax?: number;
  min_hours?: number;
  min_tolerance?: number;
  enterprise_id?: string;
}

export interface HospitalHistoryPoint {
  month: string;
  balance: number;
}

export interface HospitalSummary extends Hospital {
  month_appointments: number;
  month_income: number;
  month_outcome: number;
  prev_month_income: number;
  prev_month_outcome: number;
  history_3m: HospitalHistoryPoint[];
}

export interface MonthlyPoint {
  month: string;
  income: number;
  outcome: number;
  balance: number;
  appointments: number;
}

export interface EnterpriseHub {
  enterprise_id: string;
  title: string;
  logo_url?: string;
  month: string; // YYYY-MM
  hospitals_count: number;

  month_income: number;
  month_outcome: number;
  month_appointments: number;
  active_doctors: number;
  avg_cost_per_appointment: number;

  prev_month_income: number;
  prev_month_outcome: number;
  prev_month_appointments: number;
  prev_active_doctors: number;

  monthly_history: MonthlyPoint[];
  hospitals: HospitalSummary[];
}

export interface DoctorSummary {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  admin: boolean;
}

export interface AppointmentSummary {
  id: string;
  date: string;
  title: string;
  duration: number;
  doctor_price: number;
  total_price: number;
  doctor_name: string | null;
  expertise_name: string | null;
}

export interface HospitalDetail {
  hospital: Hospital & {
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    cep: string | null;
    complemento: string | null;
    latitude: string | null;
    longitude: string | null;
  };
  kpis: {
    total_appointments_month: number;
    total_appointments_all: number;
    active_doctors: number;
    income_month: number;
    outcome_month: number;
  };
  recent_appointments: AppointmentSummary[];
  doctors: DoctorSummary[];
}

export interface FinancialRow {
  hospital_id: string;
  hospital_name: string;
  income: number;
  outcome: number;
}

export interface FinancialData {
  rows: FinancialRow[];
  totals: { income: number; outcome: number };
}
