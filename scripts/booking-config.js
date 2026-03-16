window.WWS_BOOKING_CONFIG = {
  locations: [
    {
      slug: "powdersville",
      name: "Powdersville",
      shortLabel: "Powdersville",
      accent: "#8ba7b8",
      address: "2699 Powdersville Rd, Easley, SC 29642",
      eyebrow: "Flagship studio + event space",
      description:
        "Our Powdersville location is a fully, 100% self-service photo studio. Select the time you'd like, fill in some details, and include any optional add-ons. You will receive a confirmation email with important information, YouTube videos to watch, passcodes, etc. Thank you for booking with us!",
      policies: [
        "2-hour through full-day bookings can be used for events.",
        "1-hour sessions cannot be used for events.",
        "Events with 50+ attendees require confirmation from our team."
      ],
      durations: [
        { id: "pv-1", label: "1 hour", hours: 1, description: "Quick portraits, pickups, and tight creative blocks.", acuityTypeKey: "powdersville_1hr" },
        { id: "pv-2", label: "2 hours", hours: 2, description: "Most portrait and branding sessions.", acuityTypeKey: "powdersville_2hr" },
        { id: "pv-3", label: "3 hours", hours: 3, description: "Larger set builds and multi-look shoots.", acuityTypeKey: "powdersville_3hr" },
        { id: "pv-4", label: "4 hours", hours: 4, description: "Small events start here.", supportsEvents: true, acuityTypeKey: "powdersville_4hr" },
        { id: "pv-6", label: "6 hours", hours: 6, description: "Expanded events and brand activations.", supportsEvents: true, acuityTypeKey: "powdersville_6hr" },
        { id: "pv-full", label: "Full day", hours: 18, description: "6 AM–11 PM — all-day productions and event builds.", supportsEvents: true, acuityTypeKey: "powdersville_full_day" }
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
          colors: [
            { id: "black", label: "Black" },
            { id: "charcoal-gray", label: "Charcoal Gray" },
            { id: "olive-green", label: "Olive Green" },
            { id: "pink", label: "Pink" },
            { id: "red", label: "Red" },
            { id: "tan-beige", label: "Tan / Beige" },
            { id: "white", label: "White" }
          ]
        },
        {
          id: "lighting",
          type: "toggle",
          name: "Lighting rental",
          image: "images/gear-rentals/img_6344.jpg",
          price: 100,
          description:
            "660W RGB Amaran Ray, 360W RGB Amaran Ray, 60in and 47in softboxes, wall-mounted extensions, rolling C-stands, sandbags, and clamps."
        },
        {
          id: "rolling-walls",
          type: "walls",
          name: "Rolling walls",
          image: "images/gear-rentals/whitewall-powdersville_v1-10.jpg",
          allPrice: 70,
          singlePrice: 30,
          description: "Modular rolling walls for custom studio setups.",
          walls: [
            { id: "wall-1", label: "Wall 1" },
            { id: "wall-2", label: "Wall 2" },
            { id: "wall-3", label: "Wall 3" },
            { id: "wall-4", label: "Wall 4" }
          ]
        },
        {
          id: "chairs",
          type: "tier",
          name: "White banquet chairs",
          image: "images/gear-rentals/e82ff93f-492c-41e6-99da-2178acee3d17.jpg",
          description: "Padded white banquet chairs, up to 100 total.",
          options: [
            { id: "25", label: "25 chairs", price: 100 },
            { id: "50", label: "50 chairs", price: 190 },
            { id: "75", label: "75 chairs", price: 280 },
            { id: "100", label: "100 chairs", price: 370 }
          ]
        },
        {
          id: "tables",
          type: "quantity",
          name: "8ft folding tables",
          image: "images/gear-rentals/tables-and-chairs-render.jpg",
          description: "Up to 10 tables available.",
          price: 15,
          max: 10,
          unitLabel: "table"
        },
        {
          id: "tv",
          type: "toggle",
          name: "86in rolling TV",
          image: "images/gear-rentals/whitewall-powdersville_v2-36.jpg",
          price: 50,
          description: "4K smart TV with HDMI access and laptop tray."
        },
        {
          id: "pa-system",
          type: "toggle",
          name: "PA system",
          image: "images/gear-rentals/whitewall-powdersville_v2-30.jpg",
          price: 40,
          description: "Wired microphone and speaker package."
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
        { id: "tm-1", label: "1 hour", hours: 1, description: "Quick portraits, headshots, and pickups.", acuityTypeKey: "taylors_mill_1hr" },
        { id: "tm-2", label: "2 hours", hours: 2, description: "The standard Taylor's Mill session.", acuityTypeKey: "taylors_mill_2hr" },
        { id: "tm-3", label: "3 hours", hours: 3, description: "Longer natural light sessions and branded shoots.", acuityTypeKey: "taylors_mill_3hr" },
        { id: "tm-4", label: "Half day", hours: 4, description: "Extended sessions and small productions.", acuityTypeKey: "taylors_mill_4hr" },
        { id: "tm-6", label: "6 hours", hours: 6, description: "Large productions and brand activations.", acuityTypeKey: "taylors_mill_6hr" },
        { id: "tm-full", label: "Full day", hours: 12, description: "All-day studio access.", acuityTypeKey: "taylors_mill_full_day" }
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
          colors: [
            { id: "black", label: "Black" },
            { id: "charcoal-gray", label: "Charcoal Gray" },
            { id: "olive-green", label: "Olive Green" },
            { id: "pink", label: "Pink" },
            { id: "red", label: "Red" },
            { id: "tan-beige", label: "Tan / Beige" },
            { id: "white", label: "White" }
          ]
        },
        {
          id: "lighting",
          type: "toggle",
          name: "Lighting rental",
          image: "images/gear-rentals/img_6341.jpg",
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
      mode: "scheduler",
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
      enabled: false,
      mode: "links",
      checkoutLinks: {
        powdersville: {},
        "taylors-mill": {}
      }
    },
    forms: {
      submissionEndpoint: "",
      recaptchaSiteKey: "",
      honeypotField: "company"
    }
  }
};
