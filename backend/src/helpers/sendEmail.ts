import nodemailer, { Transporter } from "nodemailer";
import "dotenv/config";
import ejs from "ejs";
import path from "path";

interface SendEmailOptions {
  subject: string;
  send_to: string;
  send_from: string;
  reply_to: string;
  template: string;
  data: { [key: string]: any };
}

const sendEmail = async ({
  subject,
  send_to,
  send_from,
  reply_to,
  template,
  data,
}: SendEmailOptions): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const templatePath = path.join(__dirname, "../mails", template);

  const html = await ejs.renderFile(templatePath, data);

  const mailOptions = {
    from: send_from,
    to: send_to,
    replyTo: reply_to,
    subject: subject,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${send_to}`);
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
};

export default sendEmail;
