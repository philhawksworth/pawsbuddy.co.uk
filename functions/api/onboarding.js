export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = new URL(request.url).origin;

  const formData = await request.formData();

  // Honeypot check — silently reject if filled
  const honeypot = formData.get("full-name");
  if (honeypot && honeypot.trim() !== "") {
    return Response.redirect(`${origin}/onboarding/thanks`, 302);
  }

  // Extract metadata from request headers
  const ip = request.headers.get("CF-Connecting-IP") || null;
  const userAgent = request.headers.get("User-Agent") || null;
  const referrer = request.headers.get("Referer") || null;

  // Insert submission
  let submissionId;
  try {
    const result = await env.DB.prepare(
      `INSERT INTO onboarding_submissions (ip, user_agent, referrer)
       VALUES (?, ?, ?)`
    )
      .bind(ip, userAgent, referrer)
      .run();
    submissionId = result.meta?.last_row_id;
  } catch (err) {
    console.error("D1 insert error (submission):", err);
    return Response.redirect(`${origin}/onboarding?error=server`, 302);
  }

  if (!submissionId) {
    console.error("Failed to get submission ID");
    return Response.redirect(`${origin}/onboarding?error=server`, 302);
  }

  // Insert each form field as an answer (excluding reserved fields)
  const reservedFields = new Set(["full-name"]);

  try {
    const stmt = env.DB.prepare(
      `INSERT INTO onboarding_answers (submission_id, question_key, answer_value)
       VALUES (?, ?, ?)`
    );

    for (const [key, value] of formData.entries()) {
      if (reservedFields.has(key)) continue;
      // Only insert non-empty values
      if (value && value.trim() !== "") {
        await stmt.bind(submissionId, key, value).run();
      }
    }
  } catch (err) {
    console.error("D1 insert error (answers):", err);
    return Response.redirect(`${origin}/onboarding?error=server`, 302);
  }

  return Response.redirect(`${origin}/onboarding/thanks`, 302);
}
