export async function onRequestPost(context) {
  const { request, env } = context;

  const formData = await request.formData();

  // Honeypot check — silently reject if filled
  const honeypot = formData.get("full-name");
  if (honeypot && honeypot.trim() !== "") {
    return Response.redirect("/thanks", 302);
  }

  // Extract fields
  const email = formData.get("email");
  const name = formData.get("name");
  const postcode = formData.get("postcode");
  const details = formData.get("details");
  const source = formData.get("source");
  const sourceOther = formData.get("source-other");

  // Validate required fields
  if (!email || !name || !postcode || !details) {
    return Response.redirect("/contact?error=missing", 302);
  }

  // Store in D1
  try {
    await env.DB.prepare(
      `INSERT INTO submissions (email, name, postcode, details, source, source_other)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        email,
        name,
        postcode,
        details,
        source || null,
        sourceOther || null
      )
      .run();
  } catch (err) {
    console.error("D1 insert error:", err);
    return Response.redirect("/contact?error=server", 302);
  }

  // Email notification — enabled in Phase 4 after domain cutover
  // if (env.SEND_EMAIL) {
  //   try {
  //     await env.SEND_EMAIL.send({
  //       to: "your@email.com",
  //       from: "hello@pawsbuddy.co.uk",
  //       subject: "New Paws Buddy enquiry",
  //       text: `Name: ${name}\nEmail: ${email}\nPostcode: ${postcode}\nDetails: ${details}`
  //     });
  //   } catch (err) {
  //     console.error("Email error:", err);
  //   }
  // }

  return Response.redirect("/thanks", 302);
}
