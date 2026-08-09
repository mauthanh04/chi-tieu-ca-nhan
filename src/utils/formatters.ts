// Format currency to VNĐ or custom symbol
export function formatCurrency(amount: number, currency = 'VNĐ'): string {
  const rounded = Math.round(amount);
  const formattedNumber = new Intl.NumberFormat('vi-VN').format(Math.abs(rounded));
  
  if (currency === 'USD') {
    return `$${formattedNumber}`;
  }
  
  return `${formattedNumber} ₫`;
}

// Format ISO date (YYYY-MM-DD) to Vietnamese display (DD/MM/YYYY)
export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Get day of week label in Vietnamese
export function getDayOfWeekVN(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return days[d.getDay()];
}

// Get Account Type Label
export function getAccountTypeLabel(type: string): string {
  switch (type) {
    case 'nganhang':
      return 'Tài khoản ngân hàng';
    case 'tienmat':
      return 'Tiền mặt';
    case 'videondientu':
      return 'Ví điện tử';
    default:
      return 'Khác';
  }
}

// Get list of available years for dropdowns (2026 to 2100)
export function getAvailableYears(extraYear?: number, startYear = 2026, endYear = 2100): number[] {
  let min = startYear;
  let max = endYear;

  if (extraYear) {
    if (extraYear < min) min = extraYear;
    if (extraYear > max) max = extraYear;
  }

  const years: number[] = [];
  for (let y = min; y <= max; y++) {
    years.push(y);
  }
  return years;
}

