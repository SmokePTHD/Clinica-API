import formData from "form-data";
import Mailgun from "mailgun.js";
import dotenv from "dotenv";

dotenv.config();

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAIL_API_KEY,
  url: "https://api.eu.mailgun.net",
});

export default mg;
