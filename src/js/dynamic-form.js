// Dynamic, page-by-page onboarding wizard.
//
// Unlike onboarding.js (which shows/hides a fixed set of fieldsets), this
// engine renders one step at a time from a small config-driven step
// resolver, because the number of steps depends on how many pets the
// customer wants to tell us about, and which follow-up questions apply
// depends on each pet's animal type.
//
// State persists to sessionStorage so answers survive reloads and the
// browser's back/forward buttons (implemented via the History API).
(function () {
  var root = document.getElementById("dynamic-form-root");
  if (!root) return;

  var errorBanner = document.getElementById("error-banner");
  var STORAGE_KEY = "pawsbuddy_dynamic_onboarding_v1";
  var FIRST_STEP = "customer-name";

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------

  function defaultPet() {
    return {
      name: "",
      animal_type: "",
      age: "",
      insurance_company: "",
      insurance_policy_number: "",
      notes: "",
      breed_description: "",
      gender: "",
      microchipped: "",
      microchip_expected_date: "",
      neutered: "",
      neuter_expected_date: "",
      cat_flap: "",
      medical_conditions: "",
      additional_notes: "",
      add_another: "",
    };
  }

  function defaultState() {
    return {
      honeypot: "",
      customer: {
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        address_line_2: "",
        city_or_town: "",
        postcode: "",
        preferred_contact: "",
        alternate_contact_name: "",
        alternate_contact_details: "",
        commencement_date: "",
      },
      pets: [defaultPet()],
      vet: {
        has_vet: "",
        vet_name: "",
        vet_address: "",
        vet_phone: "",
        vet_email: "",
        vet_notes: "",
      },
    };
  }

  function readStorage() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  var saved = readStorage();
  var state = (saved && saved.state) || defaultState();
  var currentStep = (saved && saved.step) || FIRST_STEP;

  function saveState() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state: state, step: currentStep })
      );
    } catch (e) {
      // sessionStorage unavailable (e.g. private browsing) — continue
      // without persistence rather than breaking the form.
    }
  }

  function clearState() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }

  function ensurePet(index) {
    while (state.pets.length <= index) {
      state.pets.push(defaultPet());
    }
  }

  function petAt(index) {
    ensurePet(index);
    return state.pets[index];
  }

  function getGroupObject(group) {
    if (group === "customer") return state.customer;
    if (group === "vet") return state.vet;
    var petMatch = /^pets\.(\d+)$/.exec(group);
    if (petMatch) return petAt(parseInt(petMatch[1], 10));
    throw new Error("Unknown field group: " + group);
  }

  // ---------------------------------------------------------------------
  // Field option sets
  // ---------------------------------------------------------------------

  var YES_NO_OPTIONS = [
    { value: "", label: "-- Please select --" },
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  var CONTACT_OPTIONS = [
    { value: "", label: "-- Please select --" },
    { value: "email", label: "Email" },
    { value: "text", label: "Text" },
    { value: "whatsapp", label: "WhatsApp" },
  ];

  var ANIMAL_TYPE_OPTIONS = [
    { value: "", label: "-- Please select --" },
    { value: "cat", label: "Cat" },
    { value: "dog", label: "Dog" },
    { value: "other", label: "Other" },
  ];

  var GENDER_OPTIONS = [
    { value: "", label: "-- Please select --" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];

  // ---------------------------------------------------------------------
  // Step configuration
  //
  // Each step config has: section (breadcrumb label), title, optional
  // description, and a list of field descriptors. Field descriptors have:
  // group (where the value lives in state), name, label, type, required,
  // options (for select fields) and an optional showIf(groupValues)
  // predicate for fields that only apply conditionally within the step.
  // ---------------------------------------------------------------------

  var PET_STEP_RE = /^pet-(\d+)-(basic|species|add-another)$/;

  function getStepConfig(stepId) {
    switch (stepId) {
      case "customer-name":
        return {
          section: "Your Details",
          title: "Your name",
          fields: [
            { group: "customer", name: "first_name", label: "First name", type: "text", required: true },
            { group: "customer", name: "last_name", label: "Last name", type: "text", required: true },
          ],
        };

      case "customer-contact":
        return {
          section: "Your Details",
          title: "Contact details",
          fields: [
            { group: "customer", name: "email", label: "Email", type: "email", required: true },
            { group: "customer", name: "phone", label: "Phone number", type: "tel", required: true },
          ],
        };

      case "customer-address":
        return {
          section: "Your Details",
          title: "Your address",
          fields: [
            { group: "customer", name: "address", label: "Address", type: "text", required: true },
            { group: "customer", name: "address_line_2", label: "Address line 2", type: "text" },
            { group: "customer", name: "city_or_town", label: "City or town", type: "text", required: true },
            { group: "customer", name: "postcode", label: "Postcode", type: "text", required: true },
          ],
        };

      case "customer-preferences":
        return {
          section: "Your Details",
          title: "Contact preferences",
          fields: [
            { group: "customer", name: "preferred_contact", label: "How would you like us to contact you?", type: "select", options: CONTACT_OPTIONS, required: true },
            { group: "customer", name: "alternate_contact_name", label: "Alternate contact name (optional)", type: "text" },
            { group: "customer", name: "alternate_contact_details", label: "Alternate contact phone or email (optional)", type: "text" },
          ],
        };

      case "customer-start-date":
        return {
          section: "Your Details",
          title: "Service start date",
          fields: [
            { group: "customer", name: "commencement_date", label: "When would you like the service to begin?", type: "date", required: true },
          ],
        };

      case "vet-has-vet":
        return {
          section: "Your Vet",
          title: "Do you have a vet?",
          fields: [
            { group: "vet", name: "has_vet", label: "Do you have a vet?", type: "select", options: YES_NO_OPTIONS, required: true },
          ],
        };

      case "vet-details":
        return {
          section: "Your Vet",
          title: "Your vet's details",
          fields: [
            { group: "vet", name: "vet_name", label: "Vet's name", type: "text", required: true },
            { group: "vet", name: "vet_address", label: "Vet's address", type: "text" },
            { group: "vet", name: "vet_phone", label: "Vet's phone number", type: "tel" },
            { group: "vet", name: "vet_email", label: "Vet's email", type: "email" },
            { group: "vet", name: "vet_notes", label: "Any other notes", type: "textarea" },
          ],
        };
    }

    var petMatch = PET_STEP_RE.exec(stepId);
    if (petMatch) {
      var index = parseInt(petMatch[1], 10) - 1;
      var stage = petMatch[2];
      var pet = petAt(index);
      var group = "pets." + index;
      var petLabel = pet.name && pet.name.trim() !== "" ? pet.name : "your pet";

      if (stage === "basic") {
        return {
          section: "Pet " + (index + 1),
          title: index === 0 ? "Tell us about your pet" : "Tell us about another pet",
          fields: [
            { group: group, name: "name", label: "Pet's name", type: "text", required: true },
            { group: group, name: "animal_type", label: "What kind of animal is " + petLabel + "?", type: "select", options: ANIMAL_TYPE_OPTIONS, required: true },
            { group: group, name: "age", label: "Age", type: "text" },
            { group: group, name: "insurance_company", label: "Pet insurance company", type: "text" },
            { group: group, name: "insurance_policy_number", label: "Pet insurance policy number", type: "text" },
            { group: group, name: "notes", label: "Any other notes", type: "textarea" },
          ],
        };
      }

      if (stage === "species") {
        var fields = [
          { group: group, name: "breed_description", label: "Breed or description of " + petLabel, type: "text" },
          { group: group, name: "gender", label: "Is " + petLabel + " male or female?", type: "select", options: GENDER_OPTIONS },
          { group: group, name: "microchipped", label: "Is " + petLabel + " microchipped?", type: "select", options: YES_NO_OPTIONS },
          { group: group, name: "microchip_expected_date", label: "When is " + petLabel + " expected to be microchipped?", type: "date", showIf: function (values) { return values.microchipped === "no"; } },
          { group: group, name: "neutered", label: pet.animal_type === "cat" ? "Has " + petLabel + " been neutered?" : "Has " + petLabel + " been neutered or spayed?", type: "select", options: YES_NO_OPTIONS },
          { group: group, name: "neuter_expected_date", label: "When is " + petLabel + " expected to be neutered?", type: "date", showIf: function (values) { return values.neutered === "no"; } },
        ];
        if (pet.animal_type === "cat") {
          fields.push({ group: group, name: "cat_flap", label: "Does " + petLabel + " have a cat flap?", type: "select", options: YES_NO_OPTIONS });
        }
        fields.push({ group: group, name: "medical_conditions", label: "Does " + petLabel + " have any medical conditions, allergies or medication?", type: "textarea" });
        fields.push({ group: group, name: "additional_notes", label: "Any other notes about " + petLabel + "?", type: "textarea" });
        return {
          section: "Pet " + (index + 1),
          title: "About " + petLabel,
          fields: fields,
        };
      }

      if (stage === "add-another") {
        return {
          section: "Pet " + (index + 1),
          title: "Add another pet?",
          fields: [
            { group: group, name: "add_another", label: "Would you like to tell us about another pet?", type: "select", options: YES_NO_OPTIONS, required: true },
          ],
        };
      }
    }

    return null;
  }

  // ---------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------

  function nextStepId(stepId) {
    switch (stepId) {
      case "customer-name":
        return "customer-contact";
      case "customer-contact":
        return "customer-address";
      case "customer-address":
        return "customer-preferences";
      case "customer-preferences":
        return "customer-start-date";
      case "customer-start-date":
        ensurePet(0);
        return "pet-1-basic";
      case "vet-has-vet":
        return state.vet.has_vet === "yes" ? "vet-details" : null;
      case "vet-details":
        return null;
    }

    var petMatch = PET_STEP_RE.exec(stepId);
    if (petMatch) {
      var index = parseInt(petMatch[1], 10) - 1;
      var stage = petMatch[2];
      var pet = petAt(index);

      if (stage === "basic") {
        if (pet.animal_type === "cat" || pet.animal_type === "dog") {
          return "pet-" + (index + 1) + "-species";
        }
        return "pet-" + (index + 1) + "-add-another";
      }
      if (stage === "species") {
        return "pet-" + (index + 1) + "-add-another";
      }
      if (stage === "add-another") {
        if (pet.add_another === "yes") {
          ensurePet(index + 1);
          return "pet-" + (index + 2) + "-basic";
        }
        return "vet-has-vet";
      }
    }

    return null;
  }

  function prevStepId(stepId) {
    switch (stepId) {
      case "customer-name":
        return null;
      case "customer-contact":
        return "customer-name";
      case "customer-address":
        return "customer-contact";
      case "customer-preferences":
        return "customer-address";
      case "customer-start-date":
        return "customer-preferences";
      case "vet-has-vet":
        var lastIndex = state.pets.length - 1;
        return "pet-" + (lastIndex + 1) + "-add-another";
      case "vet-details":
        return "vet-has-vet";
    }

    var petMatch = PET_STEP_RE.exec(stepId);
    if (petMatch) {
      var index = parseInt(petMatch[1], 10) - 1;
      var stage = petMatch[2];
      var pet = petAt(index);

      if (stage === "basic") {
        if (index === 0) return "customer-start-date";
        return "pet-" + index + "-add-another";
      }
      if (stage === "species") {
        return "pet-" + (index + 1) + "-basic";
      }
      if (stage === "add-another") {
        if (pet.animal_type === "cat" || pet.animal_type === "dog") {
          return "pet-" + (index + 1) + "-species";
        }
        return "pet-" + (index + 1) + "-basic";
      }
    }

    return null;
  }

  function isFinalStep(stepId) {
    if (stepId === "vet-details") return true;
    if (stepId === "vet-has-vet") return state.vet.has_vet === "no";
    return false;
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------

  function buildInput(field, value) {
    var id = field.name + (field.group.indexOf("pets.") === 0 ? "-" + field.group.split(".")[1] : "");
    var input;

    if (field.type === "textarea") {
      input = document.createElement("textarea");
    } else if (field.type === "select") {
      input = document.createElement("select");
      field.options.forEach(function (opt) {
        var option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        input.appendChild(option);
      });
    } else {
      input = document.createElement("input");
      input.type = field.type;
    }

    input.id = id;
    input.name = id;
    input.value = value || "";
    if (field.required) input.classList.add("required");

    return input;
  }

  function renderStep(stepId, options) {
    options = options || {};
    var config = getStepConfig(stepId);
    if (!config) {
      // Unknown/unreachable step (e.g. stale URL from another session) —
      // fall back to the start rather than showing a broken page.
      stepId = FIRST_STEP;
      config = getStepConfig(stepId);
    }

    currentStep = stepId;
    saveState();

    if (!options.skipHistory) {
      var url = "?step=" + encodeURIComponent(stepId);
      if (options.replace) {
        history.replaceState({ step: stepId }, "", url);
      } else {
        history.pushState({ step: stepId }, "", url);
      }
    }

    if (errorBanner) errorBanner.hidden = true;

    root.innerHTML = "";

    var progress = document.createElement("p");
    progress.className = "progress-indicator";
    progress.setAttribute("aria-live", "polite");
    progress.textContent = config.section;
    root.appendChild(progress);

    var form = document.createElement("form");
    form.className = "dynamic-form";
    form.setAttribute("novalidate", "novalidate");

    var heading = document.createElement("h2");
    heading.textContent = config.title;
    form.appendChild(heading);

    if (config.description) {
      var desc = document.createElement("p");
      desc.className = "field-hint";
      desc.textContent = config.description;
      form.appendChild(desc);
    }

    if (stepId === FIRST_STEP) {
      form.appendChild(buildHoneypot());
    }

    var wrappersByName = {};

    config.fields.forEach(function (field) {
      var groupValues = getGroupObject(field.group);
      var wrapper = document.createElement("p");
      var label = document.createElement("label");
      var input = buildInput(field, groupValues[field.name]);
      label.setAttribute("for", input.id);
      label.textContent = field.label;
      wrapper.appendChild(label);
      wrapper.appendChild(input);

      if (field.showIf) {
        wrapper.hidden = !field.showIf(groupValues);
      }

      wrappersByName[field.name] = wrapper;

      function syncFromInput() {
        groupValues[field.name] = input.value;
        saveState();
        input.classList.remove("needs-content");
      }

      input.addEventListener("input", syncFromInput);
      input.addEventListener("change", function () {
        syncFromInput();
        refreshConditionalFields(config, groupValues, wrappersByName);
        refreshNavButtons(stepId, navButtons);
      });

      form.appendChild(wrapper);
    });

    var navButtons = buildNavButtons(stepId);
    form.appendChild(navButtons);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      handleAdvance(stepId, form);
    });

    root.appendChild(form);
  }

  function buildHoneypot() {
    var wrapper = document.createElement("p");
    wrapper.className = "nope";
    var label = document.createElement("label");
    label.setAttribute("for", "full-name");
    label.textContent = "Your full name, no really";
    var input = document.createElement("input");
    input.type = "text";
    input.id = "full-name";
    input.name = "full-name";
    input.value = state.honeypot || "";
    input.addEventListener("input", function () {
      state.honeypot = input.value;
      saveState();
    });
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }

  function refreshConditionalFields(config, groupValues, wrappersByName) {
    config.fields.forEach(function (field) {
      if (!field.showIf) return;
      var wrapper = wrappersByName[field.name];
      if (wrapper) wrapper.hidden = !field.showIf(groupValues);
    });
  }

  function buildNavButtons(stepId) {
    var wrap = document.createElement("p");
    wrap.className = "nav-buttons";

    var prev = prevStepId(stepId);
    if (prev) {
      var prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "btn-prev";
      prevBtn.textContent = "Previous";
      prevBtn.addEventListener("click", function () {
        handleBack(stepId);
      });
      wrap.appendChild(prevBtn);
    }

    var nextBtn = document.createElement("button");
    nextBtn.type = "submit";
    nextBtn.className = "btn-next";
    nextBtn.textContent = isFinalStep(stepId) ? "Submit" : "Next";
    wrap.appendChild(nextBtn);

    return wrap;
  }

  function refreshNavButtons(stepId, navButtons) {
    var btn = navButtons.querySelector(".btn-next");
    if (btn) btn.textContent = isFinalStep(stepId) ? "Submit" : "Next";
  }

  // ---------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------

  function validateStep(form) {
    var valid = true;
    var required = form.querySelectorAll(".required");
    for (var i = 0; i < required.length; i++) {
      var field = required[i];
      if (field.closest("[hidden]")) continue;
      if (!field.value || field.value.trim() === "") {
        field.classList.add("needs-content");
        valid = false;
      } else {
        field.classList.remove("needs-content");
      }
    }
    return valid;
  }

  // ---------------------------------------------------------------------
  // Flow control
  // ---------------------------------------------------------------------

  function handleAdvance(stepId, form) {
    if (!validateStep(form)) return;

    if (isFinalStep(stepId)) {
      submitForm();
      return;
    }

    var next = nextStepId(stepId);
    if (!next) {
      submitForm();
      return;
    }

    renderStep(next);
    window.scrollTo(0, 0);
  }

  function handleBack(stepId) {
    var prev = prevStepId(stepId);
    if (!prev) return;
    renderStep(prev);
    window.scrollTo(0, 0);
  }

  function buildPayload() {
    var pets = state.pets
      .filter(function (pet) {
        return pet.name && pet.name.trim() !== "";
      })
      .map(function (pet) {
        var copy = {};
        Object.keys(pet).forEach(function (key) {
          if (key === "add_another") return;
          copy[key] = pet[key];
        });
        return copy;
      });

    return {
      honeypot: state.honeypot,
      customer: state.customer,
      pets: pets,
      vet: state.vet,
    };
  }

  function submitForm() {
    var submitBtn = root.querySelector(".btn-next");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
    }

    fetch("/api/onboarding-dynamic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Server responded with " + res.status);
        return res.json();
      })
      .then(function (data) {
        clearState();
        window.location.href = (data && data.redirect) || "/onboarding-dynamic/thanks";
      })
      .catch(function (err) {
        console.error("Dynamic onboarding submit error:", err);
        if (errorBanner) errorBanner.hidden = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit";
        }
      });
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------

  window.addEventListener("popstate", function (e) {
    var step = (e.state && e.state.step) || FIRST_STEP;
    renderStep(step, { skipHistory: true });
  });

  renderStep(currentStep, { replace: true });
})();
