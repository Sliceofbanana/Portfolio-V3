// Client testimonials (Cebuano with a bit of English).
// DRAFT wording — confirm with each client before deploying, and edit to match what they actually said.
// `project` links the quote to a case study slug in projects.mjs (optional).
// `logo` replaces the initials on the card (optional). The card shows the left, square part of the image;
// set `logoFit: "contain"` to show the whole logo instead (for logos that are already roughly square).
// `confirmed: true` once the client has approved the wording — unconfirmed quotes are left out of the build.

export const testimonials = [
  {
    name: "Michael Quijada",
    role: "Owner, MQ Printing Services",
    project: "mqprints",
    logo: "Image/clients/mq.webp",
    confirmed: true,
    quote:
      "Working with Genesis made it easy to express my vision for MQ Prints. He provided clear layouts, kept me updated in every phase, and suggested great improvements where I needed help. My website now runs smoothly and is truly one-of-a-kind in the printing industry - as far as I know, it's among the first of its kind and revolutionary for the business. I feel confident and proud to share it with customers. More than a service provider, Genesis felt like a real partner. Highly recommended!",
  },
  {
    name: "Wilmar Luyao",
    role: "CEO &amp; Founder, WL Construction",
    project: "wl-construction",
    logo: "Image/clients/wl-construction.png",
    logoFit: "contain",
    confirmed: true,
    quote:
      "I am extremely satisfied with Genesis Jr's service, it far exceeded my expectations! He brought my vision for my company branding to life, from the logo, color palette, and typography to the layout. The multiple options he provided were a huge help, along with his expert insights and opinions on our choices. The best part is he even included a roadmap as a bonus. Highly recommended if you want top-quality branding!",
  },
];
