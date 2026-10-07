const today = new Date();
const isoOffset = (days) => new Date(today.getTime() + days * 86400000).toISOString();

export const demoDevices = [
  { _id: 'd1', name: 'جهاز تنفس صناعي', serialNumber: 'VENT-2025-0142', category: 'أجهزة تنفس', manufacturer: 'Philips', model: 'Trilogy Evo', status: 'rented', location: 'مخزن القاهرة', condition: 'excellent', createdAt: isoOffset(-90) },
  { _id: 'd2', name: 'مكثف أكسجين 10 لتر', serialNumber: 'OXY-10L-0831', category: 'أجهزة أكسجين', manufacturer: 'Yuwell', model: '8F-10', status: 'available', location: 'مخزن القاهرة', condition: 'good', createdAt: isoOffset(-60) },
  { _id: 'd3', name: 'سرير طبي كهربائي', serialNumber: 'BED-EL-2290', category: 'أسرة طبية', manufacturer: 'Paramount', model: 'A5', status: 'rented', location: 'فرع مدينة نصر', condition: 'excellent', createdAt: isoOffset(-150) },
  { _id: 'd4', name: 'جهاز شفط إفرازات', serialNumber: 'SUC-2024-062', category: 'أجهزة شفط', manufacturer: 'Devilbiss', model: '7305P', status: 'maintenance', location: 'مركز الصيانة', condition: 'fair', createdAt: isoOffset(-240) },
  { _id: 'd5', name: 'كرسي متحرك خفيف', serialNumber: 'WC-LT-5518', category: 'وسائل حركة', manufacturer: 'Drive', model: 'Lite 20', status: 'available', location: 'مخزن القاهرة', condition: 'good', createdAt: isoOffset(-35) },
  { _id: 'd6', name: 'جهاز CPAP أوتوماتيك', serialNumber: 'CPAP-RS-1175', category: 'أجهزة تنفس', manufacturer: 'ResMed', model: 'AirSense 11', status: 'rented', location: 'مخزن الجيزة', condition: 'excellent', createdAt: isoOffset(-22) },
  { _id: 'd7', name: 'مرتبة هوائية طبية', serialNumber: 'MAT-AR-9042', category: 'مستلزمات رعاية', manufacturer: 'Yuwell', model: 'Bubble 2', status: 'available', location: 'فرع مدينة نصر', condition: 'new', createdAt: isoOffset(-12) },
];

export const demoRentals = [
  { _id: 'r1', device: demoDevices[0], customer: { name: 'أحمد محمود حسن', phone: '0101 234 5678', nationalId: '29101010123456', address: 'المعادي، القاهرة' }, startDate: isoOffset(-24), endDate: isoOffset(2), dailyRate: 380, deposit: 5000, status: 'active' },
  { _id: 'r2', device: demoDevices[2], customer: { name: 'منى إبراهيم علي', phone: '0122 441 9087', nationalId: '28407150198765', address: 'مدينة نصر، القاهرة' }, startDate: isoOffset(-18), endDate: isoOffset(6), dailyRate: 220, deposit: 3000, status: 'active' },
  { _id: 'r3', device: demoDevices[5], customer: { name: 'محمد سعيد', phone: '0115 720 3419', nationalId: '29503020165432', address: 'الدقي، الجيزة' }, startDate: isoOffset(-31), endDate: isoOffset(-2), dailyRate: 180, deposit: 2500, status: 'overdue' },
];

export const demoUsers = [
  { _id: 'u1', name: 'محمود أحمد', email: 'admin@retalcare.com', role: 'admin', active: true, lastLoginAt: isoOffset(-1) },
  { _id: 'u2', name: 'سارة علي', email: 'sara@retalcare.com', role: 'storekeeper', active: true, lastLoginAt: isoOffset(-2) },
  { _id: 'u3', name: 'أحمد خالد', email: 'ahmed@retalcare.com', role: 'viewer', active: true, lastLoginAt: isoOffset(-8) },
];

export const demoMovements = [
  { _id: 'm1', device: demoDevices[0], type: 'rented', details: 'تم تسليم الجهاز للعميل أحمد محمود', createdAt: isoOffset(-24), performedBy: demoUsers[1] },
  { _id: 'm2', device: demoDevices[3], type: 'maintenance_in', details: 'دخول صيانة دورية وفحص المضخة', createdAt: isoOffset(-3), performedBy: demoUsers[1] },
  { _id: 'm3', device: demoDevices[5], type: 'rented', details: 'تم تمديد فترة الإيجار 7 أيام', createdAt: isoOffset(-7), performedBy: demoUsers[0] },
  { _id: 'm4', device: demoDevices[6], type: 'added', details: 'إضافة جهاز جديد للمخزون', createdAt: isoOffset(-12), performedBy: demoUsers[0] },
];

export const demoDashboard = {
  counts: { total: 7, available: 3, rented: 3, maintenance: 1, overdue: 1 },
  financials: { activeRentalValue: 18420, depositsHeld: 10500 },
  expiringSoon: demoRentals,
  recentMovements: demoMovements,
  byCategory: [
    { _id: 'أجهزة تنفس', count: 2 }, { _id: 'أجهزة أكسجين', count: 1 },
    { _id: 'أسرة طبية', count: 1 }, { _id: 'أجهزة شفط', count: 1 }, { _id: 'وسائل حركة', count: 1 },
  ],
};
