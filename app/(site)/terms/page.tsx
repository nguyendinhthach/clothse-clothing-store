import type { Metadata } from "next";
import Link from "next/link";
import { Callout, LegalBand, LegalHero, LegalSection } from "@/components/static/Legal";
import { routes } from "@/lib/routes";
import styles from "@/components/static/static.module.css";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <LegalHero kicker="Legal · Updated September 2026" title="Terms of" block="Service" lead="The rules for shopping with ClothSE — plus our full shipping and returns policy, in one place." />
      <div className={`container ${styles.legal}`}>
        <LegalSection n={1} title="Agreement">
          <p>By browsing ClothSE or placing an order you agree to these terms. We stock streetwear from third-party brands; product descriptions, measurements and imagery are supplied by those brands and reproduced in good faith.</p>
          <p>We may update these terms as the store changes. The version shown on this page is the one that applies to your order.</p>
        </LegalSection>

        <LegalSection n={2} title="Orders & acceptance">
          <p>An order is a request to buy, not a confirmed sale. We confirm each order manually before it moves into processing — you can follow its status in <Link href={routes.bag("pending")}>Orders</Link>.</p>
          <ul>
            <li>We may decline an order if stock has sold out, pricing was listed in error, or the delivery details are incomplete.</li>
            <li>Prices are shown in Vietnamese đồng and include VAT where applicable.</li>
            <li>Stock is shared with our physical inventory, so sizes can sell out between adding to bag and confirmation.</li>
          </ul>
        </LegalSection>

        <LegalSection n={3} title="Payment">
          <p>ClothSE accepts cash on delivery (COD) only. You pay the courier in full when the parcel arrives — no card details are collected, stored or processed by us at any point.</p>
          <Callout>COD only · have the exact amount ready for the courier</Callout>
        </LegalSection>

        <LegalSection n={4} title="Shipping policy">
          <ul>
            <li><strong>Dispatch:</strong> confirmed orders are packed and handed to the courier within 1–2 business days.</li>
            <li><strong>Delivery:</strong> 1–2 business days within Da Lat, 2–4 business days elsewhere in Vietnam.</li>
            <li><strong>Shipping fee:</strong> 30.000₫ flat.</li>
            <li><strong>Free shipping:</strong> on orders over 1.000.000₫.</li>
            <li><strong>Failed delivery:</strong> couriers attempt delivery twice; undelivered COD parcels return to us and the order is cancelled.</li>
          </ul>
        </LegalSection>

        <LegalSection n={5} title="Returns & refunds">
          <p>You have 30 days from delivery to return an item.</p>
          <ul>
            <li>Items must be unworn, unwashed and returned with all original tags attached.</li>
            <li>Footwear must come back in its original box, undamaged.</li>
            <li>Underwear, socks and face coverings cannot be returned for hygiene reasons.</li>
            <li>Sale items follow the same 30-day window unless marked final sale.</li>
          </ul>
          <p>To request a return, open the completed order under <Link href={routes.bag("completed")}>Orders</Link> and press “Request refund”, or message us from the Contact page with your order number. We reply with return instructions; once the return is received and checked, refunds are issued by bank transfer within 5 business days. Return shipping is paid by the customer unless the item arrived faulty or incorrect.</p>
        </LegalSection>

        <LegalSection n={6} title="Cancellations">
          <p>Pending orders can be cancelled free of charge from Orders in your account. Once we have started processing an order, message us with your order number; once a parcel has left with the courier it must be handled as a return.</p>
          <p>Repeatedly refusing COD parcels at the door may result in us declining future orders.</p>
        </LegalSection>

        <LegalSection n={7} title="Site usage">
          <p>Content on this site — copy, layout and photography — belongs to ClothSE or the brands we stock, and may not be reused commercially without permission. Accounts are personal; keep your login details to yourself and let us know if you suspect misuse.</p>
        </LegalSection>

        <LegalBand />
      </div>
    </>
  );
}
