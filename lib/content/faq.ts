// FAQ copy. Answers reflect how the store actually works (SPEC §6): COD only,
// in-app cancel/refund requests, 30.000₫ shipping free over 1.000.000₫.
export interface FaqGroup {
  title: string;
  items: { q: string; lines: string[] }[];
}

export const FAQ_GROUPS: FaqGroup[] = [
  { title: "Orders & Payment", items: [
    { q: "What payment methods do you accept?", lines: ["Cash on delivery only for now — you pay the courier in full when the parcel arrives.", "No card details are collected or stored on the site."] },
    { q: "Can I change or cancel my order?", lines: ["You can cancel any order that is still pending from Orders in your account — stock goes straight back on the shelf.", "Once we start processing it, message us with your order number and we will sort it out; after dispatch it has to be handled as a return."] },
    { q: "How do I know my order was confirmed?", lines: ["Every order is reviewed manually before it moves into processing. You can follow its status under Orders in your account."] },
  ] },
  { title: "Shipping", items: [
    { q: "How long does delivery take?", lines: ["1–2 business days within Da Lat, 2–4 business days elsewhere in Vietnam.", "Confirmed orders are packed and handed to the courier within 1–2 business days."] },
    { q: "Do you ship outside Da Lat?", lines: ["Yes — we ship nationwide. Delivery outside Da Lat typically takes 2–4 business days."] },
    { q: "How much is shipping?", lines: ["A flat 30.000₫, free on orders over 1.000.000₫."] },
  ] },
  { title: "Returns & Refunds", items: [
    { q: "What's your return policy?", lines: ["30 days from delivery, on items that are unworn, unwashed and still have their original tags attached.", "Footwear must come back in its original box. Underwear, socks and face coverings cannot be returned for hygiene reasons."] },
    { q: "How do I request a return?", lines: ["Open the completed order under Orders in your account and press “Request refund” — it is available for 30 days after delivery. We reply with return instructions.", "Once the return arrives and is checked, the refund is issued by bank transfer within 5 business days."] },
    { q: "Who pays for return shipping?", lines: ["The customer, unless the item arrived faulty or was not what was ordered — then it is on us."] },
  ] },
  { title: "Account", items: [
    { q: "Do I need an account to shop?", lines: ["You can browse the whole store without one, but you will need to sign in (or create an account — it only takes a few seconds) to add items to your bag or favourites and to check out.", "An account also saves your addresses and order history, and lets you turn on restock alerts."] },
    { q: "How do I reset my password?", lines: ["Use the “Forgot password?” link on the sign-in page and follow the emailed reset link."] },
    { q: "How do restock alerts work?", lines: ["Turn on “Notify me” for any item in Favourites and we will email you once it is back in stock — and when it goes on sale."] },
  ] },
];
