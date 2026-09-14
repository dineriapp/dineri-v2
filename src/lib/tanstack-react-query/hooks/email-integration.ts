import {
  sendTestTemplateEmail,
  testSmtpConfig,
  verifySmtpCode,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/settings/email/actions";
import { EmailTemplates } from "@/app/(dashboard)/dashboard/(with-sidebar)/settings/email/types";
import { SmtpTestInput } from "@/lib/validators/zod/smtp";
import { useMutation } from "@tanstack/react-query";

export function useTestSmtpConfig() {
  return useMutation({
    mutationFn: async (input: SmtpTestInput) => {
      const result = await testSmtpConfig(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

export function useVerifySmtpCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const result = await verifySmtpCode(code);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

export function useSendTestTemplateEmail() {
  return useMutation({
    mutationFn: async (templateKey: keyof EmailTemplates) => {
      const result = await sendTestTemplateEmail(templateKey);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}
