// Server-side copy of the liability waiver text. Mirrors the client-side
// waiver in scripts/booking-flow.js renderWaiver() (~line 1456).
//
// If you change the waiver, update BOTH places. Client-side renders to the user
// at sign-time; this server-side copy is included in the confirmation email
// so the customer has the exact text they signed in their inbox.

function buildWaiverText(opts) {
  var fullName = opts.fullName || "the individual";
  var locationSlug = opts.locationSlug;
  var locationCity = locationSlug === "powdersville" ? "Powdersville, South Carolina" : "Taylors, South Carolina";
  var tmRestriction = locationSlug === "taylors-mill"
    ? "\nThis location is only approved for photo and video shoots, no events/parties allowed.\n"
    : "";

  return [
    "WHITEWALL STUDIOS LIABILITY WAIVER & USE AGREEMENT",
    "",
    "I, " + fullName + ", booking this session (\"Renter\"), acknowledge and agree to the following in connection with my use of the WhiteWall Studios, LLC facility located in " + locationCity + " (\"the Studio\").",
    "",
    "By signing this agreement, I confirm that I am entering into this agreement on behalf of myself and every person I allow into the Studio during my booking, including but not limited to clients, guests, models, assistants, photographers, videographers, and other invitees (collectively referred to as \"My Party\"). I accept full responsibility for the conduct, safety, and actions of My Party.",
    tmRestriction,
    "1. ASSUMPTION OF RISK. The Studio is a self-service facility, and no WhiteWall Studios staff will be present during my booking. I voluntarily assume all risks associated with the use of the Studio by myself and My Party, including but not limited to risks involving lighting equipment, props, furniture, electrical equipment, trip or fall hazards, and the physical condition of the space.",
    "",
    "2. RELEASE OF LIABILITY. On behalf of myself and My Party, I hereby release and waive any claims against WhiteWall Studios, LLC, including its owners, officers, employees, contractors, and agents, for any injury, death, property damage, loss, or other incident that may occur during the use of the Studio, except in cases of gross negligence or willful misconduct.",
    "",
    "3. INDEMNIFICATION. I agree to indemnify, defend, and hold harmless WhiteWall Studios, LLC from any claims, lawsuits, damages, liabilities, or legal costs arising from:",
    "  - My use of the Studio",
    "  - The actions or negligence of My Party",
    "  - Injury to anyone within My Party",
    "  - Damage to the Studio or building",
    "  - Any violation of Studio policies",
    "This obligation survives the conclusion of the booking.",
    "",
    "4. RESPONSIBILITY FOR GUESTS. I accept full legal and financial responsibility for all individuals I allow into the Studio and acknowledge that WhiteWall Studios has no obligation to supervise guests during my booking.",
    "",
    "5. DAMAGE RESPONSIBILITY. I accept full financial responsibility for any damage caused by myself or My Party to the Studio, building, furniture, equipment, props, fixtures, or any other property belonging to WhiteWall Studios.",
    "I authorize WhiteWall Studios, LLC to charge the payment method used for booking for any repair or replacement costs, including labor if applicable.",
    "",
    "6. STUDIO RULES & CONDITION. I agree to:",
    "  - Return all furniture, props, and equipment to their original positions",
    "  - Leave the Studio in the condition it was found",
    "Failure to do so may result in a minimum $250 cleaning or reset fee.",
    "The following are strictly prohibited:",
    "  - Smoking or vaping",
    "  - Open flames or candles",
    "  - Firearms or weapons",
    "  - Illegal drugs or illegal activity",
    "Haze machines are only permitted with bookings of four (4) hours or longer.",
    "",
    "7. PERSONAL PROPERTY. WhiteWall Studios, LLC is not responsible for lost, stolen, or damaged personal property brought into the Studio.",
    "",
    "8. SECURITY CAMERAS. I acknowledge that security cameras operate within and around the Studio for safety and property protection.",
    "",
    "9. BOOKING COMPLIANCE & CANCELLATION. I agree to vacate the Studio by the end of my booking time. Failure to do so may result in additional charges.",
    "Cancellations made within 48 hours of the booking will result in the full session charge.",
    "WhiteWall Studios reserves the right to terminate a booking immediately without refund if Studio rules are violated.",
    "",
    "10. GOVERNING LAW & ELECTRONIC SIGNATURE. This agreement shall be governed by the laws of the State of South Carolina.",
    "I acknowledge that my electronic signature has the same legal force as a handwritten signature, and by signing I confirm that I have read, understood, and agreed to all terms of this agreement.",
    "",
    "Signed: " + fullName,
    "Signed at: " + (opts.signedAt || new Date().toISOString())
  ].join("\n");
}

module.exports = { buildWaiverText };
