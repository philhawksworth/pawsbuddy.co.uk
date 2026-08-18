-- Dynamic onboarding form: customer + service details, with a variable
-- number of pets per submission, stored as a proper one-to-many relation
-- (unlike the flat key/value pattern used by the earlier onboarding form).

CREATE TABLE IF NOT EXISTS onboarding_dynamic_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ip TEXT,
  user_agent TEXT,
  referrer TEXT,

  -- Customer details
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  address_line_2 TEXT,
  city_or_town TEXT NOT NULL,
  postcode TEXT NOT NULL,
  preferred_contact TEXT NOT NULL,
  alternate_contact_name TEXT,
  alternate_contact_details TEXT,
  commencement_date TEXT NOT NULL,

  -- Vet details
  has_vet TEXT NOT NULL,
  vet_name TEXT,
  vet_address TEXT,
  vet_phone TEXT,
  vet_email TEXT,
  vet_notes TEXT
);

CREATE TABLE IF NOT EXISTS onboarding_dynamic_pets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL REFERENCES onboarding_dynamic_submissions(id),
  pet_index INTEGER NOT NULL,

  -- Common fields, collected for every pet
  name TEXT NOT NULL,
  animal_type TEXT NOT NULL,
  age TEXT,
  insurance_company TEXT,
  insurance_policy_number TEXT,
  notes TEXT,

  -- Fields collected only when animal_type is 'cat' or 'dog'
  breed_description TEXT,
  gender TEXT,
  microchipped TEXT,
  microchip_expected_date TEXT,
  neutered TEXT,
  neuter_expected_date TEXT,
  cat_flap TEXT,
  medical_conditions TEXT,
  additional_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_onboarding_dynamic_pets_submission_id
  ON onboarding_dynamic_pets(submission_id);
