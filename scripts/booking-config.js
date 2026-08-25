window.WWS_BOOKING_CONFIG = {
  locations: [
    {
      slug: "powdersville",
      name: "Flagship Location",
      shortLabel: "Flagship",
      accent: "#4A90D9",
      address: "2699 Powdersville Rd, Easley, SC 29642",
      eyebrow: "Flagship studio + event space",
      description:
        "Our Flagship Location is a fully, 100% self-service photo studio. Select the time you'd like, fill in some details, and include any optional add-ons. You will receive a confirmation email with important information, YouTube videos to watch, passcodes, etc. Thank you for booking with us!",
      policies: [
        "Events are allowed for 2-hour sessions and longer.",
        "1-hour sessions are not eligible for events.",
        "Events with 35 or more attendees have a mandatory $150 cleaning fee automatically added to the booking."
      ],
      durations: [
        { id: "pv-1", label: "1 hour", hours: 1, price: 130, description: "Quick portraits, pickups, and tight creative blocks.", acuityTypeKey: "powdersville_1hr" },
        { id: "pv-2", label: "2 hours", hours: 2, price: 200, description: "Most portrait and branding sessions.", supportsEvents: true, acuityTypeKey: "powdersville_2hr" },
        { id: "pv-3", label: "3 hours", hours: 3, price: 270, description: "Larger set builds and multi-look shoots.", supportsEvents: true, acuityTypeKey: "powdersville_3hr" },
        { id: "pv-4", label: "4 hours", hours: 4, price: 350, description: "Small events start here.", supportsEvents: true, acuityTypeKey: "powdersville_4hr" },
        { id: "pv-6", label: "6 hours", hours: 6, price: 500, description: "Expanded events and productions.", supportsEvents: true, acuityTypeKey: "powdersville_6hr" },
        { id: "pv-8", label: "8 hours", hours: 8, price: 750, description: "Full-length events and large productions. Earliest start 12:30pm.", subtext: "Available starting at 12:30 p.m.", supportsEvents: true, earliestStartMinutes: 750, acuityTypeKey: "powdersville_8hr" },
        { id: "pv-full", label: "Full day (5am–11pm access)", hours: 18, price: 980, description: "All-day productions and event builds.", supportsEvents: true, acuityTypeKey: "powdersville_full_day" }
      ],
      addons: [
        {
          id: "backdrops",
          type: "backdrops",
          name: "Backdrops",
          image: "images/taylors-mill/whitewall-studios-backdrop.jpg",
          note:
            "Shared between sessions. Only roll down what you need so each paper roll lasts as long as possible.",
          allPrice: 50,
          singlePrice: 15,
          allImage: "images/gear-rentals/all-backdrops.png",
          colors: [
            { id: "black", label: "Black", image: "images/powdersville/black.jpg" },
            { id: "charcoal-gray", label: "Charcoal Gray", image: "images/powdersville/charcoal-gray.jpg" },
            { id: "olive-green", label: "Olive Green", image: "images/powdersville/olive-green.jpg" },
            { id: "tan-beige", label: "Tan / Beige", image: "images/powdersville/tan_beige.jpg" },
            { id: "white", label: "White", image: "images/powdersville/white.jpg" }
          ]
        },
        {
          id: "lighting",
          type: "toggle",
          name: "Lighting rental",
          image: "images/gear-rentals/whitewall-powdersville_v1-5.jpg",
          buttonImage: "images/gear-rentals/img_6346.jpg",
          price: 125,
          description:
            "660W RGB Amaran Ray, 360W RGB Amaran Ray, 60in and 47in softboxes, wall-mounted extensions, rolling C-stands, sandbags, and clamps."
        },
        {
          id: "rolling-walls",
          type: "walls",
          name: "Rolling walls",
          image: "images/gear-rentals/whitewall-powdersville_v1-8.jpg",
          allPrice: 70,
          singlePrice: 30,
          description: "Modular rolling walls for custom studio setups.",
          allImage: "images/gear-rentals/whitewall-powdersville_v1-8.jpg",
          walls: [
            { id: "wall-1", label: "Wall 1 — Layered, Hallowed, Squared Arch", image: "images/gear-rentals/whitewall-powdersville_v1-3-2.jpg" },
            { id: "wall-2", label: "Wall 2 — Small Shelves", image: "images/gear-rentals/whitewall-powdersville_v1-11.jpg" },
            { id: "wall-3", label: "Wall 3 — Layered, Curved Arch", image: "images/gear-rentals/whitewall-powdersville_v1-12.jpg" },
            { id: "wall-4", label: "Wall 4 — Picture Frame", image: "images/gear-rentals/whitewall-powdersville_v1-14.jpg" },
            { id: "wall-5", label: "Wall 5 — Three Simple Walls, Increasing Plain Arch Pack", image: "images/gear-rentals/whitewall-powdersville_v1-13.jpg" }
          ]
        },
        {
          id: "chairs",
          type: "tier",
          name: "White banquet chairs",
          image: "images/gear-rentals/e82ff93f-492c-41e6-99da-2178acee3d17.jpg",
          description: "Padded white banquet chairs, up to 100 total.",
          options: [
            { id: "25", label: "25 chairs", price: 100, image: "images/gear-rentals/a00a93aa-10bb-4850-9e5f-1cbaf7d9fca6.jpg" },
            { id: "50", label: "50 chairs", price: 190, image: "images/gear-rentals/827f1586-24ad-47fb-b72a-b843c240651e.jpg" },
            { id: "75", label: "75 chairs", price: 280, image: "images/gear-rentals/a00a93aa-10bb-4850-9e5f-1cbaf7d9fca6.jpg" },
            { id: "100", label: "100 chairs", price: 370, image: "images/gear-rentals/827f1586-24ad-47fb-b72a-b843c240651e.jpg" }
          ]
        },
        {
          id: "tables",
          type: "quantity",
          name: "8ft fold out tables",
          image: "images/gear-rentals/cb48b32e-23f2-4297-840b-2ecab35daf24.jpg",
          description: "Tables are one solid structure with no crease in the middle. The legs simply fold out. Up to 10 tables available.",
          price: 15,
          max: 10,
          unitLabel: "tables"
        },
        {
          id: "tv",
          type: "toggle",
          name: "86in rolling TV",
          image: "images/gear-rentals/whitewall-powdersville_v2-38.jpg",
          price: 50,
          description: "4K smart TV with every HDMI connecting cable imaginable."
        },
        {
          id: "pa-system",
          type: "toggle",
          name: "PA system",
          image: "images/gear-rentals/whitewall-powdersville_v2-29.jpg",
          buttonImage: "images/gear-rentals/whitewall-powdersville_v2-33.jpg",
          price: 40,
          description: "Large speaker with aux cable to connect to any phone, with wired microphone and stand."
        },
        {
          id: "setup-crew",
          type: "toggle",
          name: "Event Setup and Reset Crew",
          tagline: "By no means necessary, but certainly makes your event more enjoyable.",
          featured: true,
          image: "images/gear-rentals/event-setup-reset-crew.jpeg",
          price: 750,
          eventsOnly: true,
          requiresPlacements: true,
          description:
            "WhiteWall is designed to be an affordable event space by giving clients the option to handle setup and reset themselves.\n\nWithout the Event Setup and Reset Crew add-on, the studio will be arranged as it normally is for photo sessions, with furniture, rugs, mirrors, tables, and decor in their standard places, as shown in the gallery photos. If you want a custom event layout, you are welcome to move those items out of the way, retrieve any rented add-ons such as chairs or tables from storage, set them up for your event, and then return everything afterward.\n\nAt the end of your booking, all rented items must be packed back onto their dollies, strapped back down, and returned to storage, and all studio furniture and decor must be placed back exactly as it was when you arrived.\n\nIf you would rather not handle that setup and reset process yourself, our Event Setup and Reset Crew can take care of it for you.\n\nOur crew tears down the existing studio floor plan, moves anything you do not want visible out of the way or into the storage building, places your rented event assets in the middle of the space before you arrive so everything is ready to use, and handles the full post-event reset. We will bring any included tables, chairs, PA system, TV, and other rented assets into the middle of the studio on the dollies and remove the straps so everything is completely ready to go. You can walk in and immediately grab the first chair off the top of the rack.\n\nThis does not include designing or placing your final floor plan. We are not physically taking chairs off the dolly and setting them up in your room layout. When your booking is finished, you can leave the chairs and items exactly where they are on the ground, and our crew will pack everything back up and reset the space.",
          descriptionHtml: "<style>\r\n  .wws-crew {\r\n    --wws-ink: #111111;\r\n    --wws-muted: #555555;\r\n    --wws-green: #1e5c40;\r\n    --wws-green-soft: #eaf4ee;\r\n    --wws-green-glow: #d7ecdf;\r\n    --wws-brick: #8a4a3a;\r\n    --wws-brick-soft: #f7efec;\r\n    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;\r\n    color: var(--wws-ink);\r\n    line-height: 1.55;\r\n  }\r\n\r\n  .wws-crew__intro {\r\n    font-size: 15px;\r\n    margin: 0 0 14px;\r\n  }\r\n  .wws-crew__intro strong { font-weight: 700; }\r\n  .wws-crew__hl {\r\n    background: #ffe33d;\r\n    color: var(--wws-ink);\r\n    padding: 1px 4px;\r\n    border-radius: 3px;\r\n    -webkit-box-decoration-break: clone;\r\n    box-decoration-break: clone;\r\n  }\r\n\r\n  /* Slim video row */\r\n  .wws-crew__video {\r\n    display: flex;\r\n    align-items: center;\r\n    gap: 10px;\r\n    border: 1px solid var(--wws-ink);\r\n    border-radius: 8px;\r\n    padding: 10px 14px;\r\n    margin: 0 0 18px;\r\n    text-decoration: none;\r\n    color: var(--wws-ink);\r\n    font-size: 13.5px;\r\n    transition: background 0.15s ease, color 0.15s ease;\r\n  }\r\n  .wws-crew__video:hover { background: var(--wws-ink); color: #ffffff; }\r\n  .wws-crew__video:focus-visible { outline: 2px solid var(--wws-ink); outline-offset: 3px; }\r\n  .wws-crew__play {\r\n    flex: 0 0 auto;\r\n    width: 26px;\r\n    height: 26px;\r\n    border: 1.5px solid currentColor;\r\n    border-radius: 50%;\r\n    display: grid;\r\n    place-items: center;\r\n  }\r\n  .wws-crew__play svg { display: block; margin-left: 2px; }\r\n  .wws-crew__video strong { font-weight: 700; }\r\n\r\n  /* Cards */\r\n  .wws-crew__cards {\r\n    display: grid;\r\n    grid-template-columns: 1fr 1fr;\r\n    gap: 14px;\r\n    align-items: start;\r\n  }\r\n  .wws-crew__card {\r\n    border-radius: 8px;\r\n    padding: 0 0 18px;\r\n    overflow: hidden;\r\n  }\r\n  .wws-crew__card--included {\r\n    border: 1px solid var(--wws-green);\r\n    background: linear-gradient(180deg, var(--wws-green-soft) 0%, #ffffff 110px);\r\n  }\r\n  .wws-crew__card--not {\r\n    border: 1px solid #ddd2ce;\r\n    background: linear-gradient(180deg, var(--wws-brick-soft) 0%, #ffffff 110px);\r\n  }\r\n  .wws-crew__card h3 {\r\n    font-size: 11px;\r\n    letter-spacing: 0.14em;\r\n    text-transform: uppercase;\r\n    margin: 0;\r\n    padding: 11px 18px;\r\n    color: #ffffff;\r\n    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;\r\n  }\r\n  .wws-crew__card--included h3 { background: var(--wws-green); }\r\n  .wws-crew__card--not h3 { background: var(--wws-brick); }\r\n\r\n  .wws-crew__card ul {\r\n    list-style: none;\r\n    margin: 0;\r\n    padding: 14px 18px 0;\r\n  }\r\n  .wws-crew__card li {\r\n    display: flex;\r\n    gap: 9px;\r\n    font-size: 13.5px;\r\n    margin-bottom: 10px;\r\n  }\r\n  .wws-crew__card li:last-child { margin-bottom: 0; }\r\n  .wws-crew__mark {\r\n    flex: 0 0 auto;\r\n    width: 16px;\r\n    height: 16px;\r\n    margin-top: 2px;\r\n  }\r\n  .wws-crew__card--not li { color: var(--wws-muted); }\r\n\r\n  /* ROI highlight rows */\r\n  .wws-crew__card li.wws-crew__roi {\r\n    background: var(--wws-green-glow);\r\n    border-left: 4px solid var(--wws-green);\r\n    border-radius: 4px;\r\n    padding: 8px 10px;\r\n    margin-left: -10px;\r\n    margin-right: -10px;\r\n    font-weight: 600;\r\n  }\r\n  .wws-crew__roi-label {\r\n    display: inline-block;\r\n    font-size: 10px;\r\n    letter-spacing: 0.12em;\r\n    text-transform: uppercase;\r\n    color: var(--wws-green);\r\n    font-weight: 700;\r\n    margin: 12px 18px 6px;\r\n  }\r\n\r\n  /* Anchor callout */\r\n  .wws-crew__anchor {\r\n    margin: 14px 18px 0;\r\n    padding: 12px 14px;\r\n    background: var(--wws-green);\r\n    color: #f0c75e;\r\n    border-radius: 6px;\r\n    font-size: 13.5px;\r\n    line-height: 1.6;\r\n  }\r\n  .wws-crew__anchor strong { font-weight: 700; color: #ffdd7a; }\r\n\r\n  @media (max-width: 640px) {\r\n    .wws-crew__cards { grid-template-columns: 1fr; }\r\n    .wws-crew__card li.wws-crew__roi { margin-left: -6px; margin-right: -6px; }\r\n  }\r\n  @media (prefers-reduced-motion: reduce) {\r\n    .wws-crew__video { transition: none; }\r\n  }\r\n</style>\n<section class=\"wws-crew\">\r\n\r\n  <p class=\"wws-crew__intro\">\r\n    This add-on is <strong>100% optional</strong>. You are fully welcome to move things yourself, set up, tear down, and reset the space on your own to keep your costs down. <strong class=\"wws-crew__hl\">We built WhiteWall to be as affordable as possible by removing any unnecessary overhead.</strong> By keeping it self-service, we keep the labor cost down, which gives you immediate savings. However, if you would rather have the convenience instead of the savings and you would rather not do that work, our crew will gladly handle it for you.\r\n  </p>\r\n\r\n  <a class=\"wws-crew__video\" href=\"https://www.instagram.com/reel/DZtLEyQyt7H/?utm_source=ig_web_copy_link&amp;igsi=MzRlODBiNWFlZA==\" target=\"_blank\" rel=\"noopener\">\r\n    <span class=\"wws-crew__play\" aria-hidden=\"true\">\r\n      <svg width=\"10\" height=\"12\" viewBox=\"0 0 12 14\" fill=\"currentColor\"><path d=\"M0 0 L12 7 L0 14 Z\"/></svg>\r\n    </span>\r\n    <span><strong>Want to see what the studio looks like when you walk in, and how it should look before you leave?</strong> Watch this video.</span>\r\n  </a>\r\n\r\n  <div class=\"wws-crew__cards\">\r\n\r\n    <div class=\"wws-crew__card wws-crew__card--included\">\r\n      <h3>What's Included</h3>\r\n      <ul>\r\n        <li>\r\n          <svg class=\"wws-crew__mark\" viewBox=\"0 0 17 17\" aria-hidden=\"true\"><path d=\"M3 9 L7 13 L14 4\" fill=\"none\" stroke=\"#1e5c40\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\r\n          <span>Before your event, we will meet on site, FaceTime, or text to plan exactly what stays in the space and what gets moved to storage. Anything that can't fit is tucked into the corner and hidden.</span>\r\n        </li>\r\n        <li>\r\n          <svg class=\"wws-crew__mark\" viewBox=\"0 0 17 17\" aria-hidden=\"true\"><path d=\"M3 9 L7 13 L14 4\" fill=\"none\" stroke=\"#1e5c40\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\r\n          <span>Crew tears down the standard studio floor plan before you arrive</span>\r\n        </li>\r\n        <li>\r\n          <svg class=\"wws-crew__mark\" viewBox=\"0 0 17 17\" aria-hidden=\"true\"><path d=\"M3 9 L7 13 L14 4\" fill=\"none\" stroke=\"#1e5c40\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\r\n          <span>Your rented items (tables, chairs, PA system, TV, rolling walls) staged in the middle of the space, straps off, ready to take off the dolly and place wherever you like, whenever you walk in</span>\r\n        </li>\r\n      </ul>\r\n\r\n      <span class=\"wws-crew__roi-label\">Where this add-on really pays off</span>\r\n      <ul style=\"padding-top:0;\">\r\n        <li class=\"wws-crew__roi\">\r\n          <svg class=\"wws-crew__mark\" viewBox=\"0 0 17 17\" aria-hidden=\"true\"><path d=\"M3 9 L7 13 L14 4\" fill=\"none\" stroke=\"#1e5c40\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\r\n          <span>When your event ends, leave everything exactly where it is</span>\r\n        </li>\r\n        <li class=\"wws-crew__roi\">\r\n          <svg class=\"wws-crew__mark\" viewBox=\"0 0 17 17\" aria-hidden=\"true\"><path d=\"M3 9 L7 13 L14 4\" fill=\"none\" stroke=\"#1e5c40\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\r\n          <span>Full pack-up, reset, and cleanup of the space after your event</span>\r\n        </li>\r\n      </ul>\r\n\r\n      <p class=\"wws-crew__anchor\">\r\n        Clean up what you brought in, take out the trash, and <strong>leave the chairs, tables, and add-ons right where they are.</strong> No packing up the chairs and tables and loading them back onto the dollies, no rolling the walls back into the storage building, and no moving the furniture back into position. We pack it all up, bring the furniture back in, set the space back up, and reset everything for the next session, so you don't have to. <strong>You don't worry about a thing.</strong>\r\n      </p>\r\n    </div>\r\n\r\n    <div class=\"wws-crew__card wws-crew__card--not\">\r\n      <h3>What's Not Included</h3>\r\n      <ul>\r\n        <li>\r\n          <svg class=\"wws-crew__mark\" viewBox=\"0 0 17 17\" aria-hidden=\"true\"><path d=\"M4 4 L13 13 M13 4 L4 13\" fill=\"none\" stroke=\"#8a4a3a\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>\r\n          <span>Physically placing out the chairs, tables, and decor in their final spots (you take them off the dollies, which are already in there for you, ready to go, and arrange your specific setup)</span>\r\n        </li>\r\n        <li>\r\n          <svg class=\"wws-crew__mark\" viewBox=\"0 0 17 17\" aria-hidden=\"true\"><path d=\"M4 4 L13 13 M13 4 L4 13\" fill=\"none\" stroke=\"#8a4a3a\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>\r\n          <span>Decorating (balloons, florals, linens, signage)</span>\r\n        </li>\r\n        <li>\r\n          <svg class=\"wws-crew__mark\" viewBox=\"0 0 17 17\" aria-hidden=\"true\"><path d=\"M4 4 L13 13 M13 4 L4 13\" fill=\"none\" stroke=\"#8a4a3a\" stroke-width=\"2\" stroke-linecap=\"round\"/></svg>\r\n          <span>Staffing during your event itself. It is still self-service, we just help out with the annoying logistics.</span>\r\n        </li>\r\n      </ul>\r\n    </div>\r\n\r\n  </div>\r\n\r\n</section>",
          placementItems: [
            { id: "utility-tables", label: "Utility tables and extension cords", options: ["Back garage corner", "Leave where it currently is", "Storage Building"] },
            { id: "white-boxes", label: "White boxes", options: ["Back garage corner", "Leave where it currently is", "Storage Building"] },
            { id: "plants", label: "Plants", options: ["Back garage corner", "Leave where it currently is", "Storage Building"] },
            { id: "living-room-rug", label: "Living room rug", options: ["Back garage corner", "Leave where it currently is", "Storage Building"] },
            { id: "living-room-furniture", label: "Living room furniture", options: ["Back garage corner", "Leave where it currently is", "Storage Building"] },
            { id: "getting-ready-rug", label: "Hair and Makeup Area Rug", options: ["Back garage corner", "Leave where it currently is", "Storage Building"] },
            { id: "getting-ready-furniture", label: "Hair and Makeup Area Furniture", options: ["Back garage corner", "Leave where it currently is", "Storage Building"] },
            { id: "large-table-chairs", label: "Large table and chairs", options: ["Back garage corner", "Leave where it currently is"] }
          ]
        }
      ]
    },
    {
      slug: "taylors-mill",
      name: "Taylor's Mill",
      shortLabel: "Taylor's Mill",
      accent: "#c4a882",
      address: "250 Mill St, Ste. BL1223, Taylors, SC 29687",
      eyebrow: "Original natural light studio",
      description:
        "Book a natural light studio session at Taylor's Mill. Choose your duration, add backdrops or lighting, and schedule online.",
      policies: [
        "Taylor's Mill is not available for events.",
        "Sessions available from 1 hour to full day.",
        "Backdrops and lighting available as add-ons."
      ],
      durations: [
        { id: "tm-1", label: "1 hour", hours: 1, price: 110, description: "Quick portraits, headshots, and pickups.", acuityTypeKey: "taylors_mill_1hr" },
        { id: "tm-2", label: "2 hours", hours: 2, price: 170, description: "The standard Taylor's Mill session.", acuityTypeKey: "taylors_mill_2hr" },
        { id: "tm-3", label: "3 hours", hours: 3, price: 230, description: "Longer natural light sessions and branded shoots.", acuityTypeKey: "taylors_mill_3hr" },
        { id: "tm-4", label: "4 hours", hours: 4, price: 280, description: "Extended sessions and small productions.", acuityTypeKey: "taylors_mill_4hr" },
        { id: "tm-6", label: "6 hours", hours: 6, price: 420, description: "Large productions.", acuityTypeKey: "taylors_mill_6hr" },
        { id: "tm-full", label: "12 hours", hours: 12, price: 550, description: "All-day studio access.", acuityTypeKey: "taylors_mill_full_day" }
      ],
      addons: [
        {
          id: "backdrops",
          type: "backdrops",
          name: "Backdrops",
          image: "images/taylors-mill/whitewall-studios-backdrop.jpg",
          note:
            "Shared between sessions. Only roll down what you need so each paper roll lasts as long as possible.",
          allPrice: 50,
          singlePrice: 15,
          allImage: "images/gear-rentals/all-backdrops.png",
          colors: [
            { id: "black", label: "Black", image: "images/powdersville/black.jpg" },
            { id: "charcoal-gray", label: "Charcoal Gray", image: "images/powdersville/charcoal-gray.jpg" },
            { id: "olive-green", label: "Olive Green", image: "images/powdersville/olive-green.jpg" },
            { id: "tan-beige", label: "Tan / Beige", image: "images/powdersville/tan_beige.jpg" },
            { id: "white", label: "White", image: "images/powdersville/white.jpg" }
          ]
        },
        {
          id: "lighting",
          type: "toggle",
          name: "Lighting rental",
          image: "images/taylors-mill/tm-studio-v2-47.jpg",
          buttonImage: "images/taylors-mill/whitewall-studios-still-v2_-46.jpg",
          price: 50,
          description:
            "2x 100W Amaran bi-color lights, 1x 200W daylight light, 42in softbox, and 25ft extension cords."
        }
      ]
    }
  ],
  integrations: {
    acuity: {
      enabled: true,
      mode: "api",
      accountUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772",
      embedScriptUrl: "https://embed.acuityscheduling.com/js/embed.js",
      locations: {
        powdersville: {
          fallbackSchedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772",
          durations: {
            "pv-1": {
              appointmentTypeId: "89113040",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=89113040"
            },
            "pv-2": {
              appointmentTypeId: "89113116",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=89113116"
            },
            "pv-3": {
              appointmentTypeId: "89114444",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=89114444"
            },
            "pv-4": {
              appointmentTypeId: "89114517",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=89114517"
            },
            "pv-6": {
              appointmentTypeId: "89114539",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=89114539"
            },
            "pv-8": {
              appointmentTypeId: "94823049",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=94823049"
            },
            "pv-full": {
              appointmentTypeId: "89114581",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=89114581"
            }
          }
        },
        "taylors-mill": {
          fallbackSchedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772",
          durations: {
            "tm-1": {
              appointmentTypeId: "38342199",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=38342199"
            },
            "tm-2": {
              appointmentTypeId: "28312352",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=28312352"
            },
            "tm-3": {
              appointmentTypeId: "28312534",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=28312534"
            },
            "tm-4": {
              appointmentTypeId: "28312549",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=28312549"
            },
            "tm-6": {
              appointmentTypeId: "36030598",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=36030598"
            },
            "tm-full": {
              appointmentTypeId: "28312569",
              schedulerUrl: "https://app.acuityscheduling.com/schedule.php?owner=24638772&appointmentType=28312569"
            }
          }
        }
      },
      notes: {
        setup:
          "Fill one Acuity mapping per duration. Use iframeSrc for embedded calendars or schedulerUrl for an off-page handoff.",
        verification:
          "Confirm each duration matches the real Acuity appointment type before enabling this integration."
      }
    },
    square: {
      enabled: true,
      mode: "payment-links"
    },
    forms: {
      submissionEndpoint: "",
      recaptchaSiteKey: "",
      honeypotField: "company"
    }
  }
};
