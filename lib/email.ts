const brevoApiKey = process.env.BREVO_API_KEY;
const fromEmail = process.env.EMAIL_FROM || "updates@societyapp.com";

async function sendEmail(to: string, subject: string, htmlContent: string) {
  if (!brevoApiKey) {
    console.error("[Email] Missing BREVO_API_KEY environment variable");
    return;
  }

  try {
    console.log(`[Email] Attempting to send email to ${to} via Brevo. Subject: "${subject}"`);

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    const data = await res.json();
    console.log(`[Email] Brevo API response:`, JSON.stringify(data));

    if (!res.ok) {
      console.error("[Email] Brevo API returned an error:", data);
    }
  } catch (error) {
    console.error("[Email] Failed to send email (Exception):", error);
  }
}

export async function sendComplaintStatusUpdateEmail(
  toEmail: string,
  complaintId: string,
  newStatus: string,
  note?: string | null
) {
  const isResolved = newStatus === "RESOLVED";
  const statusText = isResolved ? "Resolved and closed" : newStatus.replace("_", " ");
  const titleText = isResolved 
    ? "Your complaint has been resolved and closed."
    : "Your complaint status has been updated.";

  const html = `
    <h2>${titleText}</h2>
    <p><strong>Complaint ID:</strong> ${complaintId}</p>
    <p><strong>New Status:</strong> ${statusText}</p>
    ${note ? `<p><strong>Note:</strong> ${note}</p>` : ""}
  `;

  await sendEmail(toEmail, `Update on your complaint #${complaintId}`, html);
}

export async function sendComplaintCreatedEmail(
  toEmail: string,
  complaintId: string,
  category: string,
  description: string
) {
  const html = `
    <h2>We have received your complaint.</h2>
    <p>Thank you for letting us know. Our team will look into it shortly.</p>
    <p><strong>Complaint ID:</strong> ${complaintId}</p>
    <p><strong>Category:</strong> ${category}</p>
    <p><strong>Description:</strong> ${description}</p>
    <p>You can track the status on your dashboard.</p>
  `;

  await sendEmail(toEmail, `Complaint Received #${complaintId}`, html);
}

export async function sendComplaintPriorityUpdateEmail(
  toEmail: string,
  complaintId: string,
  newPriority: string
) {
  const html = `
    <h2>Your complaint priority has been updated.</h2>
    <p><strong>Complaint ID:</strong> ${complaintId}</p>
    <p><strong>New Priority:</strong> ${newPriority}</p>
  `;

  await sendEmail(toEmail, `Priority Update on complaint #${complaintId}`, html);
}

export async function sendComplaintNoteEmail(
  toEmail: string,
  complaintId: string,
  note: string
) {
  const html = `
    <h2>An admin has added a note to your complaint.</h2>
    <p><strong>Complaint ID:</strong> ${complaintId}</p>
    <p><strong>Note:</strong> ${note}</p>
  `;

  await sendEmail(toEmail, `New Note on complaint #${complaintId}`, html);
}
