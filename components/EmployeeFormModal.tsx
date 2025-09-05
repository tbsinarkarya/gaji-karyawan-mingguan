import React from 'react';
import type { Employee } from '@/types';
import CameraIcon from './icons/CameraIcon.tsx';

const { useState, useEffect, useRef } = React;

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onUpdateEmployee: (employee: Employee) => void;
  employeeToEdit: Employee | null;
}

const formatRupiahInput = (value: string): string => {
  if (!value) return '';
  const numberString = value.replace(/[^0-9]/g, '');
  if (!numberString) return '';
  const formatted = new Intl.NumberFormat('id-ID').format(parseInt(numberString, 10));
  return `Rp ${formatted}`;
};

const parseRupiahInput = (value: string): string => value.replace(/[^0-9]/g, '');

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onAddEmployee,
  onUpdateEmployee,
  employeeToEdit,
}) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [daily_rate, setDailyRate] = useState('');
  const [weekly_allowance, setWeeklyAllowance] = useState('');
  const [image_url, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (employeeToEdit) {
      setName(employeeToEdit.name);
      setPosition(employeeToEdit.position);
      setDailyRate(String(employeeToEdit.daily_rate));
      setWeeklyAllowance(String(employeeToEdit.weekly_allowance));
      setImageUrl(employeeToEdit.image_url);
    } else {
      setName('');
      setPosition('');
      setDailyRate('');
      setWeeklyAllowance('');
      setImageUrl(null);
    }
  }, [employeeToEdit]);

  const handleImageUploadClick = () => fileInputRef.current?.click();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rateValue = parseRupiahInput(daily_rate);
    const allowanceValue = parseRupiahInput(weekly_allowance);

    if (!name || !position || !rateValue || !allowanceValue) {
      alert('Semua field harus diisi!');
      return;
    }

    const rate = parseFloat(rateValue);
    const allowance = parseFloat(allowanceValue);

    if (isNaN(rate) || rate <= 0 || isNaN(allowance) || allowance < 0) {
      alert('Gaji dan Tunjangan harus berupa angka yang valid.');
      return;
    }

    const employeeData: Omit<Employee, 'id'> = {
      name,
      position,
      daily_rate: rate,
      weekly_allowance: allowance,
      image_url: image_url || '',
      created_at: new Date().toISOString(), // ✅ Tambahkan created_at
    };

    if (employeeToEdit) {
      onUpdateEmployee({ ...employeeToEdit, ...employeeData });
    } else {
      onAddEmployee(employeeData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-5 border-b">
          <h2 className="text-xl font-bold text-slate-800">{employeeToEdit ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex justify-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />
            <button type="button" onClick={handleImageUploadClick} className="relative w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors">
              {image_url ? (
                <img src={image_url} alt="Preview" className="w-full h-full rounded-full object-cover" />
              ) : (
                <CameraIcon className="w-10 h-10" />
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Jabatan</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Gaji per Hari</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatRupiahInput(daily_rate)}
              onChange={(e) => setDailyRate(parseRupiahInput(e.target.value))}
              placeholder="cth: Rp 500.000"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Tunjangan Mingguan</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatRupiahInput(weekly_allowance)}
              onChange={(e) => setWeeklyAllowance(parseRupiahInput(e.target.value))}
              placeholder="cth: Rp 300.000"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 font-semibold">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-indigo-700 font-semibold">
              {employeeToEdit ? 'Simpan Perubahan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeFormModal;
