(function () {
  const page = document.body.dataset.page;
  const MAKE_BOOKING_WEBHOOK_URL = "";

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  const toast = (message) => {
    const existing = document.querySelector(".toast-message");
    if (existing) existing.remove();

    const el = document.createElement("div");
    el.className = "toast-message";
    el.textContent = message;
    Object.assign(el.style, {
      position: "fixed",
      left: "50%",
      bottom: "78px",
      transform: "translateX(-50%)",
      background: "#082008",
      color: "#fff",
      padding: "12px 18px",
      zIndex: "40",
      boxShadow: "0 8px 24px rgba(0,0,0,.25)",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  };

  const openModal = (content) => {
    const old = document.querySelector(".modal-backdrop");
    if (old) old.remove();

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><button class="close-button" type="button" aria-label="Close">X</button>${content}</div>`;
    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop || event.target.classList.contains("close-button")) {
        backdrop.remove();
      }
    });

    const firstInput = backdrop.querySelector("input, textarea, select, button");
    if (firstInput) firstInput.focus();
    return backdrop;
  };

  const contactForm = `
    <h2>Contact STEMATOUR</h2>
    <form data-contact-form>
      <label>Name<input type="text" name="name" required></label>
      <label>Email<input type="email" name="email" required></label>
      <label>Message<textarea name="message" rows="5" required></textarea></label>
      <button class="primary-button" type="submit">Send Message</button>
    </form>
  `;

  const bookingForm = `
    <h2>Book a Tour</h2>
    <form class="booking-form" data-booking-form>
      <input type="hidden" name="source" value="Booking modal">
      <label>Full Name<input type="text" name="fullName" autocomplete="name" required></label>
      <label>Email<input type="email" name="email" autocomplete="email" required></label>
      <label>Phone Number<input type="tel" name="phone" autocomplete="tel" required></label>
      <label>Destination<select name="destination" required><option value="">Choose one</option><option>Beach Tour</option><option>Parks and Nature</option><option>Restaurant/Food Trip</option><option>Tourist Guide Team</option><option>Custom Tour</option></select></label>
      <label>Preferred Date<input type="date" name="preferredDate" required></label>
      <label>Preferred Time<input type="time" name="preferredTime" required></label>
      <label>Number of Guests<input type="number" name="guests" min="1" max="60" value="1" required></label>
      <label>Pickup / Meeting Place<input type="text" name="meetingPlace" placeholder="Example: Mauban town proper" required></label>
      <label class="full-field">Special Requests<textarea name="message" rows="4" placeholder="Tell us about your plan, budget, accessibility needs, or questions."></textarea></label>
      <label class="checkbox-field full-field"><input type="checkbox" name="consent" value="yes" required><span>I agree to share my booking details with STEMATOUR for tour coordination.</span></label>
      <button class="primary-button" type="submit">Send Request</button>
    </form>
  `;

  document.addEventListener("click", (event) => {
    const contact = event.target.closest("[data-open-contact]");
    const book = event.target.closest("[data-book-now]");
    const notify = event.target.closest("[data-notify]");

    if (contact) {
      event.preventDefault();
      openModal(contactForm);
    }

    if (book) {
      event.preventDefault();
      openModal(bookingForm);
    }

    if (notify) {
      toast("No new notifications right now.");
    }
  });

  const buildSubmissionPayload = (form, type) => ({
    type,
    page: document.title,
    pageUrl: window.location.href,
    createdAt: new Date().toISOString(),
    ...Object.fromEntries(new FormData(form).entries()),
  });

  const saveLocalSubmission = (key, payload) => {
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    saved.push(payload);
    localStorage.setItem(key, JSON.stringify(saved));
  };

  const sendBookingToMake = async (payload) => {
    if (!MAKE_BOOKING_WEBHOOK_URL) return false;

    const body = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => body.append(key, value));

    await fetch(MAKE_BOOKING_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      body,
    });

    return true;
  };

  document.addEventListener("submit", async (event) => {
    const contact = event.target.closest("[data-contact-form]");
    const booking = event.target.closest("[data-booking-form]");

    if (!contact && !booking) return;
    event.preventDefault();

    const key = booking ? "stematourBookings" : "stematourMessages";
    const payload = buildSubmissionPayload(event.target, booking ? "booking" : "contact");
    const submitButton = event.target.querySelector("button[type='submit']");

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = booking ? "Sending..." : "Saving...";
    }

    try {
      if (booking) {
        const sentToMake = await sendBookingToMake(payload);
        saveLocalSubmission(key, { ...payload, makeStatus: sentToMake ? "sent" : "webhook_not_configured" });
      } else {
        saveLocalSubmission(key, payload);
      }

      event.target.reset();
      const modal = event.target.closest(".modal-backdrop");
      if (modal) modal.remove();
      toast(booking ? "Booking request sent." : "Message saved.");
    } catch (error) {
      saveLocalSubmission(key, { ...payload, makeStatus: "failed", error: error.message });
      toast("Could not send online, but your request was saved locally.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = booking ? "Send Request" : "Send Message";
      }
    }
  });

  const chatReplies = [
    {
      terms: ["beach", "cagbalete", "choleng", "dona", "island", "resort"],
      answer: "For beach trips, I recommend the Dona Choleng and Cagbalete route. You can check huts, rooms, tents, and beach gallery photos on the Beach page. Bring extra clothes, sun protection, and water.",
    },
    {
      terms: ["park", "parks", "falls", "waterfall", "bisabis", "lake", "nature", "plaza"],
      answer: "For parks and nature, visit Bisabis Falls for a waterfall stop, Lake View for calm photos, and the Town Plaza for local events. Morning visits are best because the weather is cooler.",
    },
    {
      terms: ["restaurant", "food", "eat", "luto", "lutong", "nipaog", "delicacy", "delicacies"],
      answer: "For food, try Lutong Bahay and House of Nipaog on Enverga Street, Bagong Bayan. It is good for local dishes, family meals, and Mauban-style food stops.",
    },
    {
      terms: ["guide", "guides", "team", "tourist guide", "assistant"],
      answer: "The Tourist Guide Team can help with route suggestions, destination reminders, food stops, and booking support. Open the Guides page to see the guide roles.",
    },
    {
      terms: ["book", "booking", "reserve", "reservation", "schedule"],
      answer: "I can help you start a booking. Click Book Now and choose Beach, Restaurant, Parks, or Custom Tour. Add your name, email, and preferred destination so the team can follow up.",
      action: "booking",
    },
    {
      terms: ["contact", "message", "help", "question", "email"],
      answer: "You can send a message through the Contact button, or tell me what you need here and I will suggest the best page or tour option.",
      action: "contact",
    },
    {
      terms: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"],
      answer: "Hi! I am the STEMATOUR assistant. Ask me about beaches, parks, restaurants, guides, or booking a Mauban tour.",
    },
  ];

  const getAssistantReply = (message) => {
    const text = message.toLowerCase();
    const match = chatReplies.find((item) => item.terms.some((term) => text.includes(term)));

    if (match) return match;

    return {
      answer: "I can help with STEMATOUR destinations. Try asking about Beach, Parks, Restaurant, Guides, or Booking.",
    };
  };

  const getChatHistory = () => JSON.parse(localStorage.getItem("stematourAiChat") || "[]");
  const saveChatHistory = (history) => localStorage.setItem("stematourAiChat", JSON.stringify(history.slice(-40)));

  const addChatMessage = (messages, from, text) => {
    const bubble = document.createElement("div");
    bubble.className = `chat-message ${from}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  };

  const buildChatPanel = () => {
    const panel = document.createElement("aside");
    panel.className = "chat-panel ai-chat-panel";
    panel.innerHTML = `
      <div class="chat-header">
        <div>
          <h2>STEMATOUR AI</h2>
          <p>Tour assistant</p>
        </div>
        <button class="close-chat" type="button" aria-label="Close chat">X</button>
      </div>
      <div class="chat-messages" data-chat-messages></div>
      <div class="chat-prompts">
        <button type="button" data-chat-prompt="What beach should I visit?">Beach</button>
        <button type="button" data-chat-prompt="Tell me about parks">Parks</button>
        <button type="button" data-chat-prompt="Where can we eat?">Food</button>
        <button type="button" data-chat-prompt="I want to book a tour">Book</button>
      </div>
      <form data-ai-chat-form>
        <input type="text" name="message" placeholder="Ask about Mauban tours..." autocomplete="off" required>
        <button class="primary-button" type="submit">Send</button>
      </form>
    `;

    const messages = panel.querySelector("[data-chat-messages]");
    const history = getChatHistory();
    if (history.length) {
      history.forEach((item) => addChatMessage(messages, item.from, item.text));
    } else {
      const greeting = "Hi! I am your STEMATOUR AI assistant. Ask me about beaches, parks, restaurants, guides, or booking.";
      addChatMessage(messages, "assistant", greeting);
      saveChatHistory([{ from: "assistant", text: greeting }]);
    }

    panel.querySelector(".close-chat").addEventListener("click", () => panel.remove());

    panel.querySelectorAll("[data-chat-prompt]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = panel.querySelector("input[name='message']");
        input.value = button.dataset.chatPrompt;
        panel.querySelector("[data-ai-chat-form]").requestSubmit();
      });
    });

    panel.querySelector("[data-ai-chat-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = event.target.elements.message;
      const message = input.value.trim();
      if (!message) return;

      const historyNow = getChatHistory();
      addChatMessage(messages, "user", message);
      historyNow.push({ from: "user", text: message });
      input.value = "";

      const typing = document.createElement("div");
      typing.className = "chat-message assistant typing";
      typing.textContent = "Typing...";
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;

      window.setTimeout(() => {
        typing.remove();
        const reply = getAssistantReply(message);
        addChatMessage(messages, "assistant", reply.answer);
        historyNow.push({ from: "assistant", text: reply.answer });
        saveChatHistory(historyNow);

        if (reply.action === "booking") {
          window.setTimeout(() => openModal(bookingForm), 350);
        }

        if (reply.action === "contact") {
          window.setTimeout(() => openModal(contactForm), 350);
        }
      }, 450);
    });

    return panel;
  };

  const chatButton = document.querySelector("[data-chat-toggle]");
  if (chatButton) {
    chatButton.addEventListener("click", () => {
      const current = document.querySelector(".chat-panel");
      if (current) {
        current.remove();
        return;
      }

      const panel = buildChatPanel();
      document.body.appendChild(panel);
      panel.querySelector("input[name='message']").focus();
    });
  }

  document.querySelectorAll("[data-gallery] button").forEach((button) => {
    button.addEventListener("click", () => {
      const img = button.querySelector("img");
      if (!img) return;
      openModal(`<img src="${img.src}" alt="${img.alt}"><p>${img.alt}</p>`);
    });
  });

  document.querySelectorAll(".account-menu").forEach((menu) => {
    menu.addEventListener("change", () => {
      if (!menu.value) return;
      toast(`${menu.options[menu.selectedIndex].text} is ready to connect to your backend.`);
      menu.value = "";
    });
  });
})();
