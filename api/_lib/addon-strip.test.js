// Tests for parseInvalidAddonIDs — the invalid_addons_type parser that lets
// createAppointment strip type-rejected add-ons and still book (Denise Ko, 2026-07-22).
const assert = require("assert");
const { parseInvalidAddonIDs } = require("./acuity");
let n = 0; function ok(l){n++;console.log("ok "+n+" - "+l);}

// The exact production error from the incident (JSON body with escaped quotes).
const real = 'Acuity 400: {"status_code":400,"message":"The addons \\"6840271, 6840275, 6840278, 6881547\\" are not valid with this appointment type.","error":"invalid_addons_type"}';
assert.deepStrictEqual(parseInvalidAddonIDs(real), [6840271, 6840275, 6840278, 6881547], "parses the 4 flagged ids from the real error");
ok("parses ids from the real production invalid_addons_type error");

// Single id
const one = 'Acuity 400: {"message":"The addons \\"6840271\\" are not valid with this appointment type.","error":"invalid_addons_type"}';
assert.deepStrictEqual(parseInvalidAddonIDs(one), [6840271], "single id");
ok("parses a single flagged id");

// Unrelated errors -> empty (so the caller's refund path runs)
assert.deepStrictEqual(parseInvalidAddonIDs('Acuity 400: {"error":"invalid_datetime"}'), [], "non-addon error -> []");
assert.deepStrictEqual(parseInvalidAddonIDs("Square createPayment 400: GENERIC_DECLINE"), [], "square error -> []");
assert.deepStrictEqual(parseInvalidAddonIDs(""), [], "empty -> []");
ok("returns [] for unrelated errors so refund path is untouched");

console.log("\nAll "+n+" addon-strip assertions passed.");
