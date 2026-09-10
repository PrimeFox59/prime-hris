import React, { useState } from 'react';
import {
  Briefcase,
  PieChart,
  BarChart3,
  Building,
  Users,
  Calendar,
  DollarSign,
  Download,
  Filter
} from 'lucide-react';
import { Employee, Project, PayrollRecord, SalaryRuleConfig, AttendanceRecord } from '../types';
import { formatIDR, calculateEmployeePayroll } from '../utils/payrollCalculator';

interface ProjectPayrollTabProps {
  employees: Employee[];
  projects: Project[];
  attendances: AttendanceRecord[];
  salaryRules: SalaryRuleConfig;
}

export const ProjectPayrollTab: React.FC<ProjectPayrollTabProps> = ({
  employees,
  projects,
  attendances,
  salaryRules
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Compute all employee payrolls
  const payrollRecords: PayrollRecord[] = employees.map(emp =>
    calculateEmployeePayroll(emp, attendances, projects, salaryRules)
  );

  // Flatten allocations across all employees
  interface FlattenedAlloc {
    employeeId: string;
    employeeName: string;
    nik: string;
    position: string;
    projectId: string;
    projectCode: string;
    projectName: string;
    allocatedHours: number;
    allocatedCost: number;
    percentage: number;
  }

  const allAllocations: FlattenedAlloc[] = [];
  payrollRecords.forEach(p => {
    p.projectAllocations.forEach(alloc => {
      allAllocations.push({
        employeeId: p.employeeId,
        employeeName: p.employeeName,
        nik: p.nik,
        position: p.position,
        projectId: alloc.projectId,
        projectCode: alloc.projectCode,
        projectName: alloc.projectName,
        allocatedHours: alloc.allocatedHours,
        allocatedCost: alloc.allocatedCost,
        percentage: alloc.percentage
      });
    });
  });

  // Aggregate project totals
  const projectSummaries = projects.map(proj => {
    const allocs = allAllocations.filter(a => a.projectId === proj.id);
    const totalLaborCost = allocs.reduce((sum, a) => sum + a.allocatedCost, 0);
    const totalHours = allocs.reduce((sum, a) => sum + a.allocatedHours, 0);
    const headcount = allocs.length;

    return {
      project: proj,
      totalLaborCost,
      totalHours,
      headcount,
      allocs
    };
  });

  const grandTotalLaborCost = projectSummaries.reduce((sum, p) => sum + p.totalLaborCost, 0);

  const filteredAllocations = selectedProjectId === 'ALL'
    ? allAllocations
    : allAllocations.filter(a => a.projectId === selectedProjectId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Banner */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="prime-cut-corner bg-[#FF6B00] text-white text-[10px] font-black px-2.5 py-0.5 tracking-wider uppercase font-mono-code">
              PROJECT LABOR ALLOCATION
            </span>
            <span className="text-xs font-semibold text-slate-500">Cross-Project Cost Accounting</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Penggajian Berbasis Proyek (Project-Based Payroll)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Distribusi jam kerja & atribusi pembebanan gaji staf teknisi langsung ke masing-masing kode kontrak proyek industri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="glass-input rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 font-mono-code"
          >
            <option value="ALL">Semua Proyek Kontrak</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.name.substring(0, 20)}...</option>
            ))}
          </select>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {projectSummaries.map(({ project, totalLaborCost, totalHours, headcount }) => {
          const percentageOfGrand = grandTotalLaborCost > 0
            ? Math.round((totalLaborCost / grandTotalLaborCost) * 100)
            : 0;

          return (
            <div
              key={project.id}
              onClick={() => setSelectedProjectId(selectedProjectId === project.id ? 'ALL' : project.id)}
              className={`glass-card rounded-3xl p-5 border transition-all cursor-pointer space-y-3 ${
                selectedProjectId === project.id
                  ? 'border-[#FF6B00] shadow-lg ring-2 ring-orange-400/20'
                  : 'hover:shadow-md border-white/90'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-code font-black text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200/60">
                  {project.code}
                </span>
                <span className="text-[11px] font-mono-code font-bold text-slate-500">
                  {percentageOfGrand}% Share
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-xs line-clamp-1">{project.name}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{project.client}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Alokasi Biaya Gaji:</span>
                  <span className="font-bold font-mono-code text-slate-900">{formatIDR(totalLaborCost)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Total Jam Kerja:</span>
                  <span className="font-mono-code text-slate-700">{totalHours} Jam</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Personel Bertugas:</span>
                  <span className="font-bold text-slate-700">{headcount} Engineer</span>
                </div>
              </div>

              {/* Progress Bar of Share */}
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-orange-400"
                  style={{ width: `${percentageOfGrand}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Allocation Detail Table */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#FF6B00]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono-code">
              Matriks Beban Gaji Karyawan per Proyek
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total Alokasi: {filteredAllocations.length} Entri
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-mono-code">
                <th className="py-2.5 px-3">Karyawan</th>
                <th className="py-2.5 px-3">Kode & Nama Proyek</th>
                <th className="py-2.5 px-3">Porsi Alokasi (%)</th>
                <th className="py-2.5 px-3">Alokasi Jam Kerja</th>
                <th className="py-2.5 px-3 font-mono-code text-right">Biaya Gaji Dibebankan (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAllocations.map((alloc, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{alloc.employeeName}</div>
                    <div className="text-[10px] text-slate-500 font-mono-code">{alloc.nik} • {alloc.position}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-800 font-mono-code text-[11px] block">
                      {alloc.projectCode}
                    </span>
                    <span className="text-[10px] text-slate-500">{alloc.projectName}</span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono-code text-slate-800">{alloc.percentage}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${alloc.percentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono-code text-slate-800">
                    {alloc.allocatedHours} Jam
                  </td>

                  <td className="py-3 px-3 text-right font-mono-code font-black text-slate-900 text-sm">
                    {formatIDR(alloc.allocatedCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
