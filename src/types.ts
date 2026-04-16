import React from 'react';

export interface KPI {
  label: string;
  value: string;
}

export interface Role {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  tasks: string[];
  kpis: KPI[];
  color: string;
  focusArea?: string;
}

export interface ProcessStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface Department {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface JobDescription {
  title: string;
  objective: string;
  tasks: string[];
  powers?: string[];
  kpis: string[];
  requirements?: string[];
  salaryRange: string;
  baseSalary?: string;
  salaryCalculation: string;
}
