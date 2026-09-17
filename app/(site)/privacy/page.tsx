import type { Metadata } from "next";
import Link from "next/link";
import { Callout, LegalBand, LegalHero, LegalSection } from "@/components/static/Legal";
import { routes } from "@/lib/routes";
import styles from "@/components/static/static.module.css";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <LegalHero kicker="Privacy · Updated September 2026" title="Privacy" block="Policy" lead="What we collect, why we need it, and how to get it changed or deleted. Short version: only what an order needs." />
      <div className={`container ${styles.legal}`}>
        <LegalSection n={1} title="What we collect">
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Delivery address</li>
            <li>Order history — what you bought, sizes, and order status</li>
          </ul>
          <p>If you create an account we also store your saved addresses and your Favourites list. We do not collect payment card data at all.</p>
        </LegalSection>

        <LegalSection n={2} title="Why we use it">
          <ul>
            <li><strong>Processing orders:</strong> confirming, packing and handing your parcel to the courier.</li>
            <li><strong>COD delivery contact:</strong> your phone number and address go to the courier so they can reach you at the door and collect payment.</li>
            <li><strong>Restock and sale notifications:</strong> only if you turned on “Notify me” for an item in Favourites, or opted into the weekly email.</li>
            <li><strong>Support:</strong> answering messages you send from the Contact page.</li>
          </ul>
          <p>We do not sell your data, and we do not use it for profiling or advertising.</p>
        </LegalSection>

        <LegalSection n={3} title="Payment data">
          <p>ClothSE supports cash on delivery only. No card or bank details are collected on this site, so there is nothing to pass to a payment processor — no third-party payment provider receives your data.</p>
          <Callout>No card data collected · COD only</Callout>
        </LegalSection>

        <LegalSection n={4} title="Who sees your data">
          <p>Only the ClothSE team, and the delivery courier assigned to your order — who receives your name, phone number, address and the amount to collect. Nothing else is shared with anyone else unless we are legally required to.</p>
        </LegalSection>

        <LegalSection n={5} title="How long we keep it">
          <p>Order records are kept for as long as we need them for accounting and returns. Account details stay until you ask us to delete the account; marketing consent ends the moment you unsubscribe.</p>
        </LegalSection>

        <LegalSection n={6} title="Your choices">
          <ul>
            <li>Ask for a copy of the data we hold about you.</li>
            <li>Ask us to correct anything wrong — name, email and phone can be changed any time under <Link href={routes.account()}>Account</Link>.</li>
            <li>Ask us to delete your account and personal details.</li>
            <li>Turn off restock alerts in Favourites, or unsubscribe from any email in one click.</li>
          </ul>
          <p>Send any of these requests through the <Link href={routes.contact}>Contact page</Link> and we will action them within 30 days.</p>
        </LegalSection>

        <LegalBand />
      </div>
    </>
  );
}
