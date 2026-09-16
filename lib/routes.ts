// Every internal URL in one place. Design file → route:
//   ClothSE Homepage → /            Shop Listing → /shop        Sale → /sale
//   New Arrivals → /new-arrivals    Product Detail → /products/:id
//   My Bag & Orders → /bag          Favourites → /favourites    Account → /account
//   Sign In & Sign Up → /sign-in    Forgot/Reset Password → /forgot-password, /reset-password
//   Store Management → /admin       About/Contact/FAQ/Privacy/Terms → /about …

export type CategoryName = "Tops" | "Bottoms" | "Accessories" | "Footwear";
export type BagTab = "bag" | "pending" | "processing" | "shipping" | "completed" | "cancelled" | "refund";
export type AccountTab = "profile" | "addresses" | "settings";

export const routes = {
  home: "/",
  newArrivals: "/new-arrivals",
  sale: "/sale",
  shop: (opts: { cat?: CategoryName | string; tag?: string; q?: string } = {}) => {
    const p = new URLSearchParams();
    if (opts.cat) p.set("cat", opts.cat);
    if (opts.tag) p.set("tag", opts.tag);
    if (opts.q) p.set("q", opts.q);
    const qs = p.toString();
    return qs ? `/shop?${qs}` : "/shop";
  },
  product: (id: number | string) => `/products/${id}`,
  bag: (tab: BagTab = "bag") => (tab === "bag" ? "/bag" : `/bag?tab=${tab}`),
  checkout: "/checkout",
  favourites: "/favourites",
  account: (tab: AccountTab = "profile") => (tab === "profile" ? "/account" : `/account?tab=${tab}`),
  signIn: "/sign-in",
  signUp: "/sign-in?mode=signup",
  signOut: "/sign-out",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  admin: "/admin",
  about: "/about",
  contact: "/contact",
  faq: "/faq",
  privacy: "/privacy",
  terms: "/terms",
} as const;
