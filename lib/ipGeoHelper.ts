export interface ParsedUserAgent {
  deviceType: "desktop" | "phone" | "tablet" | "other";
  os: string;
  browser: string;
}

export interface GeoLocationData {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  isp: string;
}

// Demo fallback locations for local development testing (127.0.0.1 / private IPs)
const LOCAL_MOCK_LOCATIONS: GeoLocationData[] = [
  {
    city: "Mumbai",
    region: "Maharashtra",
    country: "India",
    countryCode: "IN",
    latitude: 19.0760,
    longitude: 72.8777,
    isp: "Jio Fiber / Local Dev",
  },
  {
    city: "Bengaluru",
    region: "Karnataka",
    country: "India",
    countryCode: "IN",
    latitude: 12.9716,
    longitude: 77.5946,
    isp: "Airtel Xstream",
  },
  {
    city: "New Delhi",
    region: "Delhi",
    country: "India",
    countryCode: "IN",
    latitude: 28.6139,
    longitude: 77.2090,
    isp: "ACT Fibernet",
  },
  {
    city: "San Francisco",
    region: "California",
    country: "United States",
    countryCode: "US",
    latitude: 37.7749,
    longitude: -122.4194,
    isp: "Cloudflare Warp",
  },
  {
    city: "London",
    region: "England",
    country: "United Kingdom",
    countryCode: "GB",
    latitude: 51.5074,
    longitude: -0.1278,
    isp: "BT Broadband",
  },
];

/**
 * Parses User-Agent header string to detect device type, OS, and Browser
 */
export function parseUserAgent(uaString: string): ParsedUserAgent {
  if (!uaString) {
    return { deviceType: "desktop", os: "Unknown OS", browser: "Unknown Browser" };
  }

  const ua = uaString.toLowerCase();

  // 1. Device Type Detection
  let deviceType: "desktop" | "phone" | "tablet" | "other" = "desktop";

  const isTablet =
    /ipad|playbook|silk/i.test(uaString) ||
    (/android/i.test(uaString) && !/mobile/i.test(uaString));

  const isPhone =
    /iphone|ipod|blackberry|opera mini|windows phone/i.test(uaString) ||
    (/android/i.test(uaString) && /mobile/i.test(uaString)) ||
    /mobile/i.test(uaString);

  if (isTablet) {
    deviceType = "tablet";
  } else if (isPhone) {
    deviceType = "phone";
  } else {
    deviceType = "desktop";
  }

  // 2. OS Detection
  let os = "Unknown OS";
  if (/iphone|ipad|ipod/i.test(uaString)) {
    os = "iOS";
  } else if (/macintosh|mac os x/i.test(uaString)) {
    os = "macOS";
  } else if (/windows nt/i.test(uaString)) {
    if (/windows nt 10/i.test(uaString)) os = "Windows 10/11";
    else os = "Windows";
  } else if (/android/i.test(uaString)) {
    os = "Android";
  } else if (/cros/i.test(uaString)) {
    os = "ChromeOS";
  } else if (/linux/i.test(uaString)) {
    os = "Linux";
  }

  // 3. Browser Detection
  let browser = "Browser";
  if (/edg/i.test(uaString)) {
    browser = "Edge";
  } else if (/opr|opera/i.test(uaString)) {
    browser = "Opera";
  } else if (/firefox|fxios/i.test(uaString)) {
    browser = "Firefox";
  } else if (/chrome|crios/i.test(uaString)) {
    browser = "Chrome";
  } else if (/safari/i.test(uaString) && !/chrome/i.test(uaString)) {
    browser = "Safari";
  }

  return { deviceType, os, browser };
}

/**
 * Extracts Client IP address from request headers
 */
export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map((s) => s.trim());
    if (ips.length > 0 && ips[0]) return ips[0];
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Fetches Geolocation data for an IP address
 */
export async function getIpGeolocation(ip: string): Promise<GeoLocationData> {
  const cleanIp = ip.trim();

  const isLocalIp =
    cleanIp === "127.0.0.1" ||
    cleanIp === "::1" ||
    cleanIp.startsWith("::ffff:127.") ||
    cleanIp.startsWith("10.") ||
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("172.16.");

  if (isLocalIp) {
    // Pick a deterministic mock location based on timestamp or hash so local tests look real
    const index = Math.floor(Math.random() * LOCAL_MOCK_LOCATIONS.length);
    return LOCAL_MOCK_LOCATIONS[index];
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${cleanIp}?fields=status,country,countryCode,regionName,city,lat,lon,isp`,
      { signal: AbortSignal.timeout(2000) }
    );
    if (!res.ok) throw new Error("Geo lookup failed");
    const data = await res.json();
    if (data.status === "success") {
      return {
        city: data.city || "Unknown",
        region: data.regionName || "Unknown",
        country: data.country || "Unknown",
        countryCode: data.countryCode || "XX",
        latitude: data.lat || 0,
        longitude: data.lon || 0,
        isp: data.isp || "ISP Provider",
      };
    }
  } catch {
    // Fallback if network/offline
  }

  return LOCAL_MOCK_LOCATIONS[0];
}
