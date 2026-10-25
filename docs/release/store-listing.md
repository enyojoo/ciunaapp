# Store listing, privacy forms and review notes

Draft for items R4 to R7 of `docs/build-plan/testing-readiness-plan.md`. Text is short on purpose. The Russian text should be checked by the Russian-speaking staff and the French, Spanish, Portuguese and Chinese text by the native reviewer for each language (decision 6) before it goes in a store. Copy limits: App Store name 30, subtitle 30, promotional text 170, keywords 100; Google Play title 30, short description 80, full description 4000.

## Name and tagline

| Language | Name | Subtitle / short description |
| --- | --- | --- |
| English | Ciuna | Food, groceries, experts and transfers |
| Русский | Ciuna | Еда, продукты, эксперты и переводы |
| Français | Ciuna | Repas, courses, experts et transferts |
| Español | Ciuna | Comida, compras, expertos y envíos |
| Português | Ciuna | Comida, compras, especialistas e envios |
| 中文 | Ciuna | 美食、超市、专家与转账 |

## Description

**English.** Ciuna is one app for life in Russia. Order food and groceries from stores that serve your community, book trusted experts for documents, translation, housing and more, and send money home. Pick your city and your community once and the app shows what is near you. Pay by card or SBP, follow every order and chat with the seller. Available in English, Russian, French, Spanish, Portuguese and Chinese.

**Русский.** Ciuna: одно приложение для жизни в России. Заказывайте еду и продукты в магазинах вашего сообщества, записывайтесь к проверенным экспертам (документы, перевод, жильё и не только) и отправляйте деньги домой. Выберите город и сообщество один раз, и приложение покажет то, что рядом. Оплата картой или через СБП, статус каждого заказа и чат с продавцом. На русском, английском, французском, испанском, португальском и китайском.

**Français.** Ciuna, une seule appli pour vivre en Russie. Commandez repas et courses dans des boutiques de votre communauté, réservez des experts de confiance (papiers, traduction, logement et plus) et envoyez de l'argent au pays. Choisissez votre ville et votre communauté une fois : l'appli montre ce qui est près de vous. Payez par carte ou SBP, suivez chaque commande et discutez avec le vendeur. Disponible en six langues.

**Español.** Ciuna, una sola app para vivir en Rusia. Pide comida y compras en tiendas de tu comunidad, reserva expertos de confianza (documentos, traducción, vivienda y más) y envía dinero a casa. Elige tu ciudad y tu comunidad una vez y la app muestra lo que tienes cerca. Paga con tarjeta o SBP, sigue cada pedido y chatea con el vendedor. Disponible en seis idiomas.

**Português.** Ciuna, um só app para viver na Rússia. Peça comida e compras em lojas da sua comunidade, reserve especialistas de confiança (documentos, tradução, moradia e mais) e envie dinheiro para casa. Escolha sua cidade e sua comunidade uma vez e o app mostra o que está perto de você. Pague com cartão ou SBP, acompanhe cada pedido e converse com o vendedor. Disponível em seis idiomas.

**中文。** Ciuna，在俄罗斯生活的一站式应用。向您所在社群的店铺订餐、买菜，预约值得信赖的专家（证件、翻译、租房等），还能把钱汇回家。只需选择一次城市和社群，应用就会显示您附近的内容。支持银行卡或 SBP 付款，随时查看订单并与卖家聊天。支持六种语言。

## Keywords (App Store, English, 100 characters)

`food,grocery,experts,transfer,send money,Russia,Moscow,delivery,SBP,community`

## Category and age rating

- Category: Lifestyle (primary), Finance (secondary) on the App Store; Lifestyle on Google Play.
- Age rating: answer the questionnaires honestly. The app has financial transactions and chat between a buyer and a seller, no public user-generated feed, no gambling and no promoted alcohol sales. Expect 12+ on the App Store and Teen or Everyone 10+ on Google Play; confirm the result with the owner before submitting.
- Support URL and privacy URL: the live pages on the company domain; both must exist before submission (owner).

## Privacy labels and data safety

Data the app collects, linked to the user and used for app functionality and fraud prevention, not for advertising or tracking (the app has no ad SDK and no tracking):

| Data | Why |
| --- | --- |
| Name, email, phone | Account, orders, support |
| Government ID and a selfie or address document | Identity verification (KYC) for sending money, done by the verification partner |
| Payment information | Card and SBP payments go through the payment provider; the app does not store card numbers |
| Purchases and transactions | Orders, transfers, receipts |
| Delivery address and chosen city | Delivery and showing nearby stores |
| User content: chat messages, support requests, reviews | Messaging with sellers and support |
| Device push token | Order, chat and booking notifications |
| Crash reports | Fixing errors (scrubbed of personal data before they leave the server) |

Data deletion: in the app, More, Delete account (30-day restore window, then personal data is removed). Encryption in transit: yes. Data shared with third parties: payment provider, verification partner, email and push delivery, hosting.

## Notes for the reviewers (R6, R7)

- Sign-in: the owner creates review accounts (R7), one per language, and keeps the list outside the repository. Use a verified customer account on the staging build, with send limits low, so a reviewer can walk Send without real money moving.
- Account deletion: More, Delete account. It explains what is removed, what is kept by law, and blocks while an order or transfer is open.
- Payments: online payment uses YooKassa (card, SBP) in a secure web view or widget; bank transfer is the alternative. No in-app purchase is needed: the app sells physical goods, services performed outside the app and money transfers, which the stores treat as outside their billing.
- Identity verification: Send needs verification; the check happens on the partner's secure page.
- Permissions: notifications (order and chat updates) and photos or camera only when the user attaches a document or receipt. Location is not used; the city is chosen from a list.
- Languages: the app follows the device language (English, Russian, French, Spanish, Portuguese, Simplified Chinese) and can be changed on the sign-in screen and in the account.

## Screenshots to capture (owner, from the staging build)

Home with the three slides, Food home with the city and community pills, a store page, the cart, an order with chat, Experts, Send with limits, verification, the language sheet. Capture them in each language on a 6.9 inch and a 6.5 inch iPhone and a phone and a tablet on Android.
