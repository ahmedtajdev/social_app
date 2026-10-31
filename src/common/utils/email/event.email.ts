import { EventEmitter } from "node:events";
import { sendEmailTemplate } from "./templates.email";
import { sendEmail } from "./send.email";
import { EmailSubjectEnum } from "../../enum";

export const emailEvent = new EventEmitter();

emailEvent.on(
  "sendEmail",
  async ({
    recipients,
    subject,
    data,
  }: {
    recipients: { to?: string[]; cc?: string[]; bcc?: string[] };
    subject: EmailSubjectEnum;
    data: any;
  }) => {
    try {
      await sendEmail({
        ...recipients,
        subject,
        html: sendEmailTemplate({
          code: data.code,
          subject,
          title: data.title,
          expiresIn: data.expiresIn,
        }),
      });
    } catch (error) {
      throw error;
    }
  },
);
