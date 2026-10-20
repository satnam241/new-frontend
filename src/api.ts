// Device Fingerprint generator & API client helper

export const getOrCreateDeviceFingerprint = (): string => {
  let fp = localStorage.getItem('device_fp');
  if (!fp) {
    fp = 'fp_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('device_fp', fp);
  }
  return fp;
};

export const getStoredDeviceToken = (orderId: string): string | null => {
  return localStorage.getItem(`auth_token_${orderId}`);
};

export const storeDeviceToken = (orderId: string, token: string): void => {
  localStorage.setItem(`auth_token_${orderId}`, token);
};

export const getAdminToken = (): string | null => {
  return localStorage.getItem('admin_token');
};

export const setAdminToken = (token: string): void => {
  localStorage.setItem('admin_token', token);
};

export const removeAdminToken = (): void => {
  localStorage.removeItem('admin_token');
};

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const adminToken = getAdminToken();
  const deviceFp = getOrCreateDeviceFingerprint();

  const headers: Record<string, string> = {
    'x-device-fingerprint': deviceFp,
    ...(options.headers as Record<string, string>),
  };

  if (adminToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};
