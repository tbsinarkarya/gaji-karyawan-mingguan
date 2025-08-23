import React, { useState, useEffect, useRef } from 'react';
import type { Employee } from '../types.ts';
import { formatRupiahInput, parseRupiahInput } from '../utils/formatters.ts';
import CameraIcon from './icons/CameraIcon.tsx';

interface EmployeeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
    onUpdateEmployee: (employee: Employee) => void;
    employeeToEdit: Employee | null;
}

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ isOpen, onClose, onAddEmployee, onUpdateEmployee, employeeToEdit }) => {
    const [name, setName] = useState('');
    const [position, setPosition] = useState('');
    const [dailyRate, setDailyRate] = useState('');
    const [weeklyAllowance, setWeeklyAllowance] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (employeeToEdit) {
                setName(employeeToEdit.name);
                setPosition(employeeToEdit.position);
                setDailyRate(String(employeeToEdit.dailyRate));
                setWeeklyAllowance(String(employeeToEdit.weeklyAllowance));
                setImageUrl(employeeToEdit.imageUrl);
            } else {
                setName('');
                setPosition('');
                setDailyRate('');
                setWeeklyAllowance('');
                setImageUrl(null);
            }
        }
    }, [employeeToEdit, isOpen]);
    
    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const rateValue = parseRupiahInput(dailyRate);
        const allowanceValue = parseRupiahInput(weeklyAllowance);

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
        
        const employeeData = { 
            name, 
            position, 
            dailyRate: rate, 
            weeklyAllowance: allowance,
            imageUrl: imageUrl || ''
        };

        if (employeeToEdit) {
            onUpdateEmployee({ ...employeeToEdit, ...employeeData });
        } else {
            onAddEmployee(employeeData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
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
                            aria-label="Upload foto karyawan"
                        />
                        <button type="button" onClick={handleImageUploadClick} className="relative w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Preview" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <CameraIcon className="w-10 h-10" />
                            )}
                        </button>
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="position" className="block text-sm font-medium text-slate-700">Jabatan</label>
                        <input
                            id="position"
                            type="text"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="dailyRate" className="block text-sm font-medium text-slate-700">Gaji per Hari</label>
                        <input
                            id="dailyRate"
                            type="text"
                            inputMode="numeric"
                            value={formatRupiahInput(dailyRate)}
                            onChange={(e) => setDailyRate(parseRupiahInput(e.target.value))}
                            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="cth: Rp 500.000"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="weeklyAllowance" className="block text-sm font-medium text-slate-700">Tunjangan Mingguan (6 hari)</label>
                        <input
                            id="weeklyAllowance"
                            type="text"
                            inputMode="numeric"
                            value={formatRupiahInput(weeklyAllowance)}
                            onChange={(e) => setWeeklyAllowance(parseRupiahInput(e.target.value))}
                            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="cth: Rp 300.000"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 font-semibold">
                            Batal
                        </button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold">
                            {employeeToEdit ? 'Simpan Perubahan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeFormModal;