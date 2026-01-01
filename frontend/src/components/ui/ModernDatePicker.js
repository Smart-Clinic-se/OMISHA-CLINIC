import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './ModernDatePicker.css';
import { Calendar } from 'lucide-react';

const ModernDatePicker = ({ value, onChange, placeholder = "Select Date", className }) => {
    return (
        <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Calendar className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <DatePicker
                selected={value}
                onChange={onChange}
                dateFormat="yyyy-MM-dd"
                placeholderText={placeholder}
                className={`w-full p-3 pl-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-white font-medium placeholder-slate-400 ${className}`}
                showPopperArrow={false}
                calendarClassName="shadow-xl"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                required
            />
        </div>
    );
};

export default ModernDatePicker;
