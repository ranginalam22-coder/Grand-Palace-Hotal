const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  navigation.classList.toggle("is-open", !isOpen);
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  });
});

const bookingForm = document.querySelector("#booking-form");
const arrival = document.querySelector("#arrival");
const departure = document.querySelector("#departure");
const bookingMessage = document.querySelector("#booking-message");
const roomType = document.querySelector("#room-type");
const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);

arrival.min = localDate;
departure.min = localDate;

arrival.addEventListener("change", () => {
  departure.min = arrival.value || localDate;
  if (departure.value && departure.value <= arrival.value) {
    departure.value = "";
  }
});

document.querySelectorAll("[data-room]").forEach((link) => {
  link.addEventListener("click", () => {
    roomType.value = link.dataset.room;
  });
});

const roomOptions = {
  single: { name: "Coastal Single", price: 129, capacity: 1, inventory: 8 },
  double: { name: "Garden Double", price: 169, capacity: 2, inventory: 10 },
  standard: { name: "Horizon Standard", price: 189, capacity: 2, inventory: 12 },
  deluxe: { name: "Ocean Deluxe", price: 239, capacity: 2, inventory: 6 },
  family: { name: "Family Hideaway", price: 289, capacity: 4, inventory: 5 },
  suite: { name: "Horizon Suite", price: 369, capacity: 4, inventory: 4 },
};

const showBookingMessage = (title, details, isError = false) => {
  bookingMessage.replaceChildren();
  bookingMessage.classList.toggle("is-error", isError);
  const heading = document.createElement("strong");
  heading.textContent = title;
  const body = document.createElement("span");
  body.textContent = details;
  bookingMessage.append(heading, body);
  bookingMessage.hidden = false;
};

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  bookingMessage.hidden = true;
  bookingMessage.classList.remove("is-error");

  if (departure.value <= arrival.value) {
    showBookingMessage("Check your dates", "Check-out must be after check-in.", true);
    departure.focus();
    return;
  }

  const form = new FormData(bookingForm);
  const adults = Number(form.get("adults"));
  const children = Number(form.get("children"));
  const roomCount = Number(form.get("roomCount"));
  const guestCount = adults + children;
  const requestedRoom = String(form.get("room"));
  const candidates = requestedRoom === "any"
    ? Object.entries(roomOptions)
    : [[requestedRoom, roomOptions[requestedRoom]]];
  const matchingRoom = candidates.find(([, room]) =>
    room &&
    room.inventory >= roomCount &&
    room.capacity * roomCount >= guestCount
  );

  if (!matchingRoom) {
    showBookingMessage(
      "No rooms match those details",
      "Try a different room type, fewer rooms, or fewer guests. For larger groups, please contact our team.",
      true
    );
    return;
  }

  const [roomKey, room] = matchingRoom;
  const nights = (Date.parse(`${departure.value}T00:00:00Z`) - Date.parse(`${arrival.value}T00:00:00Z`)) / 86400000;
  const discount = nights >= 3 ? 0.15 : 0;
  const total = Math.round(room.price * roomCount * nights * (1 - discount));
  const reference = `GH-${Date.now().toString(36).toUpperCase()}`;
  const reservation = {
    reference,
    room: roomKey,
    roomName: room.name,
    arrival: arrival.value,
    departure: departure.value,
    nights,
    adults,
    children,
    roomCount,
    guestName: String(form.get("guestName")),
    guestEmail: String(form.get("guestEmail")),
    estimatedTotal: total,
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem("grandHorizonLatestBooking", JSON.stringify(reservation));
  } catch (error) {
    showBookingMessage(
      "Availability found, but request could not be saved",
      "Your browser could not save this demo request. Please contact the hotel directly to continue.",
      true
    );
    console.error("Unable to save the demo reservation in browser storage.", error);
    return;
  }

  const discountNote = discount ? " A 15% long-stay offer has been applied." : "";
  showBookingMessage(
    "Your booking request is ready",
    `${room.name} · ${roomCount} room${roomCount === 1 ? "" : "s"} · ${nights} night${nights === 1 ? "" : "s"} · estimated total before taxes $${total.toLocaleString("en-US")}.${discountNote} This demo request is saved in this browser only; it is not a confirmed reservation and no payment was taken.`
  );
  const referenceText = document.createElement("span");
  referenceText.className = "booking-reference";
  referenceText.textContent = `Request reference: ${reference}. A real reservation system and payment provider must be connected before accepting guest bookings.`;
  bookingMessage.append(referenceText);
});
