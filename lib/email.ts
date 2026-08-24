import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export async function sendComplaintStatusUpdateEmail(
  toEmail: string,
  complaintId: string,
  newStatus: string,
  note?: string | null
) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `Update on your complaint #${complaintId}`,
      html: `
        <h2>Your complaint status has been updated.</h2>
        <p><strong>Complaint ID:</strong> ${complaintId}</p>
        <p><strong>New Status:</strong> ${newStatus}</p>
        ${note ? `<p><strong>Note:</strong> ${note}</p>` : ""}
      `,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}
