# Customer app

Native canvas is `paper`; plates are `surface`. Orange only for the primary action and active state.

- **Home:** logo left; Refer pill and Support right; a 2-column grid of service tiles from Office Hub Services; one muted line. No orange billboard. (Today's `hub-hero` gradient is legacy; replace with `paper` + tiles.)
- **Catalog:** 4:3 image, title, store chip, price, one "Add" CTA. Search, category chips and sort sit above (Upgrade: not built today).
- **Store page:** cover, logo, verified badge, rating, hours, delivery info, catalog. Merchants fill this from Seller.
- **Product page:** gallery, variants, stock state, seller, reviews, policy line.
- **Cart and checkout:** one store per cart. Marketplace checkout is a merchant flow, not Send's FX shell. Total in the pay currency; methods for that currency.
- **Experts:** directory (search, language, category) → profile (credentials, languages, intro video, reviews) → service → slot → pay. Time zones shown both sides.
- **Orders and bookings:** one timeline: placed, accepted, preparing, ready or shipped, completed; chat with the seller; report a problem; review after completion.
- **Send:** unchanged wizard; same fee numbers as web.
- **Transactions:** amount, counterparty, status chip, line.
- **States to design for every list:** first-load skeleton, empty, error with retry, offline cached.
