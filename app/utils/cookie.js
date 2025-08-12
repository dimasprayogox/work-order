export const getCookie = (name) => {
    // Check if running in browser
    if (typeof document === 'undefined') {
        return null;
    }
    
    const nameLen = name.length + 1;
    return (
        document.cookie
            .split(";")
            .map((c) => c.trim())
            .filter((cookie) => cookie.substring(0, nameLen) === `${name}=`)
            .map((cookie) => decodeURIComponent(cookie.substring(nameLen)))[0] || null
    );
};

export const setCookie = (name, value, maxAge = 60 * 60 * 24) => {
    // Check if running in browser
    if (typeof document === 'undefined') {
        return;
    }
    
    // More robust cookie setting
    const cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = cookieString;
};

export const deleteCookie = (name) => {
    // Check if running in browser
    if (typeof document === 'undefined') {
        return;
    }
    
    document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
};
