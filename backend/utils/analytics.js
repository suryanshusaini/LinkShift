const cleanReferrer = (value) => {
  if (!value) return "Direct";
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    return host || "Direct";
  } catch {
    return "Other";
  }
};

const parseUserAgent = (ua = "") => {
  const value = String(ua);
  let browser = "Other";
  if (/Edg\//i.test(value)) browser = "Edge";
  else if (/OPR\//i.test(value)) browser = "Opera";
  else if (/Chrome\//i.test(value)) browser = "Chrome";
  else if (/Firefox\//i.test(value)) browser = "Firefox";
  else if (/Safari\//i.test(value) && !/Chrome\//i.test(value)) browser = "Safari";

  let os = "Other";
  if (/Windows/i.test(value)) os = "Windows";
  else if (/Android/i.test(value)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(value)) os = "iOS";
  else if (/Mac OS X/i.test(value)) os = "macOS";
  else if (/Linux/i.test(value)) os = "Linux";

  return {
    browser,
    os,
    device: /Mobi|Android|iPhone|iPad|iPod/i.test(value) ? "Mobile" : "Desktop",
  };
};

module.exports = { cleanReferrer, parseUserAgent };
