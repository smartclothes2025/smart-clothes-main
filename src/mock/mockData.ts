/**
 * 統一假資料模組
 * - 匯出固定 ID 的假資料陣列
 * - 提供 get...() 與 seedToLocalStorage() 等 helper
 * - 所有資料格式與欄位統一，便於前端使用
 */

type ID = string;

export interface User {
	id: ID;
	name: string;
	email: string;
	role: 'admin' | 'user';
	createdAt: string; // ISO
}

export interface Device {
	id: ID;
	name: string;
	model: string;
	batteryPercent: number; // 0-100
	connected: boolean;
	ownerId: ID;
	createdAt: string;
}

export interface SensorReading {
	id: ID;
	deviceId: ID;
	timestamp: string; // ISO
	temperatureC: number;
	humidityPct: number;
	heartRateBpm?: number;
	accel?: { x: number; y: number; z: number };
}

// --- 產生時間序列的輔助函式（可產生過去 N 筆） ---
function isoMinutesAgo(mins: number): string {
	return new Date(Date.now() - mins * 60_000).toISOString();
}

function genReadingsForDevice(deviceId: ID, startMinAgo = 60, stepMin = 5, count = 12): SensorReading[] {
	const arr: SensorReading[] = [];
	for (let i = 0; i < count; i++) {
		const mins = startMinAgo - i * stepMin;
		arr.push({
			id: `${deviceId}-r-${i + 1}`,
			deviceId,
			timestamp: isoMinutesAgo(mins),
			temperatureC: parseFloat((22 + Math.sin(i / 3) * 1.5).toFixed(2)),
			humidityPct: parseFloat((45 + Math.cos(i / 5) * 5).toFixed(2)),
			heartRateBpm: 60 + (i % 5) * 2,
			accel: { x: parseFloat((Math.sin(i / 2) * 0.02).toFixed(4)), y: 0, z: 0 },
		});
	}
	return arr;
}

// --- 固定假資料（ID 與欄位一致） ---
export const MOCK_USERS: User[] = [
	{ id: 'user-1', name: '林小明', email: 'lin@example.com', role: 'admin', createdAt: isoMinutesAgo(60 * 24 * 30) },
	{ id: 'user-2', name: '王小美', email: 'wang@example.com', role: 'user', createdAt: isoMinutesAgo(60 * 24 * 10) },
];

export const MOCK_DEVICES: Device[] = [
	{ id: 'device-1', name: '智慧衣-Alpha', model: 'SC-100', batteryPercent: 87, connected: true, ownerId: 'user-1', createdAt: isoMinutesAgo(60 * 24 * 7) },
	{ id: 'device-2', name: '智慧衣-Beta', model: 'SC-100', batteryPercent: 54, connected: false, ownerId: 'user-2', createdAt: isoMinutesAgo(60 * 24 * 3) },
];

export const MOCK_SENSOR_READINGS: SensorReading[] = [
	// device-1 recent series
	...genReadingsForDevice('device-1', 60, 5, 12),
	// device-2 recent series (slightly different pattern)
	...genReadingsForDevice('device-2', 120, 10, 8),
];

// --- 簡易模擬 API helper（回傳 Promise，方便在前端 await 使用） ---
function withDelay<T>(data: T, ms = 200): Promise<T> {
	return new Promise((res) => setTimeout(() => res(data), ms));
}

export const MockApi = {
	getUsers: (delayMs = 200) => withDelay(MOCK_USERS, delayMs),
	getDevices: (delayMs = 200) => withDelay(MOCK_DEVICES, delayMs),
	getDeviceById: (id: ID, delayMs = 150) => withDelay(MOCK_DEVICES.find((d) => d.id === id) ?? null, delayMs),
	getReadingsForDevice: (deviceId: ID, delayMs = 200) =>
		withDelay(MOCK_SENSOR_READINGS.filter((r) => r.deviceId === deviceId).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)), delayMs),
	// 可擴充的查詢介面
	queryReadings: (opts: { deviceId?: ID; sinceISO?: string; limit?: number } = {}, delayMs = 200) =>
		withDelay(
			MOCK_SENSOR_READINGS
				.filter((r) => (opts.deviceId ? r.deviceId === opts.deviceId : true))
				.filter((r) => (opts.sinceISO ? r.timestamp >= opts.sinceISO : true))
				.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
				.slice(0, opts.limit ?? 100),
			delayMs,
		),
};

// --- 選擇性：把假資料寫入 localStorage，方便無後端時直接讀取（呼叫 seedToLocalStorage() 即可） ---
export function seedToLocalStorage(prefix = 'mock:') {
	try {
		localStorage.setItem(`${prefix}users`, JSON.stringify(MOCK_USERS));
		localStorage.setItem(`${prefix}devices`, JSON.stringify(MOCK_DEVICES));
		localStorage.setItem(`${prefix}readings`, JSON.stringify(MOCK_SENSOR_READINGS));
		return true;
	} catch {
		return false;
	}
}
