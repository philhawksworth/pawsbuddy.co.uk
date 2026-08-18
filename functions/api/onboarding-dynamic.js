// Handles submissions from the dynamic, page-by-page onboarding wizard
// (src/js/dynamic-form.js). Unlike the flat-form endpoints on this site,
// the client sends a single JSON payload since the number of pets is
// variable and the data is naturally structured (customer, pets[], vet).

const CUSTOMER_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "address",
  "address_line_2",
  "city_or_town",
  "postcode",
  "preferred_contact",
  "alternate_contact_name",
  "alternate_contact_details",
  "commencement_date",
];

const CUSTOMER_REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "address",
  "city_or_town",
  "postcode",
  "preferred_contact",
  "commencement_date",
];

const VET_FIELDS = ["vet_name", "vet_address", "vet_phone", "vet_email", "vet_notes"];

const PET_FIELDS = [
  "name",
  "animal_type",
  "age",
  "insurance_company",
  "insurance_policy_number",
  "notes",
  "breed_description",
  "gender",
  "microchipped",
  "microchip_expected_date",
  "neutered",
  "neuter_expected_date",
  "cat_flap",
  "medical_conditions",
  "additional_notes",
];

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

function pick(source, keys) {
  const out = {};
  for (const key of keys) {
    const value = source && source[key];
    out[key] = value === undefined || value === null ? null : String(value);
  }
  return out;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch (err) {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  // Honeypot check — silently accept but discard, so bots don't learn anything
  if (payload.honeypot && String(payload.honeypot).trim() !== "") {
    return jsonResponse({ ok: true });
  }

  const customer = payload.customer || {};
  const vet = payload.vet || {};
  const pets = Array.isArray(payload.pets) ? payload.pets : [];

  // Validate required customer fields
  for (const field of CUSTOMER_REQUIRED_FIELDS) {
    if (!customer[field] || String(customer[field]).trim() === "") {
      return jsonResponse({ error: `Missing required field: ${field}` }, 400);
    }
  }

  if (!vet.has_vet) {
    return jsonResponse({ error: "Missing required field: has_vet" }, 400);
  }

  if (pets.length === 0) {
    return jsonResponse({ error: "At least one pet is required" }, 400);
  }

  for (const pet of pets) {
    if (!pet.name || !pet.animal_type) {
      return jsonResponse({ error: "Each pet requires a name and animal type" }, 400);
    }
  }

  const ip = request.headers.get("CF-Connecting-IP") || null;
  const userAgent = request.headers.get("User-Agent") || null;
  const referrer = request.headers.get("Referer") || null;

  const customerValues = pick(customer, CUSTOMER_FIELDS);
  const vetValues = pick(vet, VET_FIELDS);

  let submissionId;
  try {
    const result = await env.DB.prepare(
      `INSERT INTO onboarding_dynamic_submissions (
         ip, user_agent, referrer,
         first_name, last_name, email, phone,
         address, address_line_2, city_or_town, postcode,
         preferred_contact, alternate_contact_name, alternate_contact_details,
         commencement_date,
         has_vet, vet_name, vet_address, vet_phone, vet_email, vet_notes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        ip,
        userAgent,
        referrer,
        customerValues.first_name,
        customerValues.last_name,
        customerValues.email,
        customerValues.phone,
        customerValues.address,
        customerValues.address_line_2,
        customerValues.city_or_town,
        customerValues.postcode,
        customerValues.preferred_contact,
        customerValues.alternate_contact_name,
        customerValues.alternate_contact_details,
        customerValues.commencement_date,
        String(vet.has_vet),
        vetValues.vet_name,
        vetValues.vet_address,
        vetValues.vet_phone,
        vetValues.vet_email,
        vetValues.vet_notes
      )
      .run();
    submissionId = result.meta?.last_row_id;
  } catch (err) {
    console.error("D1 insert error (submission):", err);
    return jsonResponse({ error: "Server error" }, 500);
  }

  if (!submissionId) {
    console.error("Failed to get submission ID");
    return jsonResponse({ error: "Server error" }, 500);
  }

  try {
    const stmt = env.DB.prepare(
      `INSERT INTO onboarding_dynamic_pets (
         submission_id, pet_index,
         name, animal_type, age, insurance_company, insurance_policy_number, notes,
         breed_description, gender, microchipped, microchip_expected_date,
         neutered, neuter_expected_date, cat_flap, medical_conditions, additional_notes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (let i = 0; i < pets.length; i++) {
      const petValues = pick(pets[i], PET_FIELDS);
      await stmt
        .bind(
          submissionId,
          i + 1,
          petValues.name,
          petValues.animal_type,
          petValues.age,
          petValues.insurance_company,
          petValues.insurance_policy_number,
          petValues.notes,
          petValues.breed_description,
          petValues.gender,
          petValues.microchipped,
          petValues.microchip_expected_date,
          petValues.neutered,
          petValues.neuter_expected_date,
          petValues.cat_flap,
          petValues.medical_conditions,
          petValues.additional_notes
        )
        .run();
    }
  } catch (err) {
    console.error("D1 insert error (pets):", err);
    return jsonResponse({ error: "Server error" }, 500);
  }

  return jsonResponse({ ok: true, redirect: "/onboarding-dynamic/thanks" });
}
