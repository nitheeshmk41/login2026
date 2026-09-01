import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, AlertCircle, Building2 } from 'lucide-react';
import { api } from '../../services/api';

interface Student {
  id: number;
  name: string;
  email: string;
  login_id: string;
  department?: string;
  roll_no?: string;
  college_name?: string;
}

interface CollegeTeammatePickerProps {
  value: string;
  onChange: (email: string) => void;
  placeholder?: string;
  excludeEmails?: string[];
}

export const CollegeTeammatePicker: React.FC<CollegeTeammatePickerProps> = ({
  value,
  onChange,
  placeholder = "Search teammate by Name | Dept | Roll No...",
  excludeEmails = [],
}) => {
  const [query, setQuery] = useState(value || '');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch college students on mount & on query change
  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const res = await api.teams.searchStudents(query);
        if (isMounted && Array.isArray(res.data)) {
          setStudents(res.data);
        }
      } catch (_) {
        if (isMounted) setStudents([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStudents();
    return () => { isMounted = false; };
  }, [query]);

  // Sync external value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (student: Student) => {
    setSelectedStudent(student);
    setQuery(student.email);
    onChange(student.email);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedStudent(null);
    onChange(val);
    setIsOpen(true);
  };

  // Filter out excluded emails (e.g. leader's email or already chosen teammates)
  const availableStudents = students.filter((s) => {
    const sEmail = (s.email || '').toLowerCase();
    return !excludeEmails.map(e => (e || '').toLowerCase()).includes(sEmail);
  });

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-[#6B5A5C] absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full bg-[#0A0607] border ${
            selectedStudent ? 'border-[#1FA971]' : 'border-[#2A1A1D]'
          } focus:border-[#E01B22] text-[#F7F2F2] pl-9 pr-8 py-2 rounded-[2px] outline-none font-mono text-xs transition-colors`}
        />
        {selectedStudent && (
          <UserCheck className="w-3.5 h-3.5 text-[#1FA971] absolute right-3 pointer-events-none" />
        )}
      </div>

      {/* College Teammate Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-[#0D0809] border border-[#E01B22]/60 rounded-[2px] shadow-2xl overflow-hidden animate-in fade-in duration-150">
          <div className="px-3 py-1.5 bg-[#130C0E] border-b border-[#2A1A1D] flex items-center justify-between font-mono text-[9px] text-[#E08A17] font-bold tracking-wider uppercase">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#E01B22]" /> PARTICIPANTS FROM YOUR COLLEGE
            </span>
            <span>{availableStudents.length} FOUND</span>
          </div>

          <div className="max-h-[220px] overflow-y-auto custom-scrollbar font-mono text-xs">
            {isLoading ? (
              <div className="p-3 text-center text-[11px] text-[#A79798]">Loading college participants...</div>
            ) : availableStudents.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-[#A79798] space-y-1">
                <p className="text-[#FF2A2A] font-bold flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> No matching registered participant
                </p>
                <p className="text-[10px] text-[#6B5A5C]">
                  Teammates must be registered participants from your college.
                </p>
              </div>
            ) : (
              availableStudents.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className="px-3 py-2 cursor-pointer hover:bg-[#E01B22]/15 border-b border-[#2A1A1D]/30 last:border-b-0 flex items-center justify-between transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    {/* Display: Name | Dept | Roll No */}
                    <div className="text-xs text-[#F7F2F2] font-bold truncate flex items-center gap-1.5">
                      <span>{s.name}</span>
                      <span className="text-[#A79798]">|</span>
                      <span className="text-[#E08A17]">{s.department || 'Dept'}</span>
                      {s.roll_no && (
                        <>
                          <span className="text-[#A79798]">|</span>
                          <span className="text-[#818CF8]">{s.roll_no}</span>
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-[#6B5A5C] truncate mt-0.5">
                      {s.email} • ID: {s.login_id}
                    </div>
                  </div>

                  <span className="text-[9px] text-[#1FA971] bg-[#1FA971]/10 px-1.5 py-0.5 rounded-[1px] font-bold border border-[#1FA971]/20 shrink-0">
                    SELECT
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
