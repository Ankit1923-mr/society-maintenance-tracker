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
    const isResolved = newStatus === "RESOLVED";
    const statusText = isResolved ? "Resolved and closed" : newStatus.replace("_", " ");
    const titleText = isResolved 
      ? "Your complaint has been resolved and closed."
      : "Your complaint status has been updated.";

    console.log(`[Email] Attempting to send status update email to ${toEmail} for complaint #${complaintId}`);

    const response = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `Update on your complaint #${complaintId}`,
      html: `
        <h2>${titleText}</h2>
        <p><strong>Complaint ID:</strong> ${complaintId}</p>
        <p><strong>New Status:</strong> ${statusText}</p>
        ${note ? `<p><strong>Note:</strong> ${note}</p>` : ""}
      `,
    });

    console.log(`[Email] Resend API response:`, JSON.stringify(response));

    if (response.error) {
      console.error("[Email] Resend returned an error:", response.error);
    }
  } catch (error) {
    console.error("[Email] Failed to send email (Exception):", error);
  }
}

export async function sendComplaintCreatedEmail(
  toEmail: string,
  complaintId: string,
  category: string,
  description: string
) {
  try {
    console.log(`[Email] Attempting to send creation email to ${toEmail} for complaint #${complaintId}`);

    const response = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `Complaint Received #${complaintId}`,
      html: `
        <h2>We have received your complaint.</h2>
        <p>Thank you for letting us know. Our team will look into it shortly.</p>
        <p><strong>Complaint ID:</strong> ${complaintId}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p>You can track the status on your dashboard.</p>
      `,
    });

    console.log(`[Email] Resend API response:`, JSON.stringify(response));

    if (response.error) {
      console.error("[Email] Resend returned an error:", response.error);
    }
  } catch (error) {
    console.error("[Email] Failed to send creation email (Exception):", error);
  }
}
