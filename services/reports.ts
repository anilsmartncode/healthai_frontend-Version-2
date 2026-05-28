import { decryptResponse } from "@/utils/encryption";
import { ENDPOINTS } from "@/constants/api";
import type { Report, ApiAnalyzeResponse } from "@/types/Report/reportype";
import { mapApiLabValues } from "@/types/Report/reportype";

const apiFileCall = async (url: string, formData: FormData): Promise<ApiAnalyzeResponse> => {
  console.log("=== REQUEST ===");
  console.log("URL:", url);
  console.log("METHOD: POST (multipart/form-data)");
  console.log("===============");

  const response = await fetch(url, { method: "POST", body: formData });

  const rawData = await response.json();
  console.log("=== RAW RESPONSE ===");
  console.log("STATUS:", response.status);
  console.log(JSON.stringify(rawData, null, 2));
  console.log("====================");

  if (rawData?.iv && rawData?.data) {
    const decrypted = decryptResponse(rawData);
    console.log("=== DECRYPTED ===");
    console.log(JSON.stringify(decrypted, null, 2));
    console.log("=================");
    if (!response.ok) throw new Error(decrypted?.message || decrypted?.detail || "Request failed");
    return decrypted as ApiAnalyzeResponse;
  }

  if (!response.ok) throw new Error(rawData?.message || rawData?.detail || "Request failed");
  return rawData as ApiAnalyzeResponse;
};

export const reportsService = {
  list: async (): Promise<Report[]> => {
    console.log("[reportsService.list] no list endpoint yet — returning empty");
    return [];
  },

analyze: async (formData: FormData) => {
  const result = await apiFileCall(ENDPOINTS.analyzeReport, formData);

  // Handle both string and object summary shapes
  const summary = typeof result.summary === 'string'
    ? result.summary
    : result.summary
      ? JSON.stringify(result.summary)
      : '';

  return {
    reportId: result.report_id,
    patientName: result.data[0]?.['Patient Name'] ?? '',
    hospitalName: result.data[0]?.['Hospital Name'] ?? '',
    summary,
    values: mapApiLabValues(result.data),
  };
},
};