import { APPLICATION_NAME } from "../../../config";
import { EmailSubjectEnum } from "../../enum";

interface IEmailData {
  code: string;
  subject: EmailSubjectEnum;
  title: EmailSubjectEnum;
  expiresIn: number;
}

const templates = {
  [EmailSubjectEnum.CONFIRM_EMAIL]: (data: IEmailData) => {
    return `
		<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Email Address</title>
    <style>
        /* Target Outlook specific layout fixes */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        /* Mobile Responsive adjustments */
        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; padding: 10px !important; }
            .otp-code { font-size: 28px !important; letter-spacing: 4px !important; }
        }
    </style>
</head>
<body style="background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                <td align="center" valign="top" width="600">
                <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;">
                    
                    <!-- Header/Logo Context Section -->
                    <tr>
                        <td align="center" style="padding: 30px 40px 10px 40px; font-size: 24px; font-weight: 700; color: #1a1a1a;">
                            <!-- Replace text with an <img src="logo.png"> tag if you want a branded logo -->
                            <span style="color: #4f46e5;">${APPLICATION_NAME}</span>
                        </td>
                    </tr>

                    <!-- Main Core Content -->
                    <tr>
                        <td style="padding: 20px 40px 30px 40px; text-align: center;">
                            <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">${data.title}</h2>
                            <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
                                Please use the following One-Time Password (OTP) to complete your account setup. This code is valid for <strong>${data.expiresIn / 60} minutes</strong>.
                            </p>
                            
                            <!-- Highlighted OTP Display Container Section -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <div class="otp-code" style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; color: #111827; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 14px 24px; display: inline-block; min-width: 160px; text-align: center;">
                                            ${data.code}
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 24px 0 0 0;">
                                For your security, do not share this verification code with anyone. 
                            </p>
                        </td>
                    </tr>

                    <!-- Footer Section -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
                            <p style="color: #9ca3af; font-size: 13px; line-height: 20px; margin: 0 0 8px 0;">
                                If you did not request this email, you can safely ignore it.
                            </p>
                            <p style="color: #9ca3af; font-size: 13px; line-height: 20px; margin: 0;">
                                &copy; 2026 ${APPLICATION_NAME} Inc. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
            </td>
        </tr>
    </table>

</body>
</html>
	`;
  },
  [EmailSubjectEnum.FORGOT_PASSWORD]: (data: IEmailData) => {
    return `
		<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Email Address</title>
    <style>
        /* Target Outlook specific layout fixes */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        /* Mobile Responsive adjustments */
        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; padding: 10px !important; }
            .otp-code { font-size: 28px !important; letter-spacing: 4px !important; }
        }
    </style>
</head>
<body style="background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                <td align="center" valign="top" width="600">
                <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;">
                    
                    <!-- Header/Logo Context Section -->
                    <tr>
                        <td align="center" style="padding: 30px 40px 10px 40px; font-size: 24px; font-weight: 700; color: #1a1a1a;">
                            <!-- Replace text with an <img src="logo.png"> tag if you want a branded logo -->
                            <span style="color: #4f46e5;">${APPLICATION_NAME}</span>
                        </td>
                    </tr>

                    <!-- Main Core Content -->
                    <tr>
                        <td style="padding: 20px 40px 30px 40px; text-align: center;">
                            <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">${data.title}</h2>
                            <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
                                Please use the following One-Time Password (OTP) to reset your password. This code is valid for <strong>${data.expiresIn / 60} minutes</strong>.
                            </p>
                            
                            <!-- Highlighted OTP Display Container Section -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <div class="otp-code" style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; color: #111827; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 14px 24px; display: inline-block; min-width: 160px; text-align: center;">
                                            ${data.code}
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 24px 0 0 0;">
                                For your security, do not share this verification code with anyone. 
                            </p>
                        </td>
                    </tr>

                    <!-- Footer Section -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
                            <p style="color: #9ca3af; font-size: 13px; line-height: 20px; margin: 0 0 8px 0;">
                                If you did not request this email, you can safely ignore it.
                            </p>
                            <p style="color: #9ca3af; font-size: 13px; line-height: 20px; margin: 0;">
                                &copy; 2026 ${APPLICATION_NAME} Inc. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
            </td>
        </tr>
    </table>

</body>
</html>
	`;
  },
  [EmailSubjectEnum.ENABLE_TWO_STEP_VERIFICATION]: (data: IEmailData) => {
    return `
		<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Email Address</title>
    <style>
        /* Target Outlook specific layout fixes */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        /* Mobile Responsive adjustments */
        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; padding: 10px !important; }
            .otp-code { font-size: 28px !important; letter-spacing: 4px !important; }
        }
    </style>
</head>
<body style="background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                <td align="center" valign="top" width="600">
                <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;">
                    
                    <!-- Header/Logo Context Section -->
                    <tr>
                        <td align="center" style="padding: 30px 40px 10px 40px; font-size: 24px; font-weight: 700; color: #1a1a1a;">
                            <!-- Replace text with an <img src="logo.png"> tag if you want a branded logo -->
                            <span style="color: #4f46e5;">${APPLICATION_NAME}</span>
                        </td>
                    </tr>

                    <!-- Main Core Content -->
                    <tr>
                        <td style="padding: 20px 40px 30px 40px; text-align: center;">
                            <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">${data.title}</h2>
                            <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
                                Please use the following One-Time Password (OTP) to enable two-step-verification. This code is valid for <strong>${data.expiresIn / 60} minutes</strong>.
                            </p>
                            
                            <!-- Highlighted OTP Display Container Section -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <div class="otp-code" style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; color: #111827; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 14px 24px; display: inline-block; min-width: 160px; text-align: center;">
                                            ${data.code}
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 24px 0 0 0;">
                                For your security, do not share this verification code with anyone. 
                            </p>
                        </td>
                    </tr>

                    <!-- Footer Section -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
                            <p style="color: #9ca3af; font-size: 13px; line-height: 20px; margin: 0 0 8px 0;">
                                If you did not request this email, you can safely ignore it.
                            </p>
                            <p style="color: #9ca3af; font-size: 13px; line-height: 20px; margin: 0;">
                                &copy; 2026 ${APPLICATION_NAME} Inc. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
            </td>
        </tr>
    </table>

</body>
</html>
	`;
  },
  [EmailSubjectEnum.LOGIN_CONFIRMATION]: (data: IEmailData) => {
    return `
		<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Email Address</title>
    <style>
        /* Target Outlook specific layout fixes */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        /* Mobile Responsive adjustments */
        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; padding: 10px !important; }
            .otp-code { font-size: 28px !important; letter-spacing: 4px !important; }
        }
    </style>
</head>
<body style="background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                <td align="center" valign="top" width="600">
                <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;">
                    
                    <!-- Header/Logo Context Section -->
                    <tr>
                        <td align="center" style="padding: 30px 40px 10px 40px; font-size: 24px; font-weight: 700; color: #1a1a1a;">
                            <!-- Replace text with an <img src="logo.png"> tag if you want a branded logo -->
                            <span style="color: #4f46e5;">${APPLICATION_NAME}</span>
                        </td>
                    </tr>

                    <!-- Main Core Content -->
                    <tr>
                        <td style="padding: 20px 40px 30px 40px; text-align: center;">
                            <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">${data.title}</h2>
                            <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
                                Please use the following One-Time Password (OTP) to confirm login. This code is valid for <strong>${data.expiresIn / 60} minutes</strong>.
                            </p>
                            
                            <!-- Highlighted OTP Display Container Section -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <div class="otp-code" style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; color: #111827; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 14px 24px; display: inline-block; min-width: 160px; text-align: center;">
                                            ${data.code}
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; line-height: 22px; margin: 24px 0 0 0;">
                                For your security, do not share this verification code with anyone. 
                            </p>
                        </td>
                    </tr>

                    <!-- Footer Section -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
                            <p style="color: #9ca3af; font-size: 13px; line-height: 20px; margin: 0 0 8px 0;">
                                If you did not request this email, you can safely ignore it.
                            </p>
                            <p style="color: #9ca3af; font-size: 13px; line-height: 20px; margin: 0;">
                                &copy; 2026 ${APPLICATION_NAME} Inc. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
            </td>
        </tr>
    </table>

</body>
</html>
	`;
  },
};

export const sendEmailTemplate = (data: IEmailData) => {
  return templates[data.subject](data);
};
