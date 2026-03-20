export const getStorageKey = (key) => {
  const isDemo = localStorage.getItem('demoMode') === 'true';
  if (isDemo) return `demo_${key}`;

  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.email) {
        return `${key}_${user.email}`;
      }
    } catch(e) {
      console.error("Error parsing user from localStorage", e);
    }
  }
  return key; // Fallback if no user is logged in
};

export const getStorageData = (key) => {
  return localStorage.getItem(getStorageKey(key));
};

export const setStorageData = (key, value) => {
  localStorage.setItem(getStorageKey(key), value);
};

export const removeStorageData = (key) => {
  localStorage.removeItem(getStorageKey(key));
};
