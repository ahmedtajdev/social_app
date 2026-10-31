import nodemailer from "nodemailer";
import { APP_EMAIL, APP_PASSWORD, APPLICATION_NAME } from "../../../config.js";
import { BadRequestException } from "../../exception";
import { MailComposerAttachment } from "nodemailer/lib/mail-composer";

export const userEmailKey = ({
  email,
  subject,
}: {
  email: string;
  subject: string;
}) => {
  return `User::${email.trim().toLowerCase()}::${subject}_OTP`;
};

export const userEmailTrialsKey = ({
  email,
  subject,
}: {
  email: string;
  subject: string;
}) => {
  return `${userEmailKey({ email, subject })}::Trials`;
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: APP_EMAIL,
    pass: APP_PASSWORD,
  },
});

export const sendEmail = async ({
  to,
  cc,
  bcc,
  subject,
  text,
  html,
  attachments = [],
}: {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  text: string;
  html: string;
  attachments: MailComposerAttachment[];
}) => {
  try {
    if (!to?.length && !cc?.length && bcc?.length) {
      throw new BadRequestException("Missing email recipients");
    }

    if (!text?.length && !html?.length && !attachments?.length) {
      throw new BadRequestException("Missing email content");
    }
    const info = await transporter.sendMail({
      from: `"${APPLICATION_NAME}" <${APP_EMAIL}>`, // sender address
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments,
    });

    console.log("Message sent: %s", info.messageId);
    // Preview URL is only available when using an Ethereal test account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
};
