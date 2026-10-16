# Strings to review (V4)

Agent-written translations. Each file below is the single source for its strings: edit the JSON to change a string, no code change needed. After edits run `npm run locales:check` (must print `locales ok`).

Regenerate with `node scripts/list-strings-to-review.mjs`.
Total strings: 7500.


## Seller portal

### `seller/locales/ru/auth.json` (18 strings)

| Key | Text | English source |
| --- | --- | --- |
| `auth.login.title` | Вход в Ciuna Seller | Sign in to Ciuna Seller |
| `auth.login.subtitle` | Используйте свой аккаунт Ciuna. Впервые в Ciuna? Создайте аккаунт за минуту. | Use your Ciuna account. New to Ciuna? Create one in a minute. |
| `auth.login.cta` | Войти | Sign in |
| `auth.register.title` | Начните продавать в Ciuna | Start selling on Ciuna |
| `auth.register.subtitle` | Находите клиентов среди тех, кто живёт за границей и ищет то, что вы предлагаете. | Reach people living abroad who are looking for what you offer. |
| `auth.register.cta` | Создать аккаунт | Create account |
| `auth.noAccount` | Ещё нет аккаунта? | No account yet? |
| `auth.haveAccount` | Уже есть аккаунт? | Already have an account? |
| `auth.email` | Электронная почта | Email |
| `auth.password` | Пароль | Password |
| `auth.passwordHint` | Не менее 8 символов. | At least 8 characters. |
| `auth.passwordShort` | Пароль должен содержать не менее 8 символов. | Use at least 8 characters for your password. |
| `auth.firstName` | Имя | First name |
| `auth.lastName` | Фамилия | Last name |
| `auth.invalid` | Неверный адрес электронной почты или пароль. | Email or password is incorrect. |
| `auth.exists` | Аккаунт с этим адресом уже существует. Войдите в него. | An account with this email already exists. Sign in instead. |
| `auth.checkEmail.title` | Проверьте почту | Check your email |
| `auth.checkEmail.body` | Мы отправили ссылку для подтверждения на {email}. Откройте её, затем войдите. | We sent a confirmation link to {email}. Open it, then sign in. |

### `seller/locales/ru/catalog.json` (147 strings)

| Key | Text | English source |
| --- | --- | --- |
| `catalog.title` | Каталог | Catalog |
| `catalog.intro` | Всё, что вы продаёте. Изменения цен и остатков применяются сразу. | Everything you sell. Edits to prices and stock apply straight away. |
| `catalog.back` | Назад в каталог | Back to catalog |
| `catalog.search` | Поиск товаров | Search products |
| `catalog.new.title` | Новый товар | Add product |
| `catalog.edit.title` | Редактирование товара | Edit product |
| `catalog.action.add` | Добавить товар | Add product |
| `catalog.action.import` | Импорт из CSV | Import from CSV |
| `catalog.action.pause` | Приостановить | Pause |
| `catalog.action.publish` | Опубликовать | Publish |
| `catalog.action.saveDraft` | Сохранить как черновик | Save as draft |
| `catalog.action.moveToDraft` | Перевести в черновик | Move to draft |
| `catalog.action.saveChanges` | Сохранить изменения | Save changes |
| `catalog.action.archive` | Архивировать товар | Archive product |
| `catalog.link.fulfilment` | Зоны доставки и самовывоз | Delivery zones and pickup |
| `catalog.tab.all` | Все | All |
| `catalog.tab.live` | В продаже | Live |
| `catalog.tab.draft` | Черновики | Draft |
| `catalog.tab.archived` | Архив | Archived |
| `catalog.status.draft` | Черновик | Draft |
| `catalog.status.live` | В продаже | Live |
| `catalog.status.archived` | В архиве | Archived |
| `catalog.stock.count` | В наличии: {n} | {n} in stock |
| `catalog.stock.unlimited` | Без ограничений | Unlimited |
| `catalog.stock.soldOut` | Нет в наличии | Sold out |
| `catalog.stock.soldOutToggle` | Отметить «{title}» как закончившийся | Mark {title} as sold out |
| `catalog.review.pending` | На проверке | Under review |
| `catalog.review.rejected` | Отклонено: {note} | Rejected: {note} |
| `catalog.empty.title` | Пока нет товаров | No products yet |
| `catalog.empty.body` | Добавьте первый товар или загрузите сразу много из CSV-файла. | Add your first product, or import many at once from a CSV file. |
| `catalog.empty.noMatch` | Ничего не найдено. | No products match. |
| `catalog.toast.savedDraft` | Сохранено как черновик | Saved as draft |
| `catalog.toast.published` | Опубликовано | Published |
| `catalog.toast.paused` | Приостановлено | Paused |
| `catalog.toast.archived` | Товар в архиве | Product archived |
| `catalog.toast.soldOutOn` | Отмечено как закончившееся | Marked as sold out |
| `catalog.toast.soldOutOff` | Снова в наличии | Back in stock |
| `catalog.toast.fulfilmentSaved` | Способы получения сохранены | Fulfilment saved |
| `catalog.form.moderationHint` | Изменения текста и фото вступают в силу сразу. Ciuna проверяет их позже и может попросить внести правки. | Changes to text and photos go live straight away. Ciuna reviews them afterwards and may ask you to fix them. |
| `catalog.form.publishLater` | Публиковать можно после одобрения вашего бизнеса в Ciuna. | You can publish once Ciuna approves your business. |
| `catalog.form.unsaved` | Есть несохранённые изменения. | You have unsaved changes. |
| `catalog.form.fixErrors` | Проверьте выделенные поля. | Check the highlighted fields. |
| `catalog.section.basics` | Основное | Basics |
| `catalog.section.photos` | Фото | Photos |
| `catalog.section.price` | Цена | Price |
| `catalog.section.stock` | Остатки | Stock |
| `catalog.section.fulfilment` | Получение заказа | Fulfilment |
| `catalog.lang.defaultHint` | Основной язык. Показывается, если на языке покупателя ничего не заполнено. | Default language. This is shown when a customer's language isn't filled in. |
| `catalog.lang.otherHint` | Необязательно. Если оставить пустым, покажем основной язык. | Optional. Leave blank to show your default language. |
| `catalog.field.title` | Название | Name |
| `catalog.field.short` | Краткое описание | Short description |
| `catalog.field.shortHint` | Показывается в списках. До 300 символов. | Shown in lists. Up to 300 characters. |
| `catalog.field.long` | Полное описание | Full description |
| `catalog.field.category` | Категория | Category |
| `catalog.field.listPrice` | Цена | Price |
| `catalog.field.salePrice` | Цена со скидкой | Sale price |
| `catalog.field.salePriceHint` | Необязательно. Должна быть ниже цены. | Optional. Must be lower than the price. |
| `catalog.field.currency` | Валюта | Currency |
| `catalog.field.unlimited` | Без ограничения остатков | Unlimited stock |
| `catalog.field.stock` | Количество в наличии | Quantity in stock |
| `catalog.field.soldOut` | Нет в наличии | Sold out |
| `catalog.field.soldOutHint` | Покупатели не смогут заказать товар, пока вы не выключите это. | Customers can't order it until you switch this off. |
| `catalog.cat.Meals` | Блюда | Meals |
| `catalog.cat.Snacks` | Закуски | Snacks |
| `catalog.cat.Drinks` | Напитки | Drinks |
| `catalog.cat.Other` | Другое | Other |
| `catalog.cat.Groceries` | Продукты | Groceries |
| `catalog.cat.Household` | Для дома | Household |
| `catalog.cat.Electronics` | Электроника | Electronics |
| `catalog.photos.hint` | Первое фото основное. Можно добавить ещё до 8. | The first photo is the main one. Add up to 8 more. |
| `catalog.photos.main` | Основное фото | Main photo |
| `catalog.photos.addMain` | Добавить основное фото | Add main photo |
| `catalog.photos.add` | Добавить фото | Add photo |
| `catalog.photos.gallery` | Ещё фото ({n} из 8) | More photos ({n} of 8) |
| `catalog.mode.delivery` | Доставка | Delivery |
| `catalog.mode.pickup` | Самовывоз | Pickup |
| `catalog.mode.digital` | Цифровой | Digital |
| `catalog.mode.deliveryHint` | Вы доставляете товар покупателю. | You deliver this to the customer. |
| `catalog.mode.pickupHint` | Покупатель забирает заказ в вашей точке самовывоза. | The customer collects it from your pickup location. |
| `catalog.mode.digitalHint` | Выдаётся онлайн, отправлять ничего не нужно. | Delivered online, nothing to ship. |
| `catalog.archive.title` | Архивировать этот товар? | Archive this product? |
| `catalog.archive.body` | Он исчезнет из магазина. В прошлых заказах данные сохранятся, а сам товар останется в разделе «Архив». | It will disappear from the store. Past orders keep their details, and you can still find it under Archived. |
| `catalog.fulfilment.title` | Доставка и самовывоз | Delivery and pickup |
| `catalog.fulfilment.intro` | Укажите, где покупатели забирают заказы и в какие районы вы доставляете. Для публикации товаров с доставкой нужны зоны доставки, для товаров с самовывозом — данные о точке самовывоза. | Set where customers collect orders and which areas you deliver to. You need delivery zones to publish delivery products, and pickup details to publish pickup products. |
| `catalog.fulfilment.pickup` | Самовывоз | Pickup |
| `catalog.fulfilment.pickupHint` | Покупатели увидят это, выбрав самовывоз. | Customers see this when they choose pickup. |
| `catalog.fulfilment.location` | Адрес самовывоза | Pickup address |
| `catalog.fulfilment.hours` | Часы работы | Opening hours |
| `catalog.fulfilment.hoursHint` | Например: пн–сб, 9:00–20:00 | For example: Mon to Sat, 9:00 to 20:00 |
| `catalog.fulfilment.notes` | Примечания для покупателей | Notes for customers |
| `catalog.fulfilment.zones` | Зоны доставки | Delivery zones |
| `catalog.fulfilment.zonesHint` | Доставку можно заказать только в указанных зонах. | Customers can order delivery only in the zones you list. |
| `catalog.fulfilment.noZones` | Зон доставки пока нет. | No delivery zones yet. |
| `catalog.fulfilment.city` | Город | City |
| `catalog.fulfilment.district` | Район | District |
| `catalog.fulfilment.fee` | Стоимость доставки | Delivery fee |
| `catalog.fulfilment.active` | Активна | Active |
| `catalog.fulfilment.inactive` | Неактивна | Inactive |
| `catalog.fulfilment.addZone` | Добавить зону | Add zone |
| `catalog.fulfilment.pickupMissing` | Укажите адрес самовывоза, чтобы публиковать товары с самовывозом. | Add your pickup address to publish pickup products. |
| `catalog.fulfilment.zonesMissing` | Добавьте хотя бы одну активную зону доставки, чтобы публиковать товары с доставкой. | Add at least one active delivery zone to publish delivery products. |
| `catalog.fulfilment.setup` | Настроить | Set up |
| `catalog.import.title` | Импорт товаров | Import products |
| `catalog.import.intro` | Добавьте до 200 товаров из CSV-файла. Они создаются как черновики, чтобы вы могли всё проверить. | Add up to 200 products from a CSV file. They are created as drafts so you can check them first. |
| `catalog.import.step1` | 1. Скачайте шаблон | 1. Get the template |
| `catalog.import.step1Hint` | Один товар в строке. До {max} строк. Для дробных чисел подойдёт точка или запятая. | Fill in one product per row. Up to {max} rows. Use a period or comma for decimals. |
| `catalog.import.template` | Скачать шаблон | Download template |
| `catalog.import.choose` | Выбрать CSV-файл | Choose CSV file |
| `catalog.import.badFile` | Не удалось прочитать файл. Используйте шаблон и проверьте столбцы title и list_price. | We couldn't read that file. Use the template and check the title and list_price columns. |
| `catalog.import.step2` | 2. Проверьте товары | 2. Check your products |
| `catalog.import.summary` | {file}: готово {valid}, с ошибками {invalid}. Импортируются только готовые строки. | {file}: {valid} ready, {invalid} with problems. Only ready rows are imported. |
| `catalog.import.tooMany` | Используются только первые {max} из {total} строк. | Only the first {max} of {total} rows are used. |
| `catalog.import.lineUnknown` | Категории проверяются при создании каждого товара. | Categories are checked when each product is created. |
| `catalog.import.col.row` | Строка | Row |
| `catalog.import.col.status` | Статус | Status |
| `catalog.import.ready` | Готово | Ready |
| `catalog.import.progress` | Импортировано {done} из {total} | {done} of {total} imported |
| `catalog.import.step3` | 3. Импорт | 3. Import |
| `catalog.import.result` | Создано: {created}, не удалось: {failed}. | {created} created, {failed} failed. |
| `catalog.import.draftNote` | Созданные товары — черновики. Откройте каждый, добавьте фото и опубликуйте. | Created products are drafts. Open each one to add photos, then publish. |
| `catalog.import.failedRow` | Строка {line} ({title}): {reason} | Row {line} ({title}): {reason} |
| `catalog.import.another` | Импортировать другой файл | Import another file |
| `catalog.import.viewCatalog` | Открыть каталог | View catalog |
| `catalog.import.start` | Импортировать товаров: {n} | Import {n} products |
| `catalog.import.finished` | Импорт завершён | Import finished |
| `errors.PRODUCT_NOT_FOUND` | Товар не найден. | We couldn't find that product. |
| `errors.STORE_ONLY` | Товарами могут управлять только магазины. | Only stores can manage products. |
| `errors.TITLE_REQUIRED` | Введите название не короче 2 символов. | Enter a name with at least 2 characters. |
| `errors.PRICE_REQUIRED` | Укажите цену больше 0. | Enter a price above 0. |
| `errors.SALE_PRICE_TOO_HIGH` | Цена со скидкой должна быть ниже цены. | The sale price must be lower than the price. |
| `errors.INVALID_STOCK` | Введите целое число от 0. | Enter a whole number of 0 or more. |
| `errors.CATEGORY_OUTSIDE_LINE` | Эта категория недоступна для вашего магазина. | That category isn't available for your store. |
| `errors.FULFILLMENT_REQUIRED` | Выберите доставку, самовывоз или цифровой товар. | Choose delivery, pickup or digital. |
| `errors.GALLERY_INVALID` | Не более 8 фото, ссылки только https. | Use up to 8 photos with https links. |
| `errors.LISTING_REJECTED` | Объявление отклонено. Измените текст или фото, чтобы отправить его снова. | This listing was rejected. Edit the text or photos to submit it again. |
| `errors.VENDOR_UNAVAILABLE` | Ваш магазин сейчас недоступен для покупателей. | Your store isn't available to customers right now. |
| `errors.PICKUP_CONFIGURATION_REQUIRED` | Укажите адрес самовывоза перед публикацией товаров с самовывозом. | Add your pickup address before publishing pickup products. |
| `errors.DELIVERY_ZONE_REQUIRED` | Добавьте зону доставки перед публикацией товаров с доставкой. | Add a delivery zone before publishing delivery products. |
| `errors.PAYMENT_METHOD_REQUIRED` | Добавьте способ оплаты перед публикацией. | Add a payment method before publishing. |
| `errors.VENDOR_REQUIRED` | Настройте магазин, прежде чем добавлять товары. | Set up your store before adding products. |
| `errors.TRANSLATIONS_INVALID` | Некоторые переводы некорректны. | Some translations aren't valid. |
| `errors.STATUS_INVALID` | Выберите: черновик, в продаже или архив. | Choose draft, live or archived. |
| `errors.TOO_MANY_ZONES` | Можно добавить до 200 зон. | You can add up to 200 zones. |
| `errors.ZONE_INVALID` | Укажите город и район для каждой зоны. | Enter a city and a district for every zone. |
| `errors.ZONE_FEE_INVALID` | Укажите стоимость доставки от 0. | Enter a delivery fee of 0 or more. |
| `errors.ZONE_CURRENCY_INVALID` | Выберите поддерживаемую валюту для зоны. | Choose a supported currency for the zone. |
| `errors.ZONE_DUPLICATE` | Каждый город и район можно указать только один раз. | Each city and district can be listed only once. |

### `seller/locales/ru/common.json` (151 strings)

| Key | Text | English source |
| --- | --- | --- |
| `app.name` | Ciuna Seller | Ciuna Seller |
| `nav.home` | Главная | Home |
| `nav.orders` | Заказы | Orders |
| `nav.bookings` | Бронирования | Bookings |
| `nav.catalog` | Каталог | Catalog |
| `nav.services` | Услуги | Services |
| `nav.messages` | Сообщения | Messages |
| `nav.earnings` | Доходы | Earnings |
| `nav.profile` | Профиль | Profile |
| `nav.store` | Магазин | Store |
| `nav.availability` | Расписание | Availability |
| `nav.settings` | Настройки | Settings |
| `nav.more` | Ещё | More |
| `action.save` | Сохранить изменения | Save changes |
| `action.cancel` | Отмена | Cancel |
| `action.continue` | Продолжить | Continue |
| `action.back` | Назад | Back |
| `action.retry` | Повторить | Try again |
| `action.signOut` | Выйти | Sign out |
| `action.add` | Добавить | Add |
| `action.remove` | Удалить | Remove |
| `action.edit` | Изменить | Edit |
| `action.close` | Закрыть | Close |
| `state.loading` | Загрузка | Loading |
| `state.saved` | Сохранено | Saved |
| `state.required` | Обязательное поле | Required |
| `status.draft` | Черновик | Draft |
| `status.in_review` | На проверке | In review |
| `status.live` | Опубликовано | Live |
| `status.paused` | Приостановлено | Paused |
| `status.rejected` | Отклонено | Rejected |
| `status.suspended` | Заблокировано | Suspended |
| `type.store` | Магазин | Store |
| `type.expert` | Эксперт | Expert |
| `role.owner` | Владелец | Owner |
| `role.manager` | Менеджер | Manager |
| `role.staff` | Сотрудник | Staff |
| `role.finance` | Финансы | Finance |
| `language.label` | Язык | Language |
| `merchant.switch` | Сменить бизнес | Switch business |
| `banner.review.title` | Ваша заявка на проверке | Your application is in review |
| `banner.review.body` | Ciuna проверяет ваши данные. Вы можете продолжать готовить свои объявления. | Ciuna is checking your details. You can keep preparing your listings. |
| `banner.rejected.title` | Заявку нужно доработать | Your application needs changes |
| `banner.suspended.title` | Ваш бизнес заблокирован | Your business is suspended |
| `banner.paused.title` | Вы не принимаете новые заказы | You are not accepting new orders |
| `banner.paused.action` | Возобновить продажи | Resume selling |
| `banner.draft.title` | Завершите настройку, чтобы начать продавать | Finish setup to start selling |
| `banner.draft.action` | Продолжить настройку | Continue setup |
| `errors.generic` | Что-то пошло не так. Повторите попытку. | Something went wrong. Try again. |
| `errors.UNAUTHENTICATED` | Войдите, чтобы продолжить. | Sign in to continue. |
| `errors.FORBIDDEN` | У вас нет доступа к этому разделу. | You don't have access to this. |
| `errors.NO_MERCHANT` | Создайте бизнес или присоединитесь к существующему, чтобы продолжить. | Create or join a business to continue. |
| `errors.MERCHANT_NOT_LIVE` | Публиковать можно после одобрения вашего бизнеса в Ciuna. | You can publish once Ciuna approves your business. |
| `errors.MERCHANT_SUSPENDED` | Ваш бизнес заблокирован. Обратитесь в поддержку. | Your business is suspended. Contact support. |
| `errors.MERCHANT_STATUS_NOT_ALLOWED` | Это недоступно при текущем статусе. | This isn't available in your current status. |
| `errors.DISPLAY_NAME_INVALID` | Введите название от 2 до 80 символов. | Enter a name between 2 and 80 characters. |
| `errors.COUNTRY_INVALID` | Выберите страну. | Choose a country. |
| `errors.LANGUAGE_INVALID` | Выберите хотя бы один доступный язык. | Choose at least one supported language. |
| `errors.EMAIL_INVALID` | Введите действующий адрес электронной почты. | Enter a valid email address. |
| `errors.URL_INVALID` | Укажите ссылку, которая начинается с https://. | Use a link that starts with https://. |
| `errors.CURRENCY_INVALID` | Выберите доступную валюту. | Choose a supported currency. |
| `errors.MERCHANT_LIMIT_REACHED` | Можно владеть не более чем 5 бизнесами. | You can own up to 5 businesses. |
| `errors.UNSUPPORTED_FILE_TYPE` | Загрузите изображение JPG, PNG или WebP либо PDF для документов. | Use a JPG, PNG or WebP image, or a PDF for documents. |
| `errors.FILE_TOO_LARGE` | Файл слишком большой. Загрузите файл меньшего размера. | That file is too large. |
| `errors.UPLOAD_FAILED` | Не удалось загрузить файл. Повторите попытку. | Upload failed. Try again. |
| `image.replace` | Заменить изображение | Replace image |
| `action.upload` | Загрузить | Upload |
| `action.submit` | Отправить | Submit |
| `action.done` | Готово | Done |
| `state.default` | по умолчанию | default |
| `noAccess.title` | У вас нет доступа к этой странице | You don't have access to this page |
| `noAccess.body` | Попросите владельца бизнеса дать вам доступ. | Ask the business owner to give you access. |
| `noAccess.back` | На главную | Back to Home |
| `home.setup.progress` | Ход настройки | Setup progress |
| `home.setup.count` | Выполнено {done} из {total} | {done} of {total} done |
| `home.overdue` | Просрочено | Overdue |
| `home.inProgress.help` | Принято или готовится | Accepted or preparing |
| `home.needs.title` | Ждёт вас | Needs you |
| `home.needs.count.one` | {count} задача | {count} item |
| `home.needs.count.other` | Задач: {count} | {count} items |
| `home.needs.empty.title` | Всё сделано | You are all caught up |
| `home.needs.empty.body` | Сейчас ничего не требует вашего внимания. | Nothing needs you right now. |
| `home.needs.accept.one` | Принять 1 новый заказ | Accept 1 new order |
| `home.needs.accept.other` | Принять новые заказы: {count} | Accept {count} new orders |
| `home.needs.acceptBooking.one` | Принять 1 запрос на запись | Accept 1 booking request |
| `home.needs.acceptBooking.other` | Принять запросы на запись: {count} | Accept {count} booking requests |
| `home.needs.acceptSub.due` | Самый старый нужно принять через {time} | The oldest is due in {time} |
| `home.needs.acceptSub.overdue` | Самый старый просрочен на {time} | The oldest is overdue by {time} |
| `home.needs.acceptSub.none` | Ждут вашего подтверждения | Waiting for you to accept |
| `home.needs.reply` | Ответить: {name} | Reply to {name} |
| `home.needs.replySub` | Новое сообщение по заказу {id} | New message about order {id} |
| `home.needs.lowStock` | {title}: осталось {count} | {title}: {count} left |
| `home.needs.lowStockSub` | Обновите остаток или отметьте «распродано» | Update stock or mark it sold out |
| `home.needs.doc` | {label}: срок действия до {date} | {label} expires {date} |
| `home.needs.docSub` | Загрузите обновлённый документ | Upload the renewed document |
| `home.today.title` | Заработок за сегодня | Today's earnings |
| `home.today.orders.one` | {count} заказ | {count} order |
| `home.today.orders.other` | Заказов: {count} | {count} orders |
| `home.today.gross` | Продажи (брутто) | Gross sales |
| `home.today.fee` | Комиссия Ciuna | Ciuna fee |
| `home.today.net` | К получению | Net |
| `home.today.view` | Открыть доходы | View earnings |
| `home.today.empty` | Сегодня завершённых заказов пока нет. | No completed orders yet today. |
| `orders.action.acceptBooking` | Принять запись | Accept booking |
| `orders.tab.board` | Доска | Board |
| `orders.board.empty` | Здесь пусто | Nothing here |
| `orders.rejectedReason` | Причина: | Reason: |
| `orders.reject.bodyRefund` | Покупателю вернут {amount}. Он увидит вашу причину. | The customer will be refunded {amount}. They will see your reason. |
| `earnings.item.keep` | Вы получаете | You keep |
| `earnings.item.reversedNote` | Отменено: этот заказ больше не входит в ваш баланс. | Reversed, so this order no longer counts toward your balance. |
| `earnings.methods.sendRow` | Вывод через Ciuna Send | Withdraw via Ciuna Send |
| `earnings.methods.sendRow.help` | Пока недоступно. | Not available yet. |
| `earnings.methods.defaultBadge` | По умолчанию | Default |
| `home.delta.more` | На {count} заказов больше, чем вчера | {count} more orders than yesterday |
| `home.delta.fewer` | На {count} заказов меньше, чем вчера | {count} fewer orders than yesterday |
| `earnings.rule.food` | Еда | Food |
| `earnings.rule.mart` | Маркет | Mart |
| `earnings.rule.experts` | Услуги экспертов | Expert services |
| `earnings.rule.generic` | Комиссия | Commission |
| `earnings.rule.percent` | {line} {percent}% | {line} {percent}% |
| `earnings.rule.fixed` | {line}: фиксированная комиссия | {line} fixed fee |
| `catalog.section.visibility` | Видимость | Visibility |
| `catalog.field.visible` | Виден в вашем магазине | Visible in your store |
| `catalog.field.visibleOn` | Покупатели смогут найти и заказать товар после сохранения. | Customers can find and order this product after you save. |
| `catalog.field.visibleOff` | Скрыт от покупателей. Включить можно в любой момент. | Hidden from customers. You can turn it on any time. |
| `catalog.import.fileHint` | Файл CSV, до 2 МБ. | CSV file, up to 2 MB. |
| `catalog.import.problem` | Есть ошибка | Has a problem |
| `catalog.fulfilment.unlocks` | Что это открывает | What this unlocks |
| `catalog.fulfilment.unlock.pickup` | Адрес самовывоза | Pickup address |
| `catalog.fulfilment.unlock.pickupHelp` | Покупатели смогут выбрать самовывоз. | Lets customers choose Pickup. |
| `catalog.fulfilment.unlock.delivery` | Активная зона доставки | An active delivery zone |
| `catalog.fulfilment.unlock.deliveryHelp` | Покупатели из этой зоны смогут заказать доставку. | Lets customers in that area order delivery. |
| `catalog.fulfilment.unlock.digital` | Цифровые товары | Digital products |
| `catalog.fulfilment.unlock.digitalHelp` | Не требуют ни самовывоза, ни доставки. | Need neither pickup nor delivery. |
| `messages.pick.title` | Выберите диалог | Choose a conversation |
| `messages.pick.body` | Выберите покупателя слева, чтобы прочитать и ответить. | Pick a customer on the left to read and reply. |
| `reviews.editLeft` | Ответ можно изменить ещё {hours} ч. | You can edit this reply for {hours} more hours. |
| `reviews.locked` | Этот ответ больше нельзя изменить. | This reply can no longer be edited. |
| `merchant.add` | Добавить бизнес | Add a business |
| `merchant.current` | Текущий бизнес | Current business |
| `shell.account` | Меню аккаунта | Account menu |
| `shell.notifications` | Уведомления | Notifications |
| `shell.notifications.count` | Уведомления: ждут вас {count} | Notifications: {count} waiting for you |
| `more.group.business` | Бизнес | Business |
| `more.group.settings` | Настройки | Settings |
| `more.verification.action` | Нужны действия | Action needed |
| `more.verification.review` | На проверке | In review |
| `more.verification.rejected` | Отклонено | Rejected |
| `more.verification.verified` | Подтверждено | Verified |
| `more.team.count` | Человек: {count} | {count} people |
| `more.team.count.one` | 1 человек | 1 person |

### `seller/locales/ru/earnings.json` (152 strings)

| Key | Text | English source |
| --- | --- | --- |
| `earnings.title` | Доходы | Earnings |
| `earnings.subtitle` | Сколько вы заработали, что ожидает и что уже выплачено. | What you have earned, what is waiting, and what has been paid out. |
| `earnings.nav.overview` | Доходы | Earnings |
| `earnings.nav.payouts` | Выплаты | Payouts |
| `earnings.nav.methods` | Способы выплаты | Payout methods |
| `earnings.available` | Доступно | Available |
| `earnings.available.help` | Можно вывести | Ready to withdraw |
| `earnings.pending` | Ожидает | Pending |
| `earnings.pending.help` | Станет доступно через {days} дн. после выполнения заказа | Available after {days} days, once the order is fulfilled |
| `earnings.inPayout` | В выплате | In payout |
| `earnings.inPayout.help` | Запрошено, ожидает отправки | Requested and waiting to be sent |
| `earnings.paidOut` | Выплачено | Paid out |
| `earnings.paidOut.help` | Уже отправлено на ваш счёт | Already sent to your account |
| `earnings.withdraw` | Вывести | Withdraw |
| `earnings.withdraw.cta` | Запросить выплату | Request payout |
| `earnings.withdraw.timing` | Ciuna проверяет выплаты и отправляет их на ваш счёт. Статус будет виден здесь. | Ciuna reviews payouts and sends them to your account. You'll see the status here. |
| `earnings.withdraw.currency` | Валюта | Currency |
| `earnings.withdraw.method` | Выплатить на | Pay out to |
| `earnings.withdraw.noMethod` | Нет проверенного способа | No verified method |
| `earnings.withdraw.unverified.title` | Ожидает проверки | Waiting for verification |
| `earnings.withdraw.unverified.body` | Ciuna ещё проверяет: {names}. Вывести деньги можно после проверки. | Ciuna is still verifying: {names}. You can withdraw once it is verified. |
| `earnings.withdraw.unverified.note` | Пока недоступно, идёт проверка: {names}. | Not available yet, still being verified: {names}. |
| `earnings.withdraw.none.title` | Нет способа выплаты в {currency} | No payout method for {currency} |
| `earnings.withdraw.none.body` | Добавьте банковский счёт в {currency}. Ciuna проверит его перед первой выплатой. | Add a bank account in {currency}. Ciuna verifies it before your first payout. |
| `earnings.methods.manage` | Управление способами | Manage methods |
| `earnings.withdraw.amount` | Сумма | Amount |
| `earnings.withdraw.all` | Вывести всё | Withdraw all |
| `earnings.withdraw.available` | Доступно: | Available: |
| `earnings.withdraw.min` | Минимум | Minimum |
| `earnings.withdraw.requested` | Вы выводите | You withdraw |
| `earnings.withdraw.fee` | Комиссия за выплату | Payout fee |
| `earnings.withdraw.receive` | Вы получите | You receive |
| `earnings.withdraw.success` | Выплата запрошена. Ciuna проверит её и отправит деньги на ваш счёт. | Payout requested. Ciuna will review it and send it to your account. |
| `earnings.withdraw.nothing` | Пока нечего выводить. Доходы становятся доступны после периода удержания. | Nothing available to withdraw yet. Earnings become available after the hold period. |
| `earnings.noAccess.title` | Доходы скрыты | Earnings are private |
| `earnings.noAccess.body` | Попросите владельца, менеджера или финансиста открыть доходы. | Ask the owner, a manager or finance to view earnings. |
| `earnings.empty.title` | Доходов пока нет | No earnings yet |
| `earnings.empty.body` | Когда вы выполните заказ, его доход появится здесь и станет доступен через {days} дн. | When you fulfil an order, its earnings show here and become available after {days} days. |
| `earnings.statement` | Выписка | Statement |
| `earnings.statement.help` | Каждый заказ: товары, доставка, комиссия Ciuna и сколько остаётся вам. | Every order with items, delivery, Ciuna fee and what you keep. |
| `earnings.tab.all` | Все | All |
| `earnings.tab.pending` | Ожидают | Pending |
| `earnings.tab.available` | Доступно | Available |
| `earnings.tab.reversed` | Возвраты | Reversed |
| `earnings.item.pending` | Ожидает | Pending |
| `earnings.item.available` | Доступно | Available |
| `earnings.item.reversed` | Возврат | Reversed |
| `earnings.item.availableOn` | Доступно с {date} | Available on {date} |
| `earnings.item.availableSince` | Доступно с {date} | Available since {date} |
| `earnings.empty.all.title` | Доходов пока нет | No earnings yet |
| `earnings.empty.all.body` | Выполненные заказы появятся здесь. | Fulfilled orders will appear here. |
| `earnings.empty.pending.title` | Нет ожидающих | Nothing pending |
| `earnings.empty.pending.body` | Недавно выполненные заказы ждут здесь окончания периода удержания. | Orders you have fulfilled recently wait here until the hold period ends. |
| `earnings.empty.available.title` | Нет доступных | Nothing available |
| `earnings.empty.available.body` | Здесь появятся доходы, прошедшие период удержания. | Earnings that passed the hold period appear here. |
| `earnings.empty.reversed.title` | Нет возвратов | Nothing reversed |
| `earnings.empty.reversed.body` | Здесь появятся заказы, по которым вернули деньги после выполнения. | Orders refunded after fulfilment appear here. |
| `earnings.col.order` | Заказ | Order |
| `earnings.col.date` | Дата | Date |
| `earnings.col.items` | Товары | Items |
| `earnings.col.delivery` | Доставка | Delivery |
| `earnings.col.fee` | Комиссия Ciuna | Ciuna fee |
| `earnings.col.net` | Вам | You earn |
| `earnings.col.status` | Статус | Status |
| `earnings.loadMore` | Показать ещё | Load more |
| `earnings.download.title` | Скачать выписку | Download statement |
| `earnings.download.help` | Все заказы за период в виде CSV-файла. | Get every order in a date range as a CSV file. |
| `earnings.download.from` | С | From |
| `earnings.download.to` | По | To |
| `earnings.download.cta` | Скачать CSV | Download CSV |
| `earnings.payouts.title` | Выплаты | Payouts |
| `earnings.payouts.subtitle` | Все запрошенные вами выплаты и их статус. | Every payout you requested, and where it stands. |
| `earnings.payouts.noAccess.title` | Выплаты скрыты | Payouts are private |
| `earnings.payouts.noAccess.body` | Попросите владельца или финансиста открыть выплаты. | Ask the owner or finance to view payouts. |
| `earnings.payouts.empty.title` | Выплат пока нет | No payouts yet |
| `earnings.payouts.empty.body` | Когда вы выведете деньги, запрос и его статус появятся здесь. | When you withdraw, the request and its status appear here. |
| `earnings.payouts.empty.cta` | Перейти к доходам | Go to earnings |
| `earnings.payout.status.requested` | Запрошена | Requested |
| `earnings.payout.status.approved` | Одобрена | Approved |
| `earnings.payout.status.paid` | Выплачена | Paid |
| `earnings.payout.status.rejected` | Отклонена | Rejected |
| `earnings.payout.status.cancelled` | Отменена | Cancelled |
| `earnings.payout.requestedOn` | Запрошена {date} | Requested {date} |
| `earnings.payout.fee` | Комиссия за выплату | Payout fee |
| `earnings.payout.received` | Вы получили | You received |
| `earnings.payout.method` | Куда выплачено | Paid to |
| `earnings.payout.paidOn` | Выплачена | Paid on |
| `earnings.payout.reference` | Номер перевода | Reference |
| `earnings.payout.reason` | Причина | Reason |
| `earnings.payout.note.requested` | Ждёт проверки Ciuna. Отменить можно до одобрения. | Waiting for Ciuna to review. You can cancel until it is approved. |
| `earnings.payout.note.approved` | Одобрена. Ciuna отправит деньги на ваш счёт. | Approved. Ciuna will send the money to your account. |
| `earnings.payout.note.paid` | Отправлено на ваш счёт. | Sent to your account. |
| `earnings.payout.note.rejected` | Не выплачена. Деньги вернулись на доступный баланс. | Not paid. The money is back in your available balance. |
| `earnings.payout.note.cancelled` | Отменена. Деньги вернулись на доступный баланс. | Cancelled. The money is back in your available balance. |
| `earnings.payout.cancel` | Отменить запрос | Cancel request |
| `earnings.payout.cancel.q` | Отменить запрос на выплату? | Cancel this payout request? |
| `earnings.payout.cancel.body` | Деньги сразу вернутся на доступный баланс. | The money returns to your available balance right away. |
| `earnings.payout.cancel.confirm` | Отменить запрос | Cancel request |
| `earnings.payout.cancel.keep` | Оставить запрос | Keep request |
| `earnings.payout.cancelled` | Запрос на выплату отменён. | Payout request cancelled. |
| `earnings.kind.bank` | Банковский счёт | Bank account |
| `earnings.kind.sbp` | СБП (Россия) | SBP (Russia) |
| `earnings.kind.ciuna_send` | Ciuna Send | Ciuna Send |
| `earnings.comingSoon` | Скоро | Coming soon |
| `earnings.methods.title` | Способы выплаты | Payout methods |
| `earnings.methods.subtitle` | Куда Ciuna отправляет ваши деньги. | Where Ciuna sends your money. |
| `earnings.methods.add` | Добавить способ | Add method |
| `earnings.methods.add.cta` | Добавить способ | Add method |
| `earnings.methods.default` | по умолчанию | default |
| `earnings.methods.verified` | Проверен | Verified |
| `earnings.methods.waiting` | Ожидает проверки | Waiting for verification |
| `earnings.methods.makeDefault` | Сделать основным | Make default |
| `earnings.methods.defaultSet` | Основной способ обновлён. | Default method updated. |
| `earnings.methods.removed` | Способ удалён. | Method removed. |
| `earnings.methods.added` | Способ добавлен. Ciuna проверит его перед первой выплатой. | Method added. Ciuna will verify it before your first payout. |
| `earnings.methods.remove.q` | Удалить этот способ? | Remove this method? |
| `earnings.methods.remove.body` | Позже его можно добавить снова. Открытые запросы сохранят прежний способ. | You can add it again later. Open payout requests keep their original method. |
| `earnings.methods.verify.title` | Ciuna проверяет новые способы | Ciuna verifies new methods |
| `earnings.methods.verify.body` | Новый способ не получит деньги, пока Ciuna его не проверит. Когда всё будет готово, здесь появится «Проверен». | A new method can't receive money until Ciuna has verified it. You'll see "Verified" here when it is ready. |
| `earnings.methods.empty.title` | Нет способов выплаты | No payout methods |
| `earnings.methods.empty.body` | Добавьте банковский счёт, чтобы выводить доходы. | Add a bank account so you can withdraw your earnings. |
| `earnings.methods.kind` | Тип | Type |
| `earnings.methods.currency` | Валюта | Currency |
| `earnings.methods.sbp.rubOnly` | СБП выплачивает только в рублях. | SBP pays out in RUB only. |
| `earnings.methods.label` | Название способа | Name for this method |
| `earnings.methods.label.hint` | Необязательно, например «Основной счёт». Видно только вам. | Optional, e.g. "Main account". Only you see it. |
| `earnings.methods.privacy` | Реквизиты хранятся в зашифрованном виде и больше не показываются. Видны только последние 4 цифры. | We keep these details encrypted and never show them again. Only the last 4 digits are shown. |
| `earnings.field.phone` | Номер телефона | Phone number |
| `earnings.field.bank_name` | Название банка | Bank name |
| `earnings.field.recipient_name` | Имя получателя | Recipient name |
| `earnings.field.account_number` | Номер счёта | Account number |
| `earnings.field.bik` | БИК (необязательно) | BIK (optional) |
| `earnings.field.swift` | SWIFT (необязательно) | SWIFT (optional) |
| `earnings.field.iban` | IBAN (необязательно) | IBAN (optional) |
| `earnings.field.country` | Страна (необязательно) | Country (optional) |
| `errors.INSUFFICIENT_BALANCE` | На доступном балансе меньше этой суммы. | Your available balance is lower than this amount. |
| `errors.BELOW_MINIMUM_PAYOUT` | Сумма меньше минимальной для выплаты. | This is below the minimum payout. |
| `errors.PAYOUT_METHOD_NOT_FOUND` | Способ выплаты не найден. | That payout method wasn't found. |
| `errors.PAYOUT_METHOD_NOT_VERIFIED` | Этот способ ещё не проверен. | That method hasn't been verified yet. |
| `errors.PAYOUT_CURRENCY_MISMATCH` | Валюта способа не совпадает с валютой выплаты. | The method's currency doesn't match this payout. |
| `errors.AMOUNT_INVALID` | Введите сумму больше нуля, не более 2 знаков после запятой. | Enter an amount greater than zero, with up to 2 decimals. |
| `errors.TOO_MANY_OPEN_PAYOUTS` | У вас уже 3 открытых запроса на выплату. Дождитесь завершения или отмените один. | You already have 3 open payout requests. Wait for one to finish or cancel one. |
| `errors.PAYOUT_FEE_INVALID` | Комиссия за выплату больше суммы. Попробуйте указать сумму больше. | The payout fee is higher than the amount. Try a larger amount. |
| `errors.METHOD_IN_USE` | По этому способу есть открытая выплата. Повторите после её завершения. | This method has an open payout. Try again after it finishes. |
| `errors.TOO_MANY_METHODS` | Можно хранить до 10 способов выплаты. | You can keep up to 10 payout methods. |
| `errors.KIND_INVALID` | Выберите тип способа. | Choose a method type. |
| `errors.CURRENCY_NOT_SUPPORTED` | Этот тип не поддерживает выбранную валюту. | This method type doesn't support that currency. |
| `errors.PHONE_INVALID` | Введите номер телефона из 10–15 цифр. | Enter a phone number with 10 to 15 digits. |
| `errors.FIELD_REQUIRED` | Обязательно | Required |
| `errors.PAYOUT_NOT_FOUND` | Выплата не найдена. | That payout wasn't found. |
| `errors.DATE_INVALID` | Укажите корректный период. | Choose a valid date range. |
| `errors.METHOD_HAS_HISTORY` | Этот способ уже использовался для выплаты, поэтому его нельзя удалить. Сделайте основным другой способ. | This method was used for a past payout, so it can't be removed. Make another method the default instead. |

### `seller/locales/ru/expert.json` (219 strings)

| Key | Text | English source |
| --- | --- | --- |
| `expert.only.title` | Только для экспертов | Experts only |
| `expert.only.body` | Этот раздел доступен только аккаунтам экспертов. Переключитесь на свой профиль эксперта. | This section is for expert accounts. Switch to your expert business to use it. |
| `expert.only.home` | На главную | Go to home |
| `expert.unit.label` | Единица | Unit |
| `expert.unit.minutes` | минуты | minutes |
| `expert.unit.hours` | часы | hours |
| `expert.unit.min` | мин | min |
| `expert.unit.h` | ч | h |
| `expert.services.title` | Услуги | Services |
| `expert.services.subtitle` | Что клиенты могут у вас забронировать. | What customers can book with you. |
| `expert.services.add` | Добавить услугу | Add service |
| `expert.services.empty.title` | Услуг пока нет | No services yet |
| `expert.services.empty.body` | Добавьте первую услугу и укажите свободное время, чтобы клиенты могли записаться. | Add your first service, then set your availability so customers can book. |
| `expert.services.per_hour` | в час | per hour |
| `expert.services.slots` | Свободных слотов на ближайшие 14 дней: {count} | {count} open slots in the next 14 days |
| `expert.services.slots.none` | Нет свободных слотов на 14 дней | No open slots in the next 14 days |
| `expert.services.slots.set` | Указать время | Set availability |
| `expert.services.publish` | Опубликовать услугу | Publish this service |
| `expert.services.published` | Видна клиентам | Visible to customers |
| `expert.services.publish_toggle` | Опубликовать «{title}» | Publish {title} |
| `expert.services.needs_instructions` | Перед публикацией добавьте инструкции для встречи. | Add meeting instructions before publishing. |
| `expert.pricing.hourly` | Почасовая ставка | Hourly rate |
| `expert.pricing.fixed` | Фиксированная цена за сессию | Fixed price per session |
| `expert.pricing.quote` | Цена по запросу | Quote on request |
| `expert.delivery.online` | Онлайн | Online |
| `expert.delivery.in_person` | Лично | In person |
| `expert.delivery.both` | Онлайн или лично | Online or in person |
| `expert.form.new` | Новая услуга | New service |
| `expert.form.edit` | Редактирование услуги | Edit service |
| `expert.form.notlive.title` | Публикация станет доступна после одобрения Ciuna | You can publish once Ciuna approves your business |
| `expert.form.rejected` | Услуга отклонена. Измените название, описание или инструкции и сохраните, чтобы отправить на повторную проверку. | This service was rejected. Edit the title, description or instructions and save to send it for review again. |
| `expert.form.review` | Изменения названия, описания и инструкций проверяются Ciuna, прежде чем их увидят клиенты. | Changes to the title, description or instructions are reviewed by Ciuna before customers see them. |
| `expert.form.basics` | Основное | Basics |
| `expert.form.basics.hint` | Пишите на языке, на котором работаете. Остальные языки необязательны. | Write in the language you serve. Other languages are optional. |
| `expert.form.title` | Название услуги | Service title |
| `expert.form.title.ph` | Например, консультация по карьере | For example, Career coaching session |
| `expert.form.short` | Краткое описание | Short description |
| `expert.form.lang.hint` | Если оставить пустым, клиенты увидят язык по умолчанию. | If you leave this empty, customers see the default language. |
| `expert.form.err.title` | Введите название. | Enter a title. |
| `expert.form.pricing` | Цена | Pricing |
| `expert.form.pricing.type` | Тип цены | Pricing type |
| `expert.form.rate` | Ставка в час | Rate per hour |
| `expert.form.price` | Цена за сессию | Price per session |
| `expert.form.currency` | Валюта | Currency |
| `expert.form.quote.note` | Услуги с ценой по запросу нельзя забронировать онлайн, поэтому здесь их нет. | Services priced on request can't be booked online, so they aren't offered here. |
| `expert.form.err.amount` | Введите сумму больше нуля. | Enter an amount greater than zero. |
| `expert.form.duration` | Длительность | Duration |
| `expert.form.duration.default` | Длительность сессии | Session length |
| `expert.form.duration.min` | Минимальная длительность | Shortest session |
| `expert.form.duration.max` | Максимальная длительность | Longest session |
| `expert.form.optional` | Необязательно | Optional |
| `expert.form.err.duration` | Укажите длительность больше нуля. | Enter a session length greater than zero. |
| `expert.form.err.range` | Минимальная длительность не может превышать максимальную. | The shortest session can't be longer than the longest. |
| `expert.form.delivery` | Формат проведения | Delivery |
| `expert.form.delivery.mode` | Где проходят сессии | Where sessions happen |
| `expert.form.instructions` | Инструкции для встречи | Meeting instructions |
| `expert.form.instructions.hint` | Как подключиться или где встретиться. Обязательно для публикации. | How customers join or where to meet. Required to publish. |
| `expert.form.err.instructions` | Добавьте инструкции для встречи, чтобы опубликовать. | Add meeting instructions to publish. |
| `expert.form.rules` | Правила записи | Booking rules |
| `expert.form.lead` | Минимальное время до сессии | Minimum notice before a session |
| `expert.form.lead.hint` | Клиенты не смогут записаться на слот, который начинается раньше. | Customers can't book slots that start sooner than this. |
| `expert.form.cutoff` | Крайний срок оплаты до сессии | Payment deadline before a session |
| `expert.form.cutoff.hint` | Бронь нужно оплатить не позднее чем за это время до начала. | A booking must be paid at least this long before it starts. |
| `expert.form.err.number` | Введите ноль или больше. | Enter zero or more. |
| `expert.form.timezone` | Часовой пояс услуги | Service time zone |
| `expert.form.timezone.hint` | Клиенты видят время сессий в этом часовом поясе. | Customers see session times with this zone. |
| `expert.form.save_draft` | Сохранить черновик | Save draft |
| `expert.form.publish` | Опубликовать | Publish |
| `expert.form.unsaved` | Есть несохранённые изменения | Unsaved changes |
| `expert.form.toast.saved` | Услуга сохранена | Service saved |
| `expert.form.toast.published` | Услуга опубликована | Service published |
| `expert.form.toast.unpublished` | Услуга снята с публикации | Service unpublished |
| `expert.form.unpublish.title` | Больше не принимать записи | Stop accepting bookings |
| `expert.form.unpublish.body` | Услуга скрывается от клиентов, а свободные слоты удаляются. | The service is hidden from customers and its open slots are removed. |
| `expert.form.unpublish.action` | Снять с публикации | Unpublish |
| `expert.form.unpublish.confirm` | Снять услугу с публикации? | Unpublish this service? |
| `expert.form.unpublish.confirm.body` | Клиенты перестанут её видеть, а свободные слоты будут удалены. Существующие записи сохранятся. Чтобы снова предлагать услугу, опубликуйте её и сохраните расписание. | Customers will no longer see it and its open slots will be removed. Existing bookings stay. To offer it again, publish it and save your availability. |
| `expert.avail.title` | Расписание | Availability |
| `expert.avail.subtitle` | Укажите, когда клиенты могут записаться. При сохранении свободные слоты пересоздаются. | Set when customers can book you. Saving rebuilds your open slots. |
| `expert.avail.service` | Услуга | Service |
| `expert.avail.noservice.title` | Сначала добавьте услугу | Add a service first |
| `expert.avail.noservice.body` | Расписание задаётся для каждой услуги отдельно. | Availability is set per service. |
| `expert.avail.settings` | Настройки расписания | Schedule settings |
| `expert.avail.timezone` | Часовой пояс | Time zone |
| `expert.avail.timezone.hint` | Недельные часы указаны в этом часовом поясе. | Your weekly hours are in this time zone. |
| `expert.avail.slot` | Длина слота | Slot length |
| `expert.avail.slot.hint` | Каждый период делится на слоты такой длины. | Each open range is cut into slots of this length. |
| `expert.avail.window.start` | Запись открыта с | Bookable from |
| `expert.avail.window.end` | Запись открыта до | Bookable until |
| `expert.avail.window.days` | Клиенты могут записаться на {count} дн. вперёд (максимум {max}). | Customers can book {count} days ahead (up to {max}). |
| `expert.avail.window.max` | Период — не более {max} дней. | The window can be at most {max} days. |
| `expert.avail.window.reset` | Ближайшие 60 дней | Next 60 days |
| `expert.avail.window.order` | Дата окончания не может быть раньше даты начала. | The end date must be on or after the start date. |
| `expert.avail.window.long` | Выберите период не больше {max} дней. | Choose a window of {max} days or fewer. |
| `expert.avail.weekly` | Часы по дням недели | Weekly hours |
| `expert.avail.weekly.hint` | Время указано в поясе {zone}. Добавьте несколько периодов в день, чтобы сделать перерывы. | Times are in {zone}. Add several ranges to a day for breaks. |
| `expert.avail.closed` | Нет приёма | Not available |
| `expert.avail.add` | Добавить время | Add hours |
| `expert.avail.copy` | Копировать на другие дни | Copy to other days |
| `expert.avail.copy.title` | Копировать «{day}» на другие дни | Copy {day} to other days |
| `expert.avail.copy.hint` | Часы в выбранные дни будут заменены. | Hours on the days you choose will be replaced. |
| `expert.avail.copy.apply` | Копировать | Copy hours |
| `expert.avail.from` | Начало | Start time |
| `expert.avail.to` | Конец | End time |
| `expert.avail.issue.order` | Конец должен быть позже начала. | End time must be after start time. |
| `expert.avail.issue.overlap` | Этот период пересекается с другим в тот же день. | This range overlaps another range on the same day. |
| `expert.avail.issue.empty` | Укажите начало и конец. | Enter both a start and an end time. |
| `expert.avail.norules` | Часов приёма пока нет. Если сохранить сейчас, свободные слоты будут удалены. | No weekly hours yet. Saving now will remove your open slots. |
| `expert.avail.save` | Сохранить и обновить слоты | Save and update slots |
| `expert.avail.saves_note` | Забронированные сессии не меняются. | Booked sessions are never changed. |
| `expert.avail.fix` | Исправьте выделенные поля, чтобы сохранить. | Fix the highlighted fields to save. |
| `expert.avail.saved` | Расписание сохранено | Availability saved |
| `expert.avail.preview` | Ближайшие 14 дней | Next 14 days |
| `expert.avail.preview.hint` | Слоты, доступные клиентам, в поясе {zone}. Создано слотов: {count}. | Slots customers can book, in {zone}. {count} slots created. |
| `expert.avail.preview.empty` | Нет слотов на ближайшие 14 дней. Проверьте часы приёма и период записи. | No slots in the next 14 days. Check your weekly hours and booking window. |
| `expert.slots.title` | Ближайшие слоты | Upcoming slots |
| `expert.slots.hint` | Заблокируйте слот, который не можете принять, или удалите его. Время в поясе {zone}. | Block a slot you can't take, or remove it. Times in {zone}. |
| `expert.slots.range` | Период | Time range |
| `expert.slots.next` | Ближайшие {count} дн. | Next {count} days |
| `expert.slots.empty` | В этом периоде нет слотов | No slots in this period |
| `expert.slots.empty.body` | Сохраните часы приёма, чтобы создать слоты. | Save your weekly hours to create slots. |
| `expert.slots.status.available` | Свободен | Open |
| `expert.slots.status.booked` | Забронирован | Booked |
| `expert.slots.status.blocked` | Заблокирован | Blocked |
| `expert.slots.block` | Заблокировать | Block |
| `expert.slots.unblock` | Разблокировать | Unblock |
| `expert.slots.view_booking` | Открыть запись | View booking |
| `expert.slots.delete.title` | Удалить этот слот? | Delete this slot? |
| `expert.slots.delete.action` | Удалить слот | Delete slot |
| `expert.slots.deleted` | Слот удалён | Slot deleted |
| `expert.timeoff.title` | Отпуск и выходные | Time off |
| `expert.timeoff.hint` | Заблокируйте все свободные слоты в выбранные даты. Уже забронированные сессии не затрагиваются. | Block all open slots in a date range. Sessions already booked stay as they are. |
| `expert.timeoff.from` | Первый выходной день | First day off |
| `expert.timeoff.to` | Последний выходной день | Last day off |
| `expert.timeoff.service` | Услуга | Service |
| `expert.timeoff.all` | Все услуги | All services |
| `expert.timeoff.zone` | Дни считаются целиком в поясе {zone}. | Whole days in {zone}. |
| `expert.timeoff.action` | Заблокировать даты | Block these dates |
| `expert.timeoff.confirm` | Заблокировать период {from} – {to}? | Block {from} to {to}? |
| `expert.timeoff.confirm.body` | Все свободные слоты ({scope}) в этом периоде будут заблокированы (часовой пояс {zone}). Разблокировать их можно по одному. | All open slots for {scope} in this range will be blocked (time zone {zone}). You can unblock them one by one. |
| `expert.timeoff.done` | Заблокировано слотов: {count}. | {count} slots blocked. |
| `expert.bookings.title` | Записи | Bookings |
| `expert.bookings.subtitle` | Сессии, которые клиенты забронировали и оплатили. | Sessions customers have booked and paid for. |
| `expert.bookings.tab.requests` | Запросы | Requests |
| `expert.bookings.tab.upcoming` | Предстоящие | Upcoming |
| `expert.bookings.tab.past` | Прошедшие | Past |
| `expert.bookings.empty.requests.title` | Нет запросов, требующих ответа | No requests to answer |
| `expert.bookings.empty.requests.body` | Новые оплаченные записи появятся здесь, чтобы вы их подтвердили. | New paid bookings appear here for you to accept. |
| `expert.bookings.empty.upcoming.title` | Предстоящих сессий нет | No upcoming sessions |
| `expert.bookings.empty.upcoming.body` | Подтверждённые сессии показываются здесь до их окончания. | Accepted sessions show up here until they end. |
| `expert.bookings.empty.past.title` | Прошедших сессий нет | No past sessions |
| `expert.bookings.empty.past.body` | Здесь будут завершённые и отменённые сессии. | Completed and cancelled sessions are listed here. |
| `expert.bookings.status.new` | Новый запрос | New request |
| `expert.bookings.status.accepted` | Принято | Accepted |
| `expert.bookings.status.preparing` | В процессе | In progress |
| `expert.bookings.status.completed` | Завершено | Completed |
| `expert.bookings.status.cancelled` | Отменено | Cancelled |
| `expert.bookings.session` | Сессия | Session |
| `expert.bookings.customer` | Клиент | Customer |
| `expert.bookings.no_slot` | Время не указано | No time set |
| `expert.bookings.yours` | Ваше время | Your time |
| `expert.bookings.session_time` | Время сессии ({zone}) | Session time ({zone}) |
| `expert.bookings.your_time` | Время на вашем устройстве ({zone}) | Your device time ({zone}) |
| `expert.bookings.accept` | Принять | Accept |
| `expert.bookings.accepted` | Запись принята | Booking accepted |
| `expert.bookings.complete` | Отметить завершённой | Mark as completed |
| `expert.bookings.view` | Подробнее | View details |
| `expert.bookings.overdue` | Ответьте сейчас: срок ответа истёк | Answer now, this request is overdue |
| `expert.bookings.respond_by` | Ответьте до {time} | Respond by {time} |
| `expert.bookings.exception` | Требует внимания | Needs attention |
| `expert.detail.title` | Запись | Booking |
| `expert.detail.session` | Сессия | Session |
| `expert.detail.price` | Цена | Price |
| `expert.detail.customer` | Клиент | Customer |
| `expert.detail.note` | Комментарий клиента | Note from the customer |
| `expert.detail.exception` | Эта запись требует внимания Ciuna | This booking needs attention from Ciuna |
| `expert.detail.meeting` | Ссылка на встречу | Meeting link |
| `expert.detail.meeting.hint` | Клиент увидит это после сохранения. | The customer sees this once you save it. |
| `expert.detail.meeting.url` | Ссылка на встречу (https) | Meeting link (https) |
| `expert.detail.meeting.url.err` | Введите ссылку, начинающуюся с https:// | Enter a link that starts with https:// |
| `expert.detail.meeting.instructions` | Инструкции для клиента | Instructions for the customer |
| `expert.detail.meeting.save` | Сохранить данные встречи | Save meeting details |
| `expert.detail.meeting.saved` | Данные встречи сохранены | Meeting details saved |
| `expert.detail.meeting.open` | Открыть текущую ссылку | Open current link |
| `expert.detail.reject` | Отклонить | Decline |
| `expert.detail.reject.title` | Отклонить эту запись? | Decline this booking? |
| `expert.detail.reject.body` | Клиенту полностью вернут деньги и сообщат причину. Отменить это нельзя. | The customer is refunded in full and told why. This can't be undone. |
| `expert.detail.reject.reason` | Причина отказа | Reason for declining |
| `expert.detail.reject.confirm` | Отклонить запись | Decline booking |
| `expert.detail.fulfill` | Отметить завершённой | Mark as completed |
| `expert.detail.fulfill.wait` | Завершить сессию можно после её окончания в {time}. | You can complete this session after it ends at {time}. |
| `expert.detail.fulfill.title` | Отметить сессию завершённой? | Mark this session as completed? |
| `expert.detail.fulfill.body` | Это подтверждает, что сессия состоялась, и запускает выплату. | This confirms the session took place and starts your payout. |
| `expert.detail.fulfill.note` | Заметка о сессии | Note about the session |
| `expert.detail.done.accept` | Запись принята | Booking accepted |
| `expert.detail.done.reject` | Запись отклонена, деньги возвращены | Booking declined and refunded |
| `expert.detail.done.fulfill` | Сессия отмечена завершённой | Session marked as completed |
| `errors.SERVICE_INVALID` | Проверьте данные услуги и попробуйте снова. | Check the service details and try again. |
| `errors.HAS_FUTURE_BOOKINGS` | У этой услуги есть предстоящие записи: {count}. Сначала завершите или отклоните их, затем снимите услугу с публикации. | This service has {count} upcoming booked sessions. Complete or decline them first, then unpublish. |
| `errors.SLOT_BOOKED` | Этот слот уже забронирован, изменить его нельзя. | This slot is already booked, so it can't be changed. |
| `errors.SLOT_NOT_EDITABLE` | Этот слот нельзя изменить. | This slot can't be changed. |
| `errors.SLOT_NOT_FOUND` | Этого слота больше нет. Обновите список. | This slot no longer exists. Refresh the list. |
| `errors.SLOT_OVERLAP` | Это время пересекается с существующим слотом. | This time overlaps an existing slot. |
| `errors.SLOT_IN_PAST` | Выберите время в будущем. | Choose a time in the future. |
| `errors.WINDOW_TOO_LONG` | Период записи — не более {maxDays} дней. | The booking window can be at most {maxDays} days. |
| `errors.WINDOW_INVALID` | Укажите корректные даты начала и окончания. | Enter a valid start and end date. |
| `errors.WINDOW_ORDER` | Дата окончания не может быть раньше даты начала. | The end date must be on or after the start date. |
| `errors.RULE_TIME_ORDER` | Каждый период должен заканчиваться позже, чем начинается. | Each range must end after it starts. |
| `errors.TIMEZONE_INVALID` | Выберите корректный часовой пояс. | Choose a valid time zone. |
| `errors.RANGE_ORDER` | Дата окончания должна быть позже даты начала. | The end date must be after the start date. |
| `errors.RANGE_TOO_LONG` | Выберите период не больше {maxDays} дней. | Choose a range of {maxDays} days or fewer. |
| `errors.SCHEDULE_REQUIRED` | Сначала сохраните часы приёма. | Save your weekly hours first. |
| `errors.EXPERT_ONLY` | Это доступно только аккаунтам экспертов. | This is only available to expert accounts. |
| `errors.EXPERT_PROFILE_NOT_FOUND` | Профиль эксперта ещё не настроен. Сначала завершите настройку. | Your expert profile isn't set up yet. Finish setup first. |
| `errors.SERVICE_NOT_FOUND` | Этой услуги больше нет. | This service no longer exists. |
| `errors.MEETING_URL_INVALID` | Введите ссылку, начинающуюся с https:// | Enter a link that starts with https:// |
| `errors.MEETING_EMPTY` | Добавьте ссылку на встречу или инструкции. | Add a meeting link or instructions. |
| `errors.BOOKING_CLOSED` | Запись закрыта, данные встречи изменить нельзя. | This booking is closed, so meeting details can't be changed. |
| `errors.BOOKING_NOT_PAID` | Эта запись ещё не оплачена. | This booking isn't paid yet. |

### `seller/locales/ru/home.json` (13 strings)

| Key | Text | English source |
| --- | --- | --- |
| `home.welcome` | Добро пожаловать, {name} | Welcome, {name} |
| `home.setup.body` | Выполните эти шаги, и Ciuna проверит ваш бизнес. | Finish these steps and Ciuna will review your business. |
| `home.live.body` | Что требует вашего внимания сегодня. | What needs your attention today. |
| `home.setup.title` | Подготовьтесь к продажам | Get ready to sell |
| `home.newOrders` | Новые заказы | New orders |
| `home.newBookings` | Новые запросы на бронирование | New booking requests |
| `home.needsAction` | Ждут вашего подтверждения | Waiting for you to accept |
| `home.inProgress` | В работе | In progress |
| `more.storeProfile` | Профиль магазина | Store profile |
| `more.expertProfile` | Профиль эксперта | Expert profile |
| `more.verification` | Проверка и документы | Verification and documents |
| `more.fulfillment` | Самовывоз и доставка | Pickup and delivery |
| `more.team` | Команда | Team |

### `seller/locales/ru/messages.json` (33 strings)

| Key | Text | English source |
| --- | --- | --- |
| `messages.title` | Сообщения | Messages |
| `messages.subtitle` | Общайтесь с клиентами по их заказам. Отвечайте быстро, чтобы заказы не простаивали. | Chat with customers about their orders. Reply quickly to keep orders moving. |
| `messages.noAccess.title` | У вас нет доступа к сообщениям | You don't have access to messages |
| `messages.noAccess.body` | Попросите владельца бизнеса выдать вам право на сообщения. | Ask the business owner to give you the messages permission. |
| `messages.empty.title` | Сообщений пока нет | No messages yet |
| `messages.empty.body` | Когда клиент напишет по заказу, переписка появится здесь. | When a customer writes about an order, the conversation appears here. |
| `messages.customer` | Клиент | Customer |
| `messages.you` | Вы | You |
| `messages.unread` | Непрочитанных: {count} | {count} unread |
| `messages.closed.chip` | Чат закрыт | Chat closed |
| `messages.back` | Все сообщения | All messages |
| `messages.viewOrder` | Открыть заказ | View order |
| `messages.history` | Переписка | Conversation |
| `messages.thread.empty` | В этом чате пока нет сообщений. Напишите первым. | No messages in this chat yet. Say hello below. |
| `messages.closed.title` | Этот чат закрыт | This chat is closed |
| `messages.closed.body` | Чат закрывается через 14 дней после выполнения или отмены заказа. История остаётся доступной. | Chats close 14 days after an order is completed or cancelled. You can still see the history. |
| `messages.unavailable.title` | Чат недоступен | Chat isn't available |
| `messages.unavailable.body` | Чат открывается после оплаты заказа клиентом. | Chat opens once the customer has paid for the order. |
| `messages.composer.label` | Сообщение | Message |
| `messages.composer.placeholder` | Напишите сообщение | Write a message |
| `messages.composer.closed` | Чат закрыт | Chat is closed |
| `messages.send` | Отправить | Send |
| `messages.seen` | Прочитано | Seen |
| `messages.quick.label` | Быстрые ответы | Quick replies |
| `messages.quick.preparing` | Ваш заказ готовится. | Your order is being prepared. |
| `messages.quick.delivery` | Доставим в течение часа. | We will deliver within the hour. |
| `messages.quick.thanks` | Спасибо за заказ! | Thank you for your order! |
| `messages.quick.question` | Подтвердите, пожалуйста, адрес. | Could you confirm your address, please? |
| `errors.CHAT_CLOSED` | Этот чат закрыт, сообщение не отправлено. | This chat is closed, so the message was not sent. |
| `errors.RATE_LIMITED` | Вы отправляете сообщения слишком часто. Подождите немного и повторите. | You're sending messages too fast. Wait a little and try again. |
| `errors.MESSAGE_EMPTY` | Напишите сообщение перед отправкой. | Write a message before sending. |
| `errors.MESSAGE_TOO_LONG` | Сообщение слишком длинное. Уложитесь в 2000 символов. | That message is too long. Keep it under 2000 characters. |
| `errors.CHAT_UNAVAILABLE` | Чат по этому заказу недоступен. | Chat isn't available for this order. |

### `seller/locales/ru/orders.json` (89 strings)

| Key | Text | English source |
| --- | --- | --- |
| `orders.title` | Заказы | Orders |
| `orders.subtitle` | Новые заказы появляются здесь. Принимайте быстрее, чтобы покупатели ждали меньше. | New orders appear here. Accept quickly to keep customers waiting less. |
| `orders.tab.new` | Новые | New |
| `orders.tab.active` | В работе | In progress |
| `orders.tab.done` | Выполненные | Completed |
| `orders.tab.cancelled` | Отменённые | Cancelled |
| `orders.empty.new.title` | Нет новых заказов | No new orders |
| `orders.empty.new.body` | Новые заказы появятся здесь сразу после оплаты. | New orders show up here as soon as customers pay. |
| `orders.empty.active.title` | Нет заказов в работе | Nothing in progress |
| `orders.empty.active.body` | Принятые заказы отображаются здесь, пока вы не отметите их выполненными. | Orders you accept appear here until you mark them fulfilled. |
| `orders.empty.done.title` | Выполненных заказов пока нет | No completed orders yet |
| `orders.empty.done.body` | Здесь будут выполненные заказы. | Fulfilled orders will be listed here. |
| `orders.empty.cancelled.title` | Нет отменённых заказов | No cancelled orders |
| `orders.empty.cancelled.body` | Здесь будут отклонённые и отменённые заказы. | Rejected and cancelled orders will be listed here. |
| `orders.noAccess.title` | Нет доступа к заказам | You don't have access to orders |
| `orders.noAccess.body` | Попросите владельца бизнеса выдать вам право на заказы. | Ask the business owner to give you the orders permission. |
| `orders.number` | Заказ {id} | Order {id} |
| `orders.moreItems` | ещё +{count} | +{count} more |
| `orders.mode.delivery` | Доставка | Delivery |
| `orders.mode.pickup` | Самовывоз | Pickup |
| `orders.mode.digital` | Цифровой | Digital |
| `orders.mode.booking` | Бронирование | Booking |
| `orders.due.in` | Осталось {time} | Due in {time} |
| `orders.due.overdue` | Просрочено на {time} | Overdue by {time} |
| `orders.duration.hm` | {h} ч {m} мин | {h} h {m} min |
| `orders.duration.m` | {m} мин | {m} min |
| `orders.status.new` | Новый | New |
| `orders.status.accepted` | Принят | Accepted |
| `orders.status.preparing` | Готовится | Preparing |
| `orders.status.completed` | Выполнен | Completed |
| `orders.status.cancelled` | Отменён | Cancelled |
| `orders.action.accept` | Принять | Accept |
| `orders.action.start` | Начать подготовку | Start preparing |
| `orders.action.fulfill` | Отметить выполненным | Mark as fulfilled |
| `orders.action.reject` | Отклонить | Reject |
| `orders.view` | Открыть заказ | View order |
| `orders.back` | К заказам | Back to orders |
| `orders.toast.newOrder` | Новый заказ | New order |
| `orders.toast.accept` | Заказ {id} принят | Order {id} accepted |
| `orders.toast.start` | Заказ {id} готовится | Order {id} is being prepared |
| `orders.toast.fulfill` | Заказ {id} отмечен выполненным | Order {id} marked as fulfilled |
| `orders.toast.reject` | Заказ {id} отклонён | Order {id} rejected |
| `orders.items` | Товары | Items |
| `orders.col.item` | Позиция | Item |
| `orders.col.qty` | Кол-во | Qty |
| `orders.col.unit` | Цена за шт. | Unit price |
| `orders.col.total` | Сумма | Total |
| `orders.subtotal` | Подытог | Subtotal |
| `orders.deliveryFee` | Доставка | Delivery fee |
| `orders.total` | Итого | Total |
| `orders.note` | Комментарий покупателя | Customer note |
| `orders.slot` | Время брони | Booking time |
| `orders.slot.timezone` | Время указано в часовом поясе {tz} | Times shown in {tz} |
| `orders.digital` | Цифровое содержимое | Digital content |
| `orders.digital.hint` | Это содержимое вы отправили покупателю. | This is what you sent to the customer. |
| `orders.customer` | Покупатель | Customer |
| `orders.customer.unknown` | Имя не указано | Name not provided |
| `orders.pickup` | Самовывоз | Pickup |
| `orders.pickup.hours` | Часы самовывоза: {hours} | Pickup hours: {hours} |
| `orders.deliveryTo` | Адрес доставки | Deliver to |
| `orders.location` | Место | Location |
| `orders.noAddress` | Адрес не указан | No address provided |
| `orders.timeline` | История | Timeline |
| `orders.timeline.empty` | Пока нет событий. | No activity yet. |
| `orders.exception.title` | Этот заказ требует внимания | This order needs attention |
| `orders.reject.title` | Отклонить этот заказ? | Reject this order? |
| `orders.reject.body` | Покупателю вернут всю сумму. Он увидит вашу причину. | The customer will be refunded in full. They will see your reason. |
| `orders.reject.reason` | Причина | Reason |
| `orders.reject.placeholder` | Объясните покупателю причину, например: товар закончился | Tell the customer why, for example: out of stock |
| `orders.reject.confirm` | Отклонить заказ | Reject order |
| `orders.fulfill.title` | Отметить заказ выполненным? | Mark this order as fulfilled? |
| `orders.fulfill.body` | Добавьте комментарий для покупателя, например, что было передано. | Add a note for the customer, such as what was delivered. |
| `orders.fulfill.bodyDigital` | Добавьте содержимое для покупателя и комментарий. | Add the content the customer receives, and a note. |
| `orders.fulfill.note` | Комментарий для покупателя | Note for the customer |
| `orders.fulfill.noteHint` | Обязательно. Хотя бы одно предложение. | Required. At least one sentence. |
| `orders.fulfill.content` | Цифровое содержимое | Digital content |
| `orders.fulfill.contentHint` | Коды, ссылки или инструкции. Покупатель увидит это. | Codes, links or instructions. The customer sees this. |
| `orders.fulfill.confirm` | Отметить выполненным | Mark as fulfilled |
| `errors.INVALID_TRANSITION` | Заказ изменился. Обновите страницу и попробуйте снова. | Something about this order changed. Refresh and try again. |
| `errors.REJECT_NOT_ALLOWED` | Сейчас этот заказ нельзя отклонить. Обратитесь в поддержку. | This order can't be rejected now. Contact support. |
| `errors.REASON_REQUIRED` | Укажите причину не короче 3 символов. | Enter a reason of at least 3 characters. |
| `errors.CONTACT_SUPPORT` | Для этого заказа нужна помощь поддержки Ciuna. Обратитесь в поддержку. | This order needs Ciuna support. Contact support to continue. |
| `errors.DELIVERY_CONTENT_REQUIRED` | Добавьте цифровое содержимое, прежде чем отметить заказ выполненным. | Add the digital content before marking this order fulfilled. |
| `errors.NOTE_REQUIRED` | Добавьте комментарий для покупателя. | Add a note for the customer. |
| `errors.SESSION_NOT_ENDED` | Бронирование можно отметить выполненным после завершения сессии. | You can mark a booking fulfilled after the session has ended. |
| `errors.ORDER_NOT_FOUND` | Мы не нашли этот заказ. | We couldn't find this order. |
| `errors.INVALID_ACTION` | Это действие недоступно. | That action isn't available. |
| `errors.UNAVAILABLE` | Не удалось связаться с Ciuna. Проверьте соединение и попробуйте снова. | We couldn't reach Ciuna. Check your connection and try again. |
| `orders.messageCustomer` | Написать покупателю | Message the customer |

### `seller/locales/ru/reviews.json` (32 strings)

| Key | Text | English source |
| --- | --- | --- |
| `reviews.title` | Отзывы | Reviews |
| `reviews.subtitle` | Что клиенты говорят о ваших заказах. | What customers say about your orders. |
| `reviews.nav` | Отзывы | Reviews |
| `reviews.stars` | {n} из 5 | {n} out of 5 |
| `reviews.starsShort` | {n} зв. | {n} stars |
| `reviews.count` | Отзывов: {count} | {count} reviews |
| `reviews.count.one` | 1 отзыв | 1 review |
| `reviews.distribution` | Отзывы по оценкам | Reviews by star rating |
| `reviews.customer` | Клиент | Customer |
| `reviews.noText` | Отзыв без текста. | No written review. |
| `reviews.yourReply` | Ваш ответ | Your reply |
| `reviews.reply` | Ответить | Reply |
| `reviews.editReply` | Изменить ответ | Edit reply |
| `reviews.reply.public` | Ваш ответ виден всем. | Your reply is public. |
| `reviews.reply.label` | Ответ | Reply |
| `reviews.reply.editWindow` | Ответ можно изменить в течение 24 часов после публикации. | You can edit this reply for 24 hours after posting. |
| `reviews.reply.counter` | {used} / {max} | {used} / {max} |
| `reviews.reply.send` | Опубликовать ответ | Post reply |
| `reviews.reply.sent` | Ответ опубликован. | Reply posted. |
| `reviews.tab.all` | Все | All |
| `reviews.tab.needsReply` | Нужен ответ | Needs reply |
| `reviews.empty.title` | Отзывов пока нет | No reviews yet |
| `reviews.empty.body` | Клиенты могут оставить отзыв после выполнения заказа. Отзывы появятся здесь. | Customers can review an order after it is fulfilled. Reviews show up here. |
| `reviews.empty.caughtUp.title` | Все отзывы обработаны | You're all caught up |
| `reviews.empty.caughtUp.body` | На каждый отзыв есть ответ. | Every review has a reply. |
| `reviews.more` | Показать ещё | Show more |
| `reviews.noAccess.title` | У вас нет доступа к отзывам | You don't have access to reviews |
| `reviews.noAccess.body` | Попросите владельца бизнеса дать вам разрешение на заказы. | Ask the business owner to give you the orders permission. |
| `errors.REPLY_REQUIRED` | Напишите ответ. | Write a reply. |
| `errors.REPLY_TOO_LONG` | Ответ не должен быть длиннее 600 символов. | Keep the reply to 600 characters. |
| `errors.REPLY_LOCKED` | Этот ответ больше нельзя изменить. | This reply can no longer be edited. |
| `errors.REVIEW_NOT_FOUND` | Мы не нашли этот отзыв. | We couldn't find that review. |

### `seller/locales/ru/settings.json` (49 strings)

| Key | Text | English source |
| --- | --- | --- |
| `profile.subtitle` | Что клиенты видят на вашей странице. | What customers see on your page. |
| `profile.basics` | Основное | Basics |
| `profile.description` | Описание | Description |
| `profile.description.hint` | Расскажите клиентам, кто вы и что предлагаете. Обязательно на языке по умолчанию. | Tell customers who you are and what you offer. Required in your default language. |
| `profile.images` | Изображения | Images |
| `profile.cover.upload` | Загрузить обложку | Upload cover image |
| `profile.contact` | Контакты и регион | Contact and region |
| `profile.phone` | Телефон | Phone |
| `profile.website` | Сайт | Website |
| `profile.currency` | Валюта по умолчанию | Default currency |
| `team.title` | Команда | Team |
| `team.subtitle` | Люди, которые могут входить в этот бизнес. | People who can sign in to this business. |
| `team.invite` | Пригласить человека | Invite a person |
| `team.invite.cta` | Отправить приглашение | Send invite |
| `team.invite.link` | Ссылка-приглашение | Invite link |
| `team.invite.copied` | Ссылка скопирована | Link copied |
| `team.pending` | Ожидающие приглашения | Pending invites |
| `team.remove.q` | Удалить этого человека? | Remove this person? |
| `team.remove` | Удалить | Remove |
| `team.you` | Вы | You |
| `team.role.hint` | Менеджеры ведут ежедневную работу. Сотрудники обрабатывают заказы и объявления. Финансы видят доходы и выплаты. | Managers run daily work. Staff handle orders and listings. Finance sees earnings and payouts. |
| `errors.TOO_MANY_INVITES` | Слишком много открытых приглашений. Сначала отмените некоторые. | Too many open invites. Cancel some first. |
| `errors.ROLE_INVALID` | Выберите роль. | Choose a role. |
| `errors.OWNER_IMMUTABLE` | Владельца нельзя изменить или удалить. | The owner can't be changed or removed. |
| `errors.CANNOT_CHANGE_SELF` | Вы не можете изменить свою роль. | You can't change your own role. |
| `errors.INVITE_INVALID` | Приглашение недействительно или срок его действия истёк. | This invite is invalid or has expired. |
| `errors.INVITE_EMAIL_MISMATCH` | Войдите с адресом электронной почты, на который пришло приглашение. | Sign in with the email address that was invited. |
| `team.role` | Роль | Role |
| `notif.title` | Уведомления | Alerts |
| `notif.subtitle` | Узнавайте сразу, когда заказ или бронирование ждёт вас. | Get told the moment an order or booking needs you. |
| `notif.channels` | Куда отправлять | Where to send alerts |
| `notif.email` | Эл. почта | Email |
| `notif.email.body` | Короткое письмо на почту аккаунта. | A short message to your account email. |
| `notif.telegram.body` | Мгновенные сообщения в Telegram. Привяжите аккаунт, чтобы включить. | Instant messages in Telegram. Link your account to turn this on. |
| `notif.telegram.linked` | Подключено {name} | Connected {name} |
| `notif.telegram.connect` | Подключить Telegram | Connect Telegram |
| `notif.telegram.disconnect` | Отключить | Disconnect |
| `notif.telegram.open` | Завершите в Telegram | Finish in Telegram |
| `notif.telegram.openLink` | Откройте Telegram и нажмите Start | Open Telegram and press Start |
| `notif.telegram.unavailable` | Уведомления в Telegram пока недоступны. Почта работает. | Telegram alerts are not available yet. Email alerts still work. |
| `notif.kinds` | О чём уведомлять | What to alert |
| `notif.kinds.body` | Отключите ненужные уведомления. | Turn off alerts you don't need. |
| `notif.kind.order_new` | Новые заказы | New orders |
| `notif.kind.booking_new` | Новые заявки на бронирование | New booking requests |
| `notif.kind.payout_update` | Статусы выплат | Payout updates |
| `notif.kind.merchant_status` | Изменения по заявке | Changes to your application |
| `more.alerts` | Уведомления | Alerts |
| `more.payoutMethods` | Способы выплат | Payout methods |
| `notif.kind.message_new` | Новые сообщения от покупателей | New customer messages |

### `seller/locales/ru/setup.json` (61 strings)

| Key | Text | English source |
| --- | --- | --- |
| `onb.title` | Настройка вашего бизнеса | Set up your business |
| `onb.subtitle` | Расскажите, что вы продаёте. Большую часть можно изменить позже. | Tell us what you sell. You can change most of this later. |
| `onb.type` | Что вы хотите делать в Ciuna? | What do you want to do on Ciuna? |
| `onb.type.store` | Продавать товары | Sell products |
| `onb.type.store.body` | Еда, продукты и товары с доставкой или самовывозом. | Food, groceries and goods, delivered or picked up. |
| `onb.type.expert` | Предлагать свои услуги | Offer my expertise |
| `onb.type.expert.body` | Переводы, юридическая помощь, репетиторство и другие услуги с записью по времени. | Translation, legal help, tutoring and other services, booked by time. |
| `onb.name.store` | Название магазина | Store name |
| `onb.name.expert` | Ваше имя или название практики | Your name or practice name |
| `onb.line` | Раздел маркетплейса | Marketplace section |
| `onb.line.hint` | Здесь вас найдут клиенты. | Where customers will find you. |
| `onb.line.food` | Еда | Food |
| `onb.line.mart` | Маркет (продукты и товары) | Mart (groceries and goods) |
| `onb.country` | В какой стране находится ваш бизнес? | Where is your business based? |
| `onb.country.hint` | От этого зависит, какие документы для проверки мы запросим. | This decides which verification documents we ask for. |
| `onb.operating` | Где вы продаёте или доставляете? | Where do you sell or deliver? |
| `onb.operating.hint` | Клиенты из этих мест увидят ваши объявления. | Customers there will see your listings. |
| `onb.languages` | Языки, на которых вы обслуживаете клиентов | Languages you serve customers in |
| `onb.languages.hint` | Выберите хотя бы один. Объявления вы пишете на этих языках. | Choose at least one. You write your listings in these languages. |
| `onb.invite` | Вас приглашают присоединиться к {name} | You are invited to join {name} |
| `onb.invite.accept` | Присоединиться | Join |
| `setup.title` | Настройка и проверка | Set up and verify |
| `setup.subtitle` | Выполните эти шаги. Ciuna проверяет ваш бизнес перед запуском. | Complete these steps. Ciuna reviews your business before you go live. |
| `setup.done` | Готово | Done |
| `setup.todo` | Нужно сделать | To do |
| `setup.optional` | Необязательно | Optional |
| `setup.approved` | Ваш бизнес одобрен | Your business is approved |
| `setup.item.profile` | Профиль бизнеса | Business profile |
| `setup.item.logo` | Логотип | Logo |
| `setup.item.tier` | Выберите тип проверки | Choose verification type |
| `setup.item.kyb_fields` | Данные для проверки | Verification details |
| `setup.item.kyb_documents` | Документы для проверки | Verification documents |
| `setup.item.first_listing` | Первое объявление | First listing |
| `setup.profile.body` | Добавьте описание на основном языке и контактные данные. | Add your description in your main language and contact details. |
| `setup.profile.cta` | Изменить профиль | Edit profile |
| `setup.logo.upload` | Загрузить логотип | Upload logo |
| `setup.verify.title` | Проверка | Verification |
| `setup.verify.body` | Мы запрашиваем разные документы в зависимости от страны, где находится ваш бизнес. | We ask for different documents depending on where your business is based. |
| `setup.verify.tier` | Тип проверки | Verification type |
| `setup.tier1.body` | Для частных лиц и самозанятых продавцов. Лимиты ниже. | For individuals and self-employed sellers. Lower limits. |
| `setup.tier2.body` | Для зарегистрированных компаний. Полные лимиты. | For registered companies. Full limits. |
| `setup.docs.title` | Документы | Documents |
| `doc.pending` | На проверке | In review |
| `doc.approved` | Одобрено | Approved |
| `doc.rejected` | Отклонено | Rejected |
| `doc.expired` | Срок истёк | Expired |
| `setup.listing.store` | Добавьте первый товар | Add your first product |
| `setup.listing.expert` | Добавьте первую услугу | Add your first service |
| `setup.listing.body` | Сохраните как черновик сейчас. Опубликовать можно после одобрения вашего бизнеса в Ciuna. | Save it as a draft now. You can publish once Ciuna approves your business. |
| `setup.listing.addProduct` | Добавить товар | Add product |
| `setup.listing.addService` | Добавить услугу | Add service |
| `setup.submit.title` | Отправить на проверку | Submit for review |
| `setup.submit.ready` | Всё готово. Обычно Ciuna проверяет заявку в течение одного рабочего дня. | Everything is ready. Ciuna usually reviews within one business day. |
| `setup.submit.notReady` | Некоторые шаги ещё не выполнены. Отправить заявку можно после их завершения. | Some steps are still open. You can submit once they are done. |
| `setup.submit.cta` | Отправить на проверку | Submit for review |
| `setup.submitted` | Отправлено на проверку | Submitted for review |
| `errors.APPLICATION_INCOMPLETE` | Некоторые шаги ещё не выполнены. Завершите их и отправьте заявку. | Some steps are still open. Complete them, then submit. |
| `errors.TIER_INVALID` | Выберите тип проверки. | Choose a verification type. |
| `errors.DOCUMENT_LOCKED` | Одобренные документы нельзя удалить. | Approved documents can't be removed. |
| `errors.PATH_INVALID` | Файл загружен некорректно. Повторите попытку. | That upload isn't valid. Try again. |
| `errors.EXPIRY_INVALID` | Укажите срок действия в будущем. | Use a future expiry date. |

### `seller/locales/fr/auth.json` (18 strings)

| Key | Text | English source |
| --- | --- | --- |
| `auth.login.title` | Se connecter à Ciuna Seller | Sign in to Ciuna Seller |
| `auth.login.subtitle` | Utilisez votre compte Ciuna. Nouveau sur Ciuna ? Créez un compte en une minute. | Use your Ciuna account. New to Ciuna? Create one in a minute. |
| `auth.login.cta` | Se connecter | Sign in |
| `auth.register.title` | Commencez à vendre sur Ciuna | Start selling on Ciuna |
| `auth.register.subtitle` | Touchez les personnes installées à l'étranger qui cherchent ce que vous proposez. | Reach people living abroad who are looking for what you offer. |
| `auth.register.cta` | Créer un compte | Create account |
| `auth.noAccount` | Pas encore de compte ? | No account yet? |
| `auth.haveAccount` | Vous avez déjà un compte ? | Already have an account? |
| `auth.email` | E-mail | Email |
| `auth.password` | Mot de passe | Password |
| `auth.passwordHint` | Au moins 8 caractères. | At least 8 characters. |
| `auth.passwordShort` | Votre mot de passe doit comporter au moins 8 caractères. | Use at least 8 characters for your password. |
| `auth.firstName` | Prénom | First name |
| `auth.lastName` | Nom | Last name |
| `auth.invalid` | L'e-mail ou le mot de passe est incorrect. | Email or password is incorrect. |
| `auth.exists` | Un compte existe déjà avec cet e-mail. Connectez-vous plutôt. | An account with this email already exists. Sign in instead. |
| `auth.checkEmail.title` | Vérifiez votre messagerie | Check your email |
| `auth.checkEmail.body` | Nous avons envoyé un lien de confirmation à {email}. Ouvrez-le, puis connectez-vous. | We sent a confirmation link to {email}. Open it, then sign in. |

### `seller/locales/fr/catalog.json` (147 strings)

| Key | Text | English source |
| --- | --- | --- |
| `catalog.title` | Catalogue | Catalog |
| `catalog.intro` | Tout ce que vous vendez. Les changements de prix et de stock s'appliquent immédiatement. | Everything you sell. Edits to prices and stock apply straight away. |
| `catalog.back` | Retour au catalogue | Back to catalog |
| `catalog.search` | Rechercher des produits | Search products |
| `catalog.new.title` | Ajouter un produit | Add product |
| `catalog.edit.title` | Modifier le produit | Edit product |
| `catalog.action.add` | Ajouter un produit | Add product |
| `catalog.action.import` | Importer un CSV | Import from CSV |
| `catalog.action.pause` | Mettre en pause | Pause |
| `catalog.action.publish` | Publier | Publish |
| `catalog.action.saveDraft` | Enregistrer comme brouillon | Save as draft |
| `catalog.action.moveToDraft` | Repasser en brouillon | Move to draft |
| `catalog.action.saveChanges` | Enregistrer les modifications | Save changes |
| `catalog.action.archive` | Archiver le produit | Archive product |
| `catalog.link.fulfilment` | Zones de livraison et retrait | Delivery zones and pickup |
| `catalog.tab.all` | Tous | All |
| `catalog.tab.live` | En ligne | Live |
| `catalog.tab.draft` | Brouillons | Draft |
| `catalog.tab.archived` | Archivés | Archived |
| `catalog.status.draft` | Brouillon | Draft |
| `catalog.status.live` | En ligne | Live |
| `catalog.status.archived` | Archivé | Archived |
| `catalog.stock.count` | {n} en stock | {n} in stock |
| `catalog.stock.unlimited` | Illimité | Unlimited |
| `catalog.stock.soldOut` | Épuisé | Sold out |
| `catalog.stock.soldOutToggle` | Marquer {title} comme épuisé | Mark {title} as sold out |
| `catalog.review.pending` | En cours de vérification | Under review |
| `catalog.review.rejected` | Refusé : {note} | Rejected: {note} |
| `catalog.empty.title` | Aucun produit pour l'instant | No products yet |
| `catalog.empty.body` | Ajoutez votre premier produit, ou importez-en plusieurs d'un coup depuis un fichier CSV. | Add your first product, or import many at once from a CSV file. |
| `catalog.empty.noMatch` | Aucun produit ne correspond. | No products match. |
| `catalog.toast.savedDraft` | Enregistré comme brouillon | Saved as draft |
| `catalog.toast.published` | Publié | Published |
| `catalog.toast.paused` | Mis en pause | Paused |
| `catalog.toast.archived` | Produit archivé | Product archived |
| `catalog.toast.soldOutOn` | Marqué comme épuisé | Marked as sold out |
| `catalog.toast.soldOutOff` | De nouveau en stock | Back in stock |
| `catalog.toast.fulfilmentSaved` | Livraison et retrait enregistrés | Fulfilment saved |
| `catalog.form.moderationHint` | Les modifications de texte et de photos sont publiées immédiatement. Ciuna les vérifie ensuite et peut vous demander de les corriger. | Changes to text and photos go live straight away. Ciuna reviews them afterwards and may ask you to fix them. |
| `catalog.form.publishLater` | Vous pourrez publier une fois votre entreprise approuvée par Ciuna. | You can publish once Ciuna approves your business. |
| `catalog.form.unsaved` | Vous avez des modifications non enregistrées. | You have unsaved changes. |
| `catalog.form.fixErrors` | Vérifiez les champs signalés. | Check the highlighted fields. |
| `catalog.section.basics` | Informations de base | Basics |
| `catalog.section.photos` | Photos | Photos |
| `catalog.section.price` | Prix | Price |
| `catalog.section.stock` | Stock | Stock |
| `catalog.section.fulfilment` | Remise des commandes | Fulfilment |
| `catalog.lang.defaultHint` | Langue par défaut. Elle s'affiche quand la langue du client n'est pas renseignée. | Default language. This is shown when a customer's language isn't filled in. |
| `catalog.lang.otherHint` | Facultatif. Laissez vide pour afficher votre langue par défaut. | Optional. Leave blank to show your default language. |
| `catalog.field.title` | Nom | Name |
| `catalog.field.short` | Description courte | Short description |
| `catalog.field.shortHint` | Affichée dans les listes. 300 caractères maximum. | Shown in lists. Up to 300 characters. |
| `catalog.field.long` | Description complète | Full description |
| `catalog.field.category` | Catégorie | Category |
| `catalog.field.listPrice` | Prix | Price |
| `catalog.field.salePrice` | Prix promotionnel | Sale price |
| `catalog.field.salePriceHint` | Facultatif. Doit être inférieur au prix. | Optional. Must be lower than the price. |
| `catalog.field.currency` | Devise | Currency |
| `catalog.field.unlimited` | Stock illimité | Unlimited stock |
| `catalog.field.stock` | Quantité en stock | Quantity in stock |
| `catalog.field.soldOut` | Épuisé | Sold out |
| `catalog.field.soldOutHint` | Les clients ne peuvent pas le commander tant que vous n'avez pas désactivé cette option. | Customers can't order it until you switch this off. |
| `catalog.cat.Meals` | Plats | Meals |
| `catalog.cat.Snacks` | Snacks | Snacks |
| `catalog.cat.Drinks` | Boissons | Drinks |
| `catalog.cat.Other` | Autre | Other |
| `catalog.cat.Groceries` | Épicerie | Groceries |
| `catalog.cat.Household` | Maison | Household |
| `catalog.cat.Electronics` | Électronique | Electronics |
| `catalog.photos.hint` | La première photo est la photo principale. Ajoutez-en jusqu'à 8 autres. | The first photo is the main one. Add up to 8 more. |
| `catalog.photos.main` | Photo principale | Main photo |
| `catalog.photos.addMain` | Ajouter la photo principale | Add main photo |
| `catalog.photos.add` | Ajouter une photo | Add photo |
| `catalog.photos.gallery` | Autres photos ({n} sur 8) | More photos ({n} of 8) |
| `catalog.mode.delivery` | Livraison | Delivery |
| `catalog.mode.pickup` | Retrait | Pickup |
| `catalog.mode.digital` | Numérique | Digital |
| `catalog.mode.deliveryHint` | Vous livrez ce produit au client. | You deliver this to the customer. |
| `catalog.mode.pickupHint` | Le client le récupère à votre point de retrait. | The customer collects it from your pickup location. |
| `catalog.mode.digitalHint` | Livré en ligne, rien à expédier. | Delivered online, nothing to ship. |
| `catalog.archive.title` | Archiver ce produit ? | Archive this product? |
| `catalog.archive.body` | Il disparaîtra de la boutique. Les commandes passées conservent leurs informations, et vous le retrouverez dans Archivés. | It will disappear from the store. Past orders keep their details, and you can still find it under Archived. |
| `catalog.fulfilment.title` | Livraison et retrait | Delivery and pickup |
| `catalog.fulfilment.intro` | Indiquez où les clients récupèrent leurs commandes et les zones où vous livrez. Il faut des zones de livraison pour publier des produits en livraison, et les informations de retrait pour publier des produits en retrait. | Set where customers collect orders and which areas you deliver to. You need delivery zones to publish delivery products, and pickup details to publish pickup products. |
| `catalog.fulfilment.pickup` | Retrait | Pickup |
| `catalog.fulfilment.pickupHint` | Les clients voient ceci lorsqu'ils choisissent le retrait. | Customers see this when they choose pickup. |
| `catalog.fulfilment.location` | Adresse de retrait | Pickup address |
| `catalog.fulfilment.hours` | Horaires d'ouverture | Opening hours |
| `catalog.fulfilment.hoursHint` | Par exemple : lun. au sam., 9 h à 20 h | For example: Mon to Sat, 9:00 to 20:00 |
| `catalog.fulfilment.notes` | Notes pour les clients | Notes for customers |
| `catalog.fulfilment.zones` | Zones de livraison | Delivery zones |
| `catalog.fulfilment.zonesHint` | Les clients ne peuvent se faire livrer que dans les zones listées. | Customers can order delivery only in the zones you list. |
| `catalog.fulfilment.noZones` | Aucune zone de livraison pour l'instant. | No delivery zones yet. |
| `catalog.fulfilment.city` | Ville | City |
| `catalog.fulfilment.district` | Quartier | District |
| `catalog.fulfilment.fee` | Frais de livraison | Delivery fee |
| `catalog.fulfilment.active` | Active | Active |
| `catalog.fulfilment.inactive` | Inactive | Inactive |
| `catalog.fulfilment.addZone` | Ajouter une zone | Add zone |
| `catalog.fulfilment.pickupMissing` | Ajoutez votre adresse de retrait pour publier des produits en retrait. | Add your pickup address to publish pickup products. |
| `catalog.fulfilment.zonesMissing` | Ajoutez au moins une zone de livraison active pour publier des produits en livraison. | Add at least one active delivery zone to publish delivery products. |
| `catalog.fulfilment.setup` | Configurer | Set up |
| `catalog.import.title` | Importer des produits | Import products |
| `catalog.import.intro` | Ajoutez jusqu'à 200 produits depuis un fichier CSV. Ils sont créés comme brouillons pour que vous puissiez les vérifier. | Add up to 200 products from a CSV file. They are created as drafts so you can check them first. |
| `catalog.import.step1` | 1. Récupérer le modèle | 1. Get the template |
| `catalog.import.step1Hint` | Un produit par ligne. {max} lignes maximum. Utilisez un point ou une virgule pour les décimales. | Fill in one product per row. Up to {max} rows. Use a period or comma for decimals. |
| `catalog.import.template` | Télécharger le modèle | Download template |
| `catalog.import.choose` | Choisir un fichier CSV | Choose CSV file |
| `catalog.import.badFile` | Impossible de lire ce fichier. Utilisez le modèle et vérifiez les colonnes title et list_price. | We couldn't read that file. Use the template and check the title and list_price columns. |
| `catalog.import.step2` | 2. Vérifier vos produits | 2. Check your products |
| `catalog.import.summary` | {file} : {valid} prêts, {invalid} avec des problèmes. Seules les lignes prêtes sont importées. | {file}: {valid} ready, {invalid} with problems. Only ready rows are imported. |
| `catalog.import.tooMany` | Seules les {max} premières lignes sur {total} sont utilisées. | Only the first {max} of {total} rows are used. |
| `catalog.import.lineUnknown` | Les catégories sont vérifiées à la création de chaque produit. | Categories are checked when each product is created. |
| `catalog.import.col.row` | Ligne | Row |
| `catalog.import.col.status` | Statut | Status |
| `catalog.import.ready` | Prêt | Ready |
| `catalog.import.progress` | {done} sur {total} importés | {done} of {total} imported |
| `catalog.import.step3` | 3. Importer | 3. Import |
| `catalog.import.result` | {created} créés, {failed} en échec. | {created} created, {failed} failed. |
| `catalog.import.draftNote` | Les produits créés sont des brouillons. Ouvrez-les pour ajouter des photos, puis publiez. | Created products are drafts. Open each one to add photos, then publish. |
| `catalog.import.failedRow` | Ligne {line} ({title}) : {reason} | Row {line} ({title}): {reason} |
| `catalog.import.another` | Importer un autre fichier | Import another file |
| `catalog.import.viewCatalog` | Voir le catalogue | View catalog |
| `catalog.import.start` | Importer {n} produits | Import {n} products |
| `catalog.import.finished` | Import terminé | Import finished |
| `errors.PRODUCT_NOT_FOUND` | Produit introuvable. | We couldn't find that product. |
| `errors.STORE_ONLY` | Seules les boutiques peuvent gérer des produits. | Only stores can manage products. |
| `errors.TITLE_REQUIRED` | Saisissez un nom d'au moins 2 caractères. | Enter a name with at least 2 characters. |
| `errors.PRICE_REQUIRED` | Saisissez un prix supérieur à 0. | Enter a price above 0. |
| `errors.SALE_PRICE_TOO_HIGH` | Le prix promotionnel doit être inférieur au prix. | The sale price must be lower than the price. |
| `errors.INVALID_STOCK` | Saisissez un nombre entier supérieur ou égal à 0. | Enter a whole number of 0 or more. |
| `errors.CATEGORY_OUTSIDE_LINE` | Cette catégorie n'est pas disponible pour votre boutique. | That category isn't available for your store. |
| `errors.FULFILLMENT_REQUIRED` | Choisissez livraison, retrait ou numérique. | Choose delivery, pickup or digital. |
| `errors.GALLERY_INVALID` | Utilisez jusqu'à 8 photos avec des liens https. | Use up to 8 photos with https links. |
| `errors.LISTING_REJECTED` | Cette annonce a été refusée. Modifiez le texte ou les photos pour la soumettre à nouveau. | This listing was rejected. Edit the text or photos to submit it again. |
| `errors.VENDOR_UNAVAILABLE` | Votre boutique n'est pas disponible pour les clients pour le moment. | Your store isn't available to customers right now. |
| `errors.PICKUP_CONFIGURATION_REQUIRED` | Ajoutez votre adresse de retrait avant de publier des produits en retrait. | Add your pickup address before publishing pickup products. |
| `errors.DELIVERY_ZONE_REQUIRED` | Ajoutez une zone de livraison avant de publier des produits en livraison. | Add a delivery zone before publishing delivery products. |
| `errors.PAYMENT_METHOD_REQUIRED` | Ajoutez un moyen de paiement avant de publier. | Add a payment method before publishing. |
| `errors.VENDOR_REQUIRED` | Configurez votre boutique avant d'ajouter des produits. | Set up your store before adding products. |
| `errors.TRANSLATIONS_INVALID` | Certaines traductions ne sont pas valides. | Some translations aren't valid. |
| `errors.STATUS_INVALID` | Choisissez brouillon, en ligne ou archivé. | Choose draft, live or archived. |
| `errors.TOO_MANY_ZONES` | Vous pouvez ajouter jusqu'à 200 zones. | You can add up to 200 zones. |
| `errors.ZONE_INVALID` | Saisissez une ville et un quartier pour chaque zone. | Enter a city and a district for every zone. |
| `errors.ZONE_FEE_INVALID` | Saisissez des frais de livraison supérieurs ou égaux à 0. | Enter a delivery fee of 0 or more. |
| `errors.ZONE_CURRENCY_INVALID` | Choisissez une devise prise en charge pour la zone. | Choose a supported currency for the zone. |
| `errors.ZONE_DUPLICATE` | Chaque ville et quartier ne peut figurer qu'une seule fois. | Each city and district can be listed only once. |

### `seller/locales/fr/common.json` (151 strings)

| Key | Text | English source |
| --- | --- | --- |
| `app.name` | Ciuna Seller | Ciuna Seller |
| `nav.home` | Accueil | Home |
| `nav.orders` | Commandes | Orders |
| `nav.bookings` | Réservations | Bookings |
| `nav.catalog` | Catalogue | Catalog |
| `nav.services` | Services | Services |
| `nav.messages` | Messages | Messages |
| `nav.earnings` | Revenus | Earnings |
| `nav.profile` | Profil | Profile |
| `nav.store` | Boutique | Store |
| `nav.availability` | Disponibilités | Availability |
| `nav.settings` | Paramètres | Settings |
| `nav.more` | Plus | More |
| `action.save` | Enregistrer les modifications | Save changes |
| `action.cancel` | Annuler | Cancel |
| `action.continue` | Continuer | Continue |
| `action.back` | Retour | Back |
| `action.retry` | Réessayer | Try again |
| `action.signOut` | Se déconnecter | Sign out |
| `action.add` | Ajouter | Add |
| `action.remove` | Supprimer | Remove |
| `action.edit` | Modifier | Edit |
| `action.close` | Fermer | Close |
| `state.loading` | Chargement | Loading |
| `state.saved` | Enregistré | Saved |
| `state.required` | Obligatoire | Required |
| `status.draft` | Brouillon | Draft |
| `status.in_review` | En cours d'examen | In review |
| `status.live` | En ligne | Live |
| `status.paused` | En pause | Paused |
| `status.rejected` | Refusé | Rejected |
| `status.suspended` | Suspendu | Suspended |
| `type.store` | Boutique | Store |
| `type.expert` | Expert | Expert |
| `role.owner` | Propriétaire | Owner |
| `role.manager` | Responsable | Manager |
| `role.staff` | Équipe | Staff |
| `role.finance` | Finance | Finance |
| `language.label` | Langue | Language |
| `merchant.switch` | Changer d'activité | Switch business |
| `banner.review.title` | Votre demande est en cours d'examen | Your application is in review |
| `banner.review.body` | Ciuna vérifie vos informations. Vous pouvez continuer à préparer vos annonces. | Ciuna is checking your details. You can keep preparing your listings. |
| `banner.rejected.title` | Votre demande doit être modifiée | Your application needs changes |
| `banner.suspended.title` | Votre activité est suspendue | Your business is suspended |
| `banner.paused.title` | Vous n'acceptez pas de nouvelles commandes | You are not accepting new orders |
| `banner.paused.action` | Reprendre les ventes | Resume selling |
| `banner.draft.title` | Terminez la configuration pour commencer à vendre | Finish setup to start selling |
| `banner.draft.action` | Poursuivre la configuration | Continue setup |
| `errors.generic` | Une erreur s'est produite. Réessayez. | Something went wrong. Try again. |
| `errors.UNAUTHENTICATED` | Connectez-vous pour continuer. | Sign in to continue. |
| `errors.FORBIDDEN` | Vous n'avez pas accès à cette page. | You don't have access to this. |
| `errors.NO_MERCHANT` | Créez ou rejoignez une activité pour continuer. | Create or join a business to continue. |
| `errors.MERCHANT_NOT_LIVE` | Vous pourrez publier une fois votre activité approuvée par Ciuna. | You can publish once Ciuna approves your business. |
| `errors.MERCHANT_SUSPENDED` | Votre activité est suspendue. Contactez l'assistance. | Your business is suspended. Contact support. |
| `errors.MERCHANT_STATUS_NOT_ALLOWED` | Cette action n'est pas disponible avec votre statut actuel. | This isn't available in your current status. |
| `errors.DISPLAY_NAME_INVALID` | Saisissez un nom de 2 à 80 caractères. | Enter a name between 2 and 80 characters. |
| `errors.COUNTRY_INVALID` | Choisissez un pays. | Choose a country. |
| `errors.LANGUAGE_INVALID` | Choisissez au moins une langue prise en charge. | Choose at least one supported language. |
| `errors.EMAIL_INVALID` | Saisissez une adresse e-mail valide. | Enter a valid email address. |
| `errors.URL_INVALID` | Utilisez un lien commençant par https://. | Use a link that starts with https://. |
| `errors.CURRENCY_INVALID` | Choisissez une devise prise en charge. | Choose a supported currency. |
| `errors.MERCHANT_LIMIT_REACHED` | Vous pouvez posséder jusqu'à 5 activités. | You can own up to 5 businesses. |
| `errors.UNSUPPORTED_FILE_TYPE` | Utilisez une image JPG, PNG ou WebP, ou un PDF pour les documents. | Use a JPG, PNG or WebP image, or a PDF for documents. |
| `errors.FILE_TOO_LARGE` | Ce fichier est trop volumineux. Choisissez un fichier plus petit. | That file is too large. |
| `errors.UPLOAD_FAILED` | Échec du téléversement. Réessayez. | Upload failed. Try again. |
| `image.replace` | Remplacer l'image | Replace image |
| `action.upload` | Téléverser | Upload |
| `action.submit` | Envoyer | Submit |
| `action.done` | Terminé | Done |
| `state.default` | par défaut | default |
| `noAccess.title` | Vous n'avez pas accès à cette page | You don't have access to this page |
| `noAccess.body` | Demandez au propriétaire de l'entreprise de vous donner l'accès. | Ask the business owner to give you access. |
| `noAccess.back` | Retour à l'accueil | Back to Home |
| `home.setup.progress` | Progression de la configuration | Setup progress |
| `home.setup.count` | {done} sur {total} terminés | {done} of {total} done |
| `home.overdue` | En retard | Overdue |
| `home.inProgress.help` | Acceptées ou en préparation | Accepted or preparing |
| `home.needs.title` | À traiter | Needs you |
| `home.needs.count.one` | {count} élément | {count} item |
| `home.needs.count.other` | {count} éléments | {count} items |
| `home.needs.empty.title` | Vous êtes à jour | You are all caught up |
| `home.needs.empty.body` | Rien ne demande votre attention pour le moment. | Nothing needs you right now. |
| `home.needs.accept.one` | Accepter 1 nouvelle commande | Accept 1 new order |
| `home.needs.accept.other` | Accepter {count} nouvelles commandes | Accept {count} new orders |
| `home.needs.acceptBooking.one` | Accepter 1 demande de réservation | Accept 1 booking request |
| `home.needs.acceptBooking.other` | Accepter {count} demandes de réservation | Accept {count} booking requests |
| `home.needs.acceptSub.due` | Le plus ancien est dû dans {time} | The oldest is due in {time} |
| `home.needs.acceptSub.overdue` | Le plus ancien est en retard de {time} | The oldest is overdue by {time} |
| `home.needs.acceptSub.none` | En attente de votre acceptation | Waiting for you to accept |
| `home.needs.reply` | Répondre à {name} | Reply to {name} |
| `home.needs.replySub` | Nouveau message sur la commande {id} | New message about order {id} |
| `home.needs.lowStock` | {title} : {count} restant(s) | {title}: {count} left |
| `home.needs.lowStockSub` | Mettez à jour le stock ou marquez-le épuisé | Update stock or mark it sold out |
| `home.needs.doc` | {label} expire le {date} | {label} expires {date} |
| `home.needs.docSub` | Téléversez le document renouvelé | Upload the renewed document |
| `home.today.title` | Gains du jour | Today's earnings |
| `home.today.orders.one` | {count} commande | {count} order |
| `home.today.orders.other` | {count} commandes | {count} orders |
| `home.today.gross` | Ventes brutes | Gross sales |
| `home.today.fee` | Frais Ciuna | Ciuna fee |
| `home.today.net` | Net | Net |
| `home.today.view` | Voir les gains | View earnings |
| `home.today.empty` | Aucune commande terminée aujourd'hui. | No completed orders yet today. |
| `orders.action.acceptBooking` | Accepter la réservation | Accept booking |
| `orders.tab.board` | Tableau | Board |
| `orders.board.empty` | Rien ici | Nothing here |
| `orders.rejectedReason` | Motif : | Reason: |
| `orders.reject.bodyRefund` | Le client sera remboursé de {amount}. Il verra votre motif. | The customer will be refunded {amount}. They will see your reason. |
| `earnings.item.keep` | Vous gardez | You keep |
| `earnings.item.reversedNote` | Annulé : cette commande ne compte plus dans votre solde. | Reversed, so this order no longer counts toward your balance. |
| `earnings.methods.sendRow` | Retirer via Ciuna Send | Withdraw via Ciuna Send |
| `earnings.methods.sendRow.help` | Pas encore disponible. | Not available yet. |
| `earnings.methods.defaultBadge` | Par défaut | Default |
| `home.delta.more` | {count} commandes de plus qu'hier | {count} more orders than yesterday |
| `home.delta.fewer` | {count} commandes de moins qu'hier | {count} fewer orders than yesterday |
| `earnings.rule.food` | Restauration | Food |
| `earnings.rule.mart` | Marché | Mart |
| `earnings.rule.experts` | Services d'experts | Expert services |
| `earnings.rule.generic` | Commission | Commission |
| `earnings.rule.percent` | {line} {percent} % | {line} {percent}% |
| `earnings.rule.fixed` | {line} : frais fixes | {line} fixed fee |
| `catalog.section.visibility` | Visibilité | Visibility |
| `catalog.field.visible` | Visible dans votre boutique | Visible in your store |
| `catalog.field.visibleOn` | Les clients pourront trouver et commander ce produit après l'enregistrement. | Customers can find and order this product after you save. |
| `catalog.field.visibleOff` | Masqué aux clients. Vous pouvez l'activer à tout moment. | Hidden from customers. You can turn it on any time. |
| `catalog.import.fileHint` | Fichier CSV, 2 Mo maximum. | CSV file, up to 2 MB. |
| `catalog.import.problem` | Problème | Has a problem |
| `catalog.fulfilment.unlocks` | Ce que cela débloque | What this unlocks |
| `catalog.fulfilment.unlock.pickup` | Adresse de retrait | Pickup address |
| `catalog.fulfilment.unlock.pickupHelp` | Les clients peuvent choisir le retrait. | Lets customers choose Pickup. |
| `catalog.fulfilment.unlock.delivery` | Une zone de livraison active | An active delivery zone |
| `catalog.fulfilment.unlock.deliveryHelp` | Les clients de cette zone peuvent commander la livraison. | Lets customers in that area order delivery. |
| `catalog.fulfilment.unlock.digital` | Produits numériques | Digital products |
| `catalog.fulfilment.unlock.digitalHelp` | Ne nécessitent ni retrait ni livraison. | Need neither pickup nor delivery. |
| `messages.pick.title` | Choisissez une conversation | Choose a conversation |
| `messages.pick.body` | Choisissez un client à gauche pour lire et répondre. | Pick a customer on the left to read and reply. |
| `reviews.editLeft` | Vous pouvez modifier cette réponse pendant encore {hours} h. | You can edit this reply for {hours} more hours. |
| `reviews.locked` | Cette réponse ne peut plus être modifiée. | This reply can no longer be edited. |
| `merchant.add` | Ajouter une entreprise | Add a business |
| `merchant.current` | Entreprise actuelle | Current business |
| `shell.account` | Menu du compte | Account menu |
| `shell.notifications` | Notifications | Notifications |
| `shell.notifications.count` | Notifications : {count} en attente | Notifications: {count} waiting for you |
| `more.group.business` | Entreprise | Business |
| `more.group.settings` | Paramètres | Settings |
| `more.verification.action` | Action requise | Action needed |
| `more.verification.review` | En cours d'examen | In review |
| `more.verification.rejected` | Refusé | Rejected |
| `more.verification.verified` | Vérifié | Verified |
| `more.team.count` | {count} personnes | {count} people |
| `more.team.count.one` | 1 personne | 1 person |

### `seller/locales/fr/earnings.json` (152 strings)

| Key | Text | English source |
| --- | --- | --- |
| `earnings.title` | Revenus | Earnings |
| `earnings.subtitle` | Ce que vous avez gagné, ce qui est en attente et ce qui a été versé. | What you have earned, what is waiting, and what has been paid out. |
| `earnings.nav.overview` | Revenus | Earnings |
| `earnings.nav.payouts` | Versements | Payouts |
| `earnings.nav.methods` | Moyens de versement | Payout methods |
| `earnings.available` | Disponible | Available |
| `earnings.available.help` | Prêt à être retiré | Ready to withdraw |
| `earnings.pending` | En attente | Pending |
| `earnings.pending.help` | Disponible dans {days} jours, une fois la commande remise | Available after {days} days, once the order is fulfilled |
| `earnings.inPayout` | En cours de versement | In payout |
| `earnings.inPayout.help` | Demandé, en attente d'envoi | Requested and waiting to be sent |
| `earnings.paidOut` | Versé | Paid out |
| `earnings.paidOut.help` | Déjà envoyé sur votre compte | Already sent to your account |
| `earnings.withdraw` | Retirer | Withdraw |
| `earnings.withdraw.cta` | Demander un versement | Request payout |
| `earnings.withdraw.timing` | Ciuna examine les versements et les envoie sur votre compte. Vous verrez le statut ici. | Ciuna reviews payouts and sends them to your account. You'll see the status here. |
| `earnings.withdraw.currency` | Devise | Currency |
| `earnings.withdraw.method` | Verser sur | Pay out to |
| `earnings.withdraw.noMethod` | Aucun moyen vérifié | No verified method |
| `earnings.withdraw.unverified.title` | En attente de vérification | Waiting for verification |
| `earnings.withdraw.unverified.body` | Ciuna vérifie encore : {names}. Vous pourrez retirer vos fonds une fois la vérification terminée. | Ciuna is still verifying: {names}. You can withdraw once it is verified. |
| `earnings.withdraw.unverified.note` | Pas encore disponible, vérification en cours : {names}. | Not available yet, still being verified: {names}. |
| `earnings.withdraw.none.title` | Aucun moyen de versement en {currency} | No payout method for {currency} |
| `earnings.withdraw.none.body` | Ajoutez un compte bancaire en {currency}. Ciuna le vérifie avant votre premier versement. | Add a bank account in {currency}. Ciuna verifies it before your first payout. |
| `earnings.methods.manage` | Gérer les moyens | Manage methods |
| `earnings.withdraw.amount` | Montant | Amount |
| `earnings.withdraw.all` | Tout retirer | Withdraw all |
| `earnings.withdraw.available` | Disponible : | Available: |
| `earnings.withdraw.min` | Minimum | Minimum |
| `earnings.withdraw.requested` | Vous retirez | You withdraw |
| `earnings.withdraw.fee` | Frais de versement | Payout fee |
| `earnings.withdraw.receive` | Vous recevez | You receive |
| `earnings.withdraw.success` | Versement demandé. Ciuna l'examinera et l'enverra sur votre compte. | Payout requested. Ciuna will review it and send it to your account. |
| `earnings.withdraw.nothing` | Rien à retirer pour l'instant. Les revenus deviennent disponibles après le délai de rétention. | Nothing available to withdraw yet. Earnings become available after the hold period. |
| `earnings.noAccess.title` | Revenus privés | Earnings are private |
| `earnings.noAccess.body` | Demandez au propriétaire, à un gérant ou à la finance de consulter les revenus. | Ask the owner, a manager or finance to view earnings. |
| `earnings.empty.title` | Aucun revenu pour l'instant | No earnings yet |
| `earnings.empty.body` | Quand vous remettez une commande, ses revenus apparaissent ici et deviennent disponibles après {days} jours. | When you fulfil an order, its earnings show here and become available after {days} days. |
| `earnings.statement` | Relevé | Statement |
| `earnings.statement.help` | Chaque commande avec articles, livraison, frais Ciuna et ce que vous gardez. | Every order with items, delivery, Ciuna fee and what you keep. |
| `earnings.tab.all` | Tout | All |
| `earnings.tab.pending` | En attente | Pending |
| `earnings.tab.available` | Disponible | Available |
| `earnings.tab.reversed` | Annulé | Reversed |
| `earnings.item.pending` | En attente | Pending |
| `earnings.item.available` | Disponible | Available |
| `earnings.item.reversed` | Annulé | Reversed |
| `earnings.item.availableOn` | Disponible le {date} | Available on {date} |
| `earnings.item.availableSince` | Disponible depuis le {date} | Available since {date} |
| `earnings.empty.all.title` | Aucun revenu pour l'instant | No earnings yet |
| `earnings.empty.all.body` | Les commandes remises apparaîtront ici. | Fulfilled orders will appear here. |
| `earnings.empty.pending.title` | Rien en attente | Nothing pending |
| `earnings.empty.pending.body` | Les commandes récemment remises attendent ici la fin du délai de rétention. | Orders you have fulfilled recently wait here until the hold period ends. |
| `earnings.empty.available.title` | Rien de disponible | Nothing available |
| `earnings.empty.available.body` | Les revenus ayant passé le délai de rétention apparaissent ici. | Earnings that passed the hold period appear here. |
| `earnings.empty.reversed.title` | Rien d'annulé | Nothing reversed |
| `earnings.empty.reversed.body` | Les commandes remboursées après remise apparaissent ici. | Orders refunded after fulfilment appear here. |
| `earnings.col.order` | Commande | Order |
| `earnings.col.date` | Date | Date |
| `earnings.col.items` | Articles | Items |
| `earnings.col.delivery` | Livraison | Delivery |
| `earnings.col.fee` | Frais Ciuna | Ciuna fee |
| `earnings.col.net` | Vous gagnez | You earn |
| `earnings.col.status` | Statut | Status |
| `earnings.loadMore` | Afficher plus | Load more |
| `earnings.download.title` | Télécharger le relevé | Download statement |
| `earnings.download.help` | Toutes les commandes d'une période, au format CSV. | Get every order in a date range as a CSV file. |
| `earnings.download.from` | Du | From |
| `earnings.download.to` | Au | To |
| `earnings.download.cta` | Télécharger le CSV | Download CSV |
| `earnings.payouts.title` | Versements | Payouts |
| `earnings.payouts.subtitle` | Tous les versements demandés et leur état. | Every payout you requested, and where it stands. |
| `earnings.payouts.noAccess.title` | Versements privés | Payouts are private |
| `earnings.payouts.noAccess.body` | Demandez au propriétaire ou à la finance de consulter les versements. | Ask the owner or finance to view payouts. |
| `earnings.payouts.empty.title` | Aucun versement pour l'instant | No payouts yet |
| `earnings.payouts.empty.body` | Quand vous retirez des fonds, la demande et son statut apparaissent ici. | When you withdraw, the request and its status appear here. |
| `earnings.payouts.empty.cta` | Aller aux revenus | Go to earnings |
| `earnings.payout.status.requested` | Demandé | Requested |
| `earnings.payout.status.approved` | Approuvé | Approved |
| `earnings.payout.status.paid` | Versé | Paid |
| `earnings.payout.status.rejected` | Refusé | Rejected |
| `earnings.payout.status.cancelled` | Annulé | Cancelled |
| `earnings.payout.requestedOn` | Demandé le {date} | Requested {date} |
| `earnings.payout.fee` | Frais de versement | Payout fee |
| `earnings.payout.received` | Vous avez reçu | You received |
| `earnings.payout.method` | Versé sur | Paid to |
| `earnings.payout.paidOn` | Versé le | Paid on |
| `earnings.payout.reference` | Référence | Reference |
| `earnings.payout.reason` | Motif | Reason |
| `earnings.payout.note.requested` | En attente d'examen par Ciuna. Vous pouvez annuler jusqu'à l'approbation. | Waiting for Ciuna to review. You can cancel until it is approved. |
| `earnings.payout.note.approved` | Approuvé. Ciuna enverra l'argent sur votre compte. | Approved. Ciuna will send the money to your account. |
| `earnings.payout.note.paid` | Envoyé sur votre compte. | Sent to your account. |
| `earnings.payout.note.rejected` | Non versé. L'argent est revenu dans votre solde disponible. | Not paid. The money is back in your available balance. |
| `earnings.payout.note.cancelled` | Annulé. L'argent est revenu dans votre solde disponible. | Cancelled. The money is back in your available balance. |
| `earnings.payout.cancel` | Annuler la demande | Cancel request |
| `earnings.payout.cancel.q` | Annuler cette demande de versement ? | Cancel this payout request? |
| `earnings.payout.cancel.body` | L'argent revient immédiatement dans votre solde disponible. | The money returns to your available balance right away. |
| `earnings.payout.cancel.confirm` | Annuler la demande | Cancel request |
| `earnings.payout.cancel.keep` | Garder la demande | Keep request |
| `earnings.payout.cancelled` | Demande de versement annulée. | Payout request cancelled. |
| `earnings.kind.bank` | Compte bancaire | Bank account |
| `earnings.kind.sbp` | SBP (Russie) | SBP (Russia) |
| `earnings.kind.ciuna_send` | Ciuna Send | Ciuna Send |
| `earnings.comingSoon` | Bientôt | Coming soon |
| `earnings.methods.title` | Moyens de versement | Payout methods |
| `earnings.methods.subtitle` | Où Ciuna envoie votre argent. | Where Ciuna sends your money. |
| `earnings.methods.add` | Ajouter un moyen | Add method |
| `earnings.methods.add.cta` | Ajouter un moyen | Add method |
| `earnings.methods.default` | par défaut | default |
| `earnings.methods.verified` | Vérifié | Verified |
| `earnings.methods.waiting` | En attente de vérification | Waiting for verification |
| `earnings.methods.makeDefault` | Définir par défaut | Make default |
| `earnings.methods.defaultSet` | Moyen par défaut mis à jour. | Default method updated. |
| `earnings.methods.removed` | Moyen supprimé. | Method removed. |
| `earnings.methods.added` | Moyen ajouté. Ciuna le vérifiera avant votre premier versement. | Method added. Ciuna will verify it before your first payout. |
| `earnings.methods.remove.q` | Supprimer ce moyen ? | Remove this method? |
| `earnings.methods.remove.body` | Vous pourrez le rajouter plus tard. Les demandes en cours gardent leur moyen d'origine. | You can add it again later. Open payout requests keep their original method. |
| `earnings.methods.verify.title` | Ciuna vérifie les nouveaux moyens | Ciuna verifies new methods |
| `earnings.methods.verify.body` | Un nouveau moyen ne peut pas recevoir d'argent tant que Ciuna ne l'a pas vérifié. « Vérifié » s'affichera ici quand il sera prêt. | A new method can't receive money until Ciuna has verified it. You'll see "Verified" here when it is ready. |
| `earnings.methods.empty.title` | Aucun moyen de versement | No payout methods |
| `earnings.methods.empty.body` | Ajoutez un compte bancaire pour retirer vos revenus. | Add a bank account so you can withdraw your earnings. |
| `earnings.methods.kind` | Type | Type |
| `earnings.methods.currency` | Devise | Currency |
| `earnings.methods.sbp.rubOnly` | SBP ne verse qu'en RUB. | SBP pays out in RUB only. |
| `earnings.methods.label` | Nom de ce moyen | Name for this method |
| `earnings.methods.label.hint` | Facultatif, par ex. « Compte principal ». Vous seul le voyez. | Optional, e.g. "Main account". Only you see it. |
| `earnings.methods.privacy` | Ces informations sont chiffrées et ne sont plus jamais affichées. Seuls les 4 derniers chiffres le sont. | We keep these details encrypted and never show them again. Only the last 4 digits are shown. |
| `earnings.field.phone` | Numéro de téléphone | Phone number |
| `earnings.field.bank_name` | Nom de la banque | Bank name |
| `earnings.field.recipient_name` | Nom du bénéficiaire | Recipient name |
| `earnings.field.account_number` | Numéro de compte | Account number |
| `earnings.field.bik` | BIK (facultatif) | BIK (optional) |
| `earnings.field.swift` | SWIFT (facultatif) | SWIFT (optional) |
| `earnings.field.iban` | IBAN (facultatif) | IBAN (optional) |
| `earnings.field.country` | Pays (facultatif) | Country (optional) |
| `errors.INSUFFICIENT_BALANCE` | Votre solde disponible est inférieur à ce montant. | Your available balance is lower than this amount. |
| `errors.BELOW_MINIMUM_PAYOUT` | Ce montant est inférieur au versement minimum. | This is below the minimum payout. |
| `errors.PAYOUT_METHOD_NOT_FOUND` | Ce moyen de versement est introuvable. | That payout method wasn't found. |
| `errors.PAYOUT_METHOD_NOT_VERIFIED` | Ce moyen n'a pas encore été vérifié. | That method hasn't been verified yet. |
| `errors.PAYOUT_CURRENCY_MISMATCH` | La devise du moyen ne correspond pas à ce versement. | The method's currency doesn't match this payout. |
| `errors.AMOUNT_INVALID` | Saisissez un montant supérieur à zéro, avec 2 décimales au maximum. | Enter an amount greater than zero, with up to 2 decimals. |
| `errors.TOO_MANY_OPEN_PAYOUTS` | Vous avez déjà 3 demandes de versement ouvertes. Attendez qu'une se termine ou annulez-en une. | You already have 3 open payout requests. Wait for one to finish or cancel one. |
| `errors.PAYOUT_FEE_INVALID` | Les frais de versement dépassent le montant. Essayez un montant plus élevé. | The payout fee is higher than the amount. Try a larger amount. |
| `errors.METHOD_IN_USE` | Ce moyen a un versement en cours. Réessayez une fois celui-ci terminé. | This method has an open payout. Try again after it finishes. |
| `errors.TOO_MANY_METHODS` | Vous pouvez conserver jusqu'à 10 moyens de versement. | You can keep up to 10 payout methods. |
| `errors.KIND_INVALID` | Choisissez un type de moyen. | Choose a method type. |
| `errors.CURRENCY_NOT_SUPPORTED` | Ce type de moyen ne prend pas en charge cette devise. | This method type doesn't support that currency. |
| `errors.PHONE_INVALID` | Saisissez un numéro de téléphone de 10 à 15 chiffres. | Enter a phone number with 10 to 15 digits. |
| `errors.FIELD_REQUIRED` | Obligatoire | Required |
| `errors.PAYOUT_NOT_FOUND` | Ce versement est introuvable. | That payout wasn't found. |
| `errors.DATE_INVALID` | Choisissez une période valide. | Choose a valid date range. |
| `errors.METHOD_HAS_HISTORY` | Ce moyen a déjà servi pour un versement, il ne peut donc pas être supprimé. Définissez-en un autre par défaut. | This method was used for a past payout, so it can't be removed. Make another method the default instead. |

### `seller/locales/fr/expert.json` (219 strings)

| Key | Text | English source |
| --- | --- | --- |
| `expert.only.title` | Réservé aux experts | Experts only |
| `expert.only.body` | Cette section est réservée aux comptes experts. Passez à votre activité d'expert pour l'utiliser. | This section is for expert accounts. Switch to your expert business to use it. |
| `expert.only.home` | Aller à l'accueil | Go to home |
| `expert.unit.label` | Unité | Unit |
| `expert.unit.minutes` | minutes | minutes |
| `expert.unit.hours` | heures | hours |
| `expert.unit.min` | min | min |
| `expert.unit.h` | h | h |
| `expert.services.title` | Services | Services |
| `expert.services.subtitle` | Ce que les clients peuvent réserver chez vous. | What customers can book with you. |
| `expert.services.add` | Ajouter un service | Add service |
| `expert.services.empty.title` | Aucun service pour l'instant | No services yet |
| `expert.services.empty.body` | Ajoutez votre premier service, puis définissez vos disponibilités pour que les clients puissent réserver. | Add your first service, then set your availability so customers can book. |
| `expert.services.per_hour` | par heure | per hour |
| `expert.services.slots` | {count} créneaux libres dans les 14 prochains jours | {count} open slots in the next 14 days |
| `expert.services.slots.none` | Aucun créneau libre sous 14 jours | No open slots in the next 14 days |
| `expert.services.slots.set` | Définir les disponibilités | Set availability |
| `expert.services.publish` | Publier ce service | Publish this service |
| `expert.services.published` | Visible par les clients | Visible to customers |
| `expert.services.publish_toggle` | Publier {title} | Publish {title} |
| `expert.services.needs_instructions` | Ajoutez les instructions de rendez-vous avant de publier. | Add meeting instructions before publishing. |
| `expert.pricing.hourly` | Tarif horaire | Hourly rate |
| `expert.pricing.fixed` | Prix fixe par séance | Fixed price per session |
| `expert.pricing.quote` | Sur devis | Quote on request |
| `expert.delivery.online` | En ligne | Online |
| `expert.delivery.in_person` | En personne | In person |
| `expert.delivery.both` | En ligne ou en personne | Online or in person |
| `expert.form.new` | Nouveau service | New service |
| `expert.form.edit` | Modifier le service | Edit service |
| `expert.form.notlive.title` | Vous pourrez publier une fois votre activité approuvée | You can publish once Ciuna approves your business |
| `expert.form.rejected` | Ce service a été refusé. Modifiez le titre, la description ou les instructions, puis enregistrez pour le soumettre à nouveau. | This service was rejected. Edit the title, description or instructions and save to send it for review again. |
| `expert.form.review` | Les modifications du titre, de la description ou des instructions sont vérifiées par Ciuna avant d'être visibles. | Changes to the title, description or instructions are reviewed by Ciuna before customers see them. |
| `expert.form.basics` | Informations de base | Basics |
| `expert.form.basics.hint` | Rédigez dans la langue que vous utilisez. Les autres langues sont facultatives. | Write in the language you serve. Other languages are optional. |
| `expert.form.title` | Titre du service | Service title |
| `expert.form.title.ph` | Par exemple, séance de coaching de carrière | For example, Career coaching session |
| `expert.form.short` | Description courte | Short description |
| `expert.form.lang.hint` | Si vous laissez vide, les clients verront la langue par défaut. | If you leave this empty, customers see the default language. |
| `expert.form.err.title` | Saisissez un titre. | Enter a title. |
| `expert.form.pricing` | Tarification | Pricing |
| `expert.form.pricing.type` | Type de tarification | Pricing type |
| `expert.form.rate` | Tarif par heure | Rate per hour |
| `expert.form.price` | Prix par séance | Price per session |
| `expert.form.currency` | Devise | Currency |
| `expert.form.quote.note` | Les services sur devis ne peuvent pas être réservés en ligne ; ils ne sont donc pas proposés ici. | Services priced on request can't be booked online, so they aren't offered here. |
| `expert.form.err.amount` | Saisissez un montant supérieur à zéro. | Enter an amount greater than zero. |
| `expert.form.duration` | Durée | Duration |
| `expert.form.duration.default` | Durée de la séance | Session length |
| `expert.form.duration.min` | Séance la plus courte | Shortest session |
| `expert.form.duration.max` | Séance la plus longue | Longest session |
| `expert.form.optional` | Facultatif | Optional |
| `expert.form.err.duration` | Saisissez une durée supérieure à zéro. | Enter a session length greater than zero. |
| `expert.form.err.range` | La séance la plus courte ne peut pas dépasser la plus longue. | The shortest session can't be longer than the longest. |
| `expert.form.delivery` | Format | Delivery |
| `expert.form.delivery.mode` | Où ont lieu les séances | Where sessions happen |
| `expert.form.instructions` | Instructions de rendez-vous | Meeting instructions |
| `expert.form.instructions.hint` | Comment rejoindre ou où se retrouver. Obligatoire pour publier. | How customers join or where to meet. Required to publish. |
| `expert.form.err.instructions` | Ajoutez les instructions de rendez-vous pour publier. | Add meeting instructions to publish. |
| `expert.form.rules` | Règles de réservation | Booking rules |
| `expert.form.lead` | Préavis minimum avant une séance | Minimum notice before a session |
| `expert.form.lead.hint` | Les clients ne peuvent pas réserver un créneau qui commence plus tôt. | Customers can't book slots that start sooner than this. |
| `expert.form.cutoff` | Délai de paiement avant une séance | Payment deadline before a session |
| `expert.form.cutoff.hint` | Une réservation doit être payée au moins ce temps avant le début. | A booking must be paid at least this long before it starts. |
| `expert.form.err.number` | Saisissez zéro ou plus. | Enter zero or more. |
| `expert.form.timezone` | Fuseau horaire du service | Service time zone |
| `expert.form.timezone.hint` | Les clients voient les horaires avec ce fuseau. | Customers see session times with this zone. |
| `expert.form.save_draft` | Enregistrer le brouillon | Save draft |
| `expert.form.publish` | Publier | Publish |
| `expert.form.unsaved` | Modifications non enregistrées | Unsaved changes |
| `expert.form.toast.saved` | Service enregistré | Service saved |
| `expert.form.toast.published` | Service publié | Service published |
| `expert.form.toast.unpublished` | Service dépublié | Service unpublished |
| `expert.form.unpublish.title` | Ne plus accepter de réservations | Stop accepting bookings |
| `expert.form.unpublish.body` | Le service est masqué aux clients et ses créneaux libres sont supprimés. | The service is hidden from customers and its open slots are removed. |
| `expert.form.unpublish.action` | Dépublier | Unpublish |
| `expert.form.unpublish.confirm` | Dépublier ce service ? | Unpublish this service? |
| `expert.form.unpublish.confirm.body` | Les clients ne le verront plus et ses créneaux libres seront supprimés. Les réservations existantes sont conservées. Pour le proposer à nouveau, publiez-le et enregistrez vos disponibilités. | Customers will no longer see it and its open slots will be removed. Existing bookings stay. To offer it again, publish it and save your availability. |
| `expert.avail.title` | Disponibilités | Availability |
| `expert.avail.subtitle` | Indiquez quand les clients peuvent réserver. L'enregistrement recrée vos créneaux libres. | Set when customers can book you. Saving rebuilds your open slots. |
| `expert.avail.service` | Service | Service |
| `expert.avail.noservice.title` | Ajoutez d'abord un service | Add a service first |
| `expert.avail.noservice.body` | Les disponibilités se définissent par service. | Availability is set per service. |
| `expert.avail.settings` | Paramètres du planning | Schedule settings |
| `expert.avail.timezone` | Fuseau horaire | Time zone |
| `expert.avail.timezone.hint` | Vos horaires hebdomadaires sont dans ce fuseau. | Your weekly hours are in this time zone. |
| `expert.avail.slot` | Durée d'un créneau | Slot length |
| `expert.avail.slot.hint` | Chaque plage ouverte est découpée en créneaux de cette durée. | Each open range is cut into slots of this length. |
| `expert.avail.window.start` | Réservable à partir du | Bookable from |
| `expert.avail.window.end` | Réservable jusqu'au | Bookable until |
| `expert.avail.window.days` | Les clients peuvent réserver sur {count} jours (maximum {max}). | Customers can book {count} days ahead (up to {max}). |
| `expert.avail.window.max` | La période ne peut pas dépasser {max} jours. | The window can be at most {max} days. |
| `expert.avail.window.reset` | 60 prochains jours | Next 60 days |
| `expert.avail.window.order` | La date de fin doit être postérieure ou égale à la date de début. | The end date must be on or after the start date. |
| `expert.avail.window.long` | Choisissez une période de {max} jours maximum. | Choose a window of {max} days or fewer. |
| `expert.avail.weekly` | Horaires hebdomadaires | Weekly hours |
| `expert.avail.weekly.hint` | Les heures sont en {zone}. Ajoutez plusieurs plages dans une journée pour les pauses. | Times are in {zone}. Add several ranges to a day for breaks. |
| `expert.avail.closed` | Indisponible | Not available |
| `expert.avail.add` | Ajouter des heures | Add hours |
| `expert.avail.copy` | Copier vers d'autres jours | Copy to other days |
| `expert.avail.copy.title` | Copier {day} vers d'autres jours | Copy {day} to other days |
| `expert.avail.copy.hint` | Les horaires des jours choisis seront remplacés. | Hours on the days you choose will be replaced. |
| `expert.avail.copy.apply` | Copier les horaires | Copy hours |
| `expert.avail.from` | Heure de début | Start time |
| `expert.avail.to` | Heure de fin | End time |
| `expert.avail.issue.order` | L'heure de fin doit être après l'heure de début. | End time must be after start time. |
| `expert.avail.issue.overlap` | Cette plage chevauche une autre plage du même jour. | This range overlaps another range on the same day. |
| `expert.avail.issue.empty` | Saisissez l'heure de début et de fin. | Enter both a start and an end time. |
| `expert.avail.norules` | Aucun horaire pour l'instant. Enregistrer maintenant supprimera vos créneaux libres. | No weekly hours yet. Saving now will remove your open slots. |
| `expert.avail.save` | Enregistrer et mettre à jour les créneaux | Save and update slots |
| `expert.avail.saves_note` | Les séances réservées ne sont jamais modifiées. | Booked sessions are never changed. |
| `expert.avail.fix` | Corrigez les champs en surbrillance pour enregistrer. | Fix the highlighted fields to save. |
| `expert.avail.saved` | Disponibilités enregistrées | Availability saved |
| `expert.avail.preview` | 14 prochains jours | Next 14 days |
| `expert.avail.preview.hint` | Créneaux réservables par les clients, en {zone}. {count} créneaux créés. | Slots customers can book, in {zone}. {count} slots created. |
| `expert.avail.preview.empty` | Aucun créneau sous 14 jours. Vérifiez vos horaires et la période de réservation. | No slots in the next 14 days. Check your weekly hours and booking window. |
| `expert.slots.title` | Prochains créneaux | Upcoming slots |
| `expert.slots.hint` | Bloquez un créneau que vous ne pouvez pas assurer, ou supprimez-le. Heures en {zone}. | Block a slot you can't take, or remove it. Times in {zone}. |
| `expert.slots.range` | Période | Time range |
| `expert.slots.next` | {count} prochains jours | Next {count} days |
| `expert.slots.empty` | Aucun créneau sur cette période | No slots in this period |
| `expert.slots.empty.body` | Enregistrez vos horaires hebdomadaires pour créer des créneaux. | Save your weekly hours to create slots. |
| `expert.slots.status.available` | Libre | Open |
| `expert.slots.status.booked` | Réservé | Booked |
| `expert.slots.status.blocked` | Bloqué | Blocked |
| `expert.slots.block` | Bloquer | Block |
| `expert.slots.unblock` | Débloquer | Unblock |
| `expert.slots.view_booking` | Voir la réservation | View booking |
| `expert.slots.delete.title` | Supprimer ce créneau ? | Delete this slot? |
| `expert.slots.delete.action` | Supprimer le créneau | Delete slot |
| `expert.slots.deleted` | Créneau supprimé | Slot deleted |
| `expert.timeoff.title` | Congés | Time off |
| `expert.timeoff.hint` | Bloquez tous les créneaux libres sur une période. Les séances déjà réservées ne changent pas. | Block all open slots in a date range. Sessions already booked stay as they are. |
| `expert.timeoff.from` | Premier jour de congé | First day off |
| `expert.timeoff.to` | Dernier jour de congé | Last day off |
| `expert.timeoff.service` | Service | Service |
| `expert.timeoff.all` | Tous les services | All services |
| `expert.timeoff.zone` | Journées entières en {zone}. | Whole days in {zone}. |
| `expert.timeoff.action` | Bloquer ces dates | Block these dates |
| `expert.timeoff.confirm` | Bloquer du {from} au {to} ? | Block {from} to {to}? |
| `expert.timeoff.confirm.body` | Tous les créneaux libres ({scope}) de cette période seront bloqués (fuseau {zone}). Vous pourrez les débloquer un par un. | All open slots for {scope} in this range will be blocked (time zone {zone}). You can unblock them one by one. |
| `expert.timeoff.done` | {count} créneaux bloqués. | {count} slots blocked. |
| `expert.bookings.title` | Réservations | Bookings |
| `expert.bookings.subtitle` | Séances que les clients ont réservées et payées. | Sessions customers have booked and paid for. |
| `expert.bookings.tab.requests` | Demandes | Requests |
| `expert.bookings.tab.upcoming` | À venir | Upcoming |
| `expert.bookings.tab.past` | Passées | Past |
| `expert.bookings.empty.requests.title` | Aucune demande en attente | No requests to answer |
| `expert.bookings.empty.requests.body` | Les nouvelles réservations payées apparaîtront ici pour que vous les acceptiez. | New paid bookings appear here for you to accept. |
| `expert.bookings.empty.upcoming.title` | Aucune séance à venir | No upcoming sessions |
| `expert.bookings.empty.upcoming.body` | Les séances acceptées s'affichent ici jusqu'à leur fin. | Accepted sessions show up here until they end. |
| `expert.bookings.empty.past.title` | Aucune séance passée | No past sessions |
| `expert.bookings.empty.past.body` | Les séances terminées et annulées sont listées ici. | Completed and cancelled sessions are listed here. |
| `expert.bookings.status.new` | Nouvelle demande | New request |
| `expert.bookings.status.accepted` | Acceptée | Accepted |
| `expert.bookings.status.preparing` | En cours | In progress |
| `expert.bookings.status.completed` | Terminée | Completed |
| `expert.bookings.status.cancelled` | Annulée | Cancelled |
| `expert.bookings.session` | Séance | Session |
| `expert.bookings.customer` | Client | Customer |
| `expert.bookings.no_slot` | Aucun horaire défini | No time set |
| `expert.bookings.yours` | Votre heure | Your time |
| `expert.bookings.session_time` | Heure de la séance ({zone}) | Session time ({zone}) |
| `expert.bookings.your_time` | Heure de votre appareil ({zone}) | Your device time ({zone}) |
| `expert.bookings.accept` | Accepter | Accept |
| `expert.bookings.accepted` | Réservation acceptée | Booking accepted |
| `expert.bookings.complete` | Marquer comme terminée | Mark as completed |
| `expert.bookings.view` | Voir les détails | View details |
| `expert.bookings.overdue` | Répondez maintenant, la demande est en retard | Answer now, this request is overdue |
| `expert.bookings.respond_by` | Répondre avant {time} | Respond by {time} |
| `expert.bookings.exception` | À traiter | Needs attention |
| `expert.detail.title` | Réservation | Booking |
| `expert.detail.session` | Séance | Session |
| `expert.detail.price` | Prix | Price |
| `expert.detail.customer` | Client | Customer |
| `expert.detail.note` | Note du client | Note from the customer |
| `expert.detail.exception` | Cette réservation nécessite l'attention de Ciuna | This booking needs attention from Ciuna |
| `expert.detail.meeting` | Lien de réunion | Meeting link |
| `expert.detail.meeting.hint` | Le client le verra dès l'enregistrement. | The customer sees this once you save it. |
| `expert.detail.meeting.url` | Lien de réunion (https) | Meeting link (https) |
| `expert.detail.meeting.url.err` | Saisissez un lien commençant par https:// | Enter a link that starts with https:// |
| `expert.detail.meeting.instructions` | Instructions pour le client | Instructions for the customer |
| `expert.detail.meeting.save` | Enregistrer les détails | Save meeting details |
| `expert.detail.meeting.saved` | Détails enregistrés | Meeting details saved |
| `expert.detail.meeting.open` | Ouvrir le lien actuel | Open current link |
| `expert.detail.reject` | Refuser | Decline |
| `expert.detail.reject.title` | Refuser cette réservation ? | Decline this booking? |
| `expert.detail.reject.body` | Le client est remboursé intégralement et informé du motif. Cette action est irréversible. | The customer is refunded in full and told why. This can't be undone. |
| `expert.detail.reject.reason` | Motif du refus | Reason for declining |
| `expert.detail.reject.confirm` | Refuser la réservation | Decline booking |
| `expert.detail.fulfill` | Marquer comme terminée | Mark as completed |
| `expert.detail.fulfill.wait` | Vous pourrez terminer cette séance après sa fin, à {time}. | You can complete this session after it ends at {time}. |
| `expert.detail.fulfill.title` | Marquer cette séance comme terminée ? | Mark this session as completed? |
| `expert.detail.fulfill.body` | Cela confirme que la séance a eu lieu et déclenche votre paiement. | This confirms the session took place and starts your payout. |
| `expert.detail.fulfill.note` | Note sur la séance | Note about the session |
| `expert.detail.done.accept` | Réservation acceptée | Booking accepted |
| `expert.detail.done.reject` | Réservation refusée et remboursée | Booking declined and refunded |
| `expert.detail.done.fulfill` | Séance marquée comme terminée | Session marked as completed |
| `errors.SERVICE_INVALID` | Vérifiez les informations du service et réessayez. | Check the service details and try again. |
| `errors.HAS_FUTURE_BOOKINGS` | Ce service a {count} séances réservées à venir. Terminez-les ou refusez-les d'abord, puis dépubliez. | This service has {count} upcoming booked sessions. Complete or decline them first, then unpublish. |
| `errors.SLOT_BOOKED` | Ce créneau est déjà réservé et ne peut pas être modifié. | This slot is already booked, so it can't be changed. |
| `errors.SLOT_NOT_EDITABLE` | Ce créneau ne peut pas être modifié. | This slot can't be changed. |
| `errors.SLOT_NOT_FOUND` | Ce créneau n'existe plus. Actualisez la liste. | This slot no longer exists. Refresh the list. |
| `errors.SLOT_OVERLAP` | Cet horaire chevauche un créneau existant. | This time overlaps an existing slot. |
| `errors.SLOT_IN_PAST` | Choisissez un horaire dans le futur. | Choose a time in the future. |
| `errors.WINDOW_TOO_LONG` | La période de réservation ne peut pas dépasser {maxDays} jours. | The booking window can be at most {maxDays} days. |
| `errors.WINDOW_INVALID` | Saisissez des dates de début et de fin valides. | Enter a valid start and end date. |
| `errors.WINDOW_ORDER` | La date de fin doit être postérieure ou égale à la date de début. | The end date must be on or after the start date. |
| `errors.RULE_TIME_ORDER` | Chaque plage doit se terminer après son début. | Each range must end after it starts. |
| `errors.TIMEZONE_INVALID` | Choisissez un fuseau horaire valide. | Choose a valid time zone. |
| `errors.RANGE_ORDER` | La date de fin doit être après la date de début. | The end date must be after the start date. |
| `errors.RANGE_TOO_LONG` | Choisissez une période de {maxDays} jours maximum. | Choose a range of {maxDays} days or fewer. |
| `errors.SCHEDULE_REQUIRED` | Enregistrez d'abord vos horaires hebdomadaires. | Save your weekly hours first. |
| `errors.EXPERT_ONLY` | Ceci est réservé aux comptes experts. | This is only available to expert accounts. |
| `errors.EXPERT_PROFILE_NOT_FOUND` | Votre profil d'expert n'est pas encore configuré. Terminez d'abord la configuration. | Your expert profile isn't set up yet. Finish setup first. |
| `errors.SERVICE_NOT_FOUND` | Ce service n'existe plus. | This service no longer exists. |
| `errors.MEETING_URL_INVALID` | Saisissez un lien commençant par https:// | Enter a link that starts with https:// |
| `errors.MEETING_EMPTY` | Ajoutez un lien de réunion ou des instructions. | Add a meeting link or instructions. |
| `errors.BOOKING_CLOSED` | Cette réservation est clôturée ; les détails ne peuvent plus être modifiés. | This booking is closed, so meeting details can't be changed. |
| `errors.BOOKING_NOT_PAID` | Cette réservation n'est pas encore payée. | This booking isn't paid yet. |

### `seller/locales/fr/home.json` (13 strings)

| Key | Text | English source |
| --- | --- | --- |
| `home.welcome` | Bienvenue, {name} | Welcome, {name} |
| `home.setup.body` | Terminez ces étapes et Ciuna examinera votre activité. | Finish these steps and Ciuna will review your business. |
| `home.live.body` | Ce qui demande votre attention aujourd'hui. | What needs your attention today. |
| `home.setup.title` | Préparez-vous à vendre | Get ready to sell |
| `home.newOrders` | Nouvelles commandes | New orders |
| `home.newBookings` | Nouvelles demandes de réservation | New booking requests |
| `home.needsAction` | En attente de votre acceptation | Waiting for you to accept |
| `home.inProgress` | En cours | In progress |
| `more.storeProfile` | Profil de la boutique | Store profile |
| `more.expertProfile` | Profil d'expert | Expert profile |
| `more.verification` | Vérification et documents | Verification and documents |
| `more.fulfillment` | Retrait et livraison | Pickup and delivery |
| `more.team` | Équipe | Team |

### `seller/locales/fr/messages.json` (33 strings)

| Key | Text | English source |
| --- | --- | --- |
| `messages.title` | Messages | Messages |
| `messages.subtitle` | Discutez avec vos clients de leurs commandes. Répondez vite pour que tout avance. | Chat with customers about their orders. Reply quickly to keep orders moving. |
| `messages.noAccess.title` | Vous n'avez pas accès aux messages | You don't have access to messages |
| `messages.noAccess.body` | Demandez au propriétaire de l'entreprise de vous donner l'autorisation Messages. | Ask the business owner to give you the messages permission. |
| `messages.empty.title` | Aucun message pour l'instant | No messages yet |
| `messages.empty.body` | Quand un client écrit à propos d'une commande, la conversation apparaît ici. | When a customer writes about an order, the conversation appears here. |
| `messages.customer` | Client | Customer |
| `messages.you` | Vous | You |
| `messages.unread` | {count} non lus | {count} unread |
| `messages.closed.chip` | Discussion fermée | Chat closed |
| `messages.back` | Tous les messages | All messages |
| `messages.viewOrder` | Voir la commande | View order |
| `messages.history` | Conversation | Conversation |
| `messages.thread.empty` | Aucun message dans cette discussion. Dites bonjour ci-dessous. | No messages in this chat yet. Say hello below. |
| `messages.closed.title` | Cette discussion est fermée | This chat is closed |
| `messages.closed.body` | Les discussions se ferment 14 jours après la fin ou l'annulation d'une commande. Vous pouvez toujours consulter l'historique. | Chats close 14 days after an order is completed or cancelled. You can still see the history. |
| `messages.unavailable.title` | Discussion indisponible | Chat isn't available |
| `messages.unavailable.body` | La discussion s'ouvre une fois la commande payée par le client. | Chat opens once the customer has paid for the order. |
| `messages.composer.label` | Message | Message |
| `messages.composer.placeholder` | Écrivez un message | Write a message |
| `messages.composer.closed` | Discussion fermée | Chat is closed |
| `messages.send` | Envoyer | Send |
| `messages.seen` | Lu | Seen |
| `messages.quick.label` | Réponses rapides | Quick replies |
| `messages.quick.preparing` | Votre commande est en préparation. | Your order is being prepared. |
| `messages.quick.delivery` | Nous livrerons dans l'heure. | We will deliver within the hour. |
| `messages.quick.thanks` | Merci pour votre commande ! | Thank you for your order! |
| `messages.quick.question` | Pouvez-vous confirmer votre adresse, s'il vous plaît ? | Could you confirm your address, please? |
| `errors.CHAT_CLOSED` | Cette discussion est fermée, le message n'a pas été envoyé. | This chat is closed, so the message was not sent. |
| `errors.RATE_LIMITED` | Vous envoyez trop de messages. Patientez un peu, puis réessayez. | You're sending messages too fast. Wait a little and try again. |
| `errors.MESSAGE_EMPTY` | Écrivez un message avant d'envoyer. | Write a message before sending. |
| `errors.MESSAGE_TOO_LONG` | Ce message est trop long. Limitez-vous à 2000 caractères. | That message is too long. Keep it under 2000 characters. |
| `errors.CHAT_UNAVAILABLE` | La discussion n'est pas disponible pour cette commande. | Chat isn't available for this order. |

### `seller/locales/fr/orders.json` (89 strings)

| Key | Text | English source |
| --- | --- | --- |
| `orders.title` | Commandes | Orders |
| `orders.subtitle` | Les nouvelles commandes apparaissent ici. Acceptez vite pour limiter l'attente des clients. | New orders appear here. Accept quickly to keep customers waiting less. |
| `orders.tab.new` | Nouvelles | New |
| `orders.tab.active` | En cours | In progress |
| `orders.tab.done` | Terminées | Completed |
| `orders.tab.cancelled` | Annulées | Cancelled |
| `orders.empty.new.title` | Aucune nouvelle commande | No new orders |
| `orders.empty.new.body` | Les nouvelles commandes apparaissent ici dès que les clients paient. | New orders show up here as soon as customers pay. |
| `orders.empty.active.title` | Rien en cours | Nothing in progress |
| `orders.empty.active.body` | Les commandes acceptées apparaissent ici jusqu'à ce que vous les marquiez comme traitées. | Orders you accept appear here until you mark them fulfilled. |
| `orders.empty.done.title` | Aucune commande terminée | No completed orders yet |
| `orders.empty.done.body` | Les commandes traitées seront listées ici. | Fulfilled orders will be listed here. |
| `orders.empty.cancelled.title` | Aucune commande annulée | No cancelled orders |
| `orders.empty.cancelled.body` | Les commandes refusées et annulées seront listées ici. | Rejected and cancelled orders will be listed here. |
| `orders.noAccess.title` | Vous n'avez pas accès aux commandes | You don't have access to orders |
| `orders.noAccess.body` | Demandez au propriétaire de l'entreprise de vous donner l'autorisation Commandes. | Ask the business owner to give you the orders permission. |
| `orders.number` | Commande {id} | Order {id} |
| `orders.moreItems` | +{count} autre(s) | +{count} more |
| `orders.mode.delivery` | Livraison | Delivery |
| `orders.mode.pickup` | Retrait | Pickup |
| `orders.mode.digital` | Numérique | Digital |
| `orders.mode.booking` | Réservation | Booking |
| `orders.due.in` | À traiter dans {time} | Due in {time} |
| `orders.due.overdue` | En retard de {time} | Overdue by {time} |
| `orders.duration.hm` | {h} h {m} min | {h} h {m} min |
| `orders.duration.m` | {m} min | {m} min |
| `orders.status.new` | Nouvelle | New |
| `orders.status.accepted` | Acceptée | Accepted |
| `orders.status.preparing` | En préparation | Preparing |
| `orders.status.completed` | Terminée | Completed |
| `orders.status.cancelled` | Annulée | Cancelled |
| `orders.action.accept` | Accepter | Accept |
| `orders.action.start` | Commencer la préparation | Start preparing |
| `orders.action.fulfill` | Marquer comme traitée | Mark as fulfilled |
| `orders.action.reject` | Refuser | Reject |
| `orders.view` | Voir la commande | View order |
| `orders.back` | Retour aux commandes | Back to orders |
| `orders.toast.newOrder` | Nouvelle commande | New order |
| `orders.toast.accept` | Commande {id} acceptée | Order {id} accepted |
| `orders.toast.start` | Commande {id} en préparation | Order {id} is being prepared |
| `orders.toast.fulfill` | Commande {id} marquée comme traitée | Order {id} marked as fulfilled |
| `orders.toast.reject` | Commande {id} refusée | Order {id} rejected |
| `orders.items` | Articles | Items |
| `orders.col.item` | Article | Item |
| `orders.col.qty` | Qté | Qty |
| `orders.col.unit` | Prix unitaire | Unit price |
| `orders.col.total` | Total | Total |
| `orders.subtotal` | Sous-total | Subtotal |
| `orders.deliveryFee` | Frais de livraison | Delivery fee |
| `orders.total` | Total | Total |
| `orders.note` | Note du client | Customer note |
| `orders.slot` | Horaire de la réservation | Booking time |
| `orders.slot.timezone` | Heures affichées en {tz} | Times shown in {tz} |
| `orders.digital` | Contenu numérique | Digital content |
| `orders.digital.hint` | Voici ce que vous avez envoyé au client. | This is what you sent to the customer. |
| `orders.customer` | Client | Customer |
| `orders.customer.unknown` | Nom non renseigné | Name not provided |
| `orders.pickup` | Retrait | Pickup |
| `orders.pickup.hours` | Horaires de retrait : {hours} | Pickup hours: {hours} |
| `orders.deliveryTo` | Livrer à | Deliver to |
| `orders.location` | Lieu | Location |
| `orders.noAddress` | Aucune adresse renseignée | No address provided |
| `orders.timeline` | Historique | Timeline |
| `orders.timeline.empty` | Aucune activité pour le moment. | No activity yet. |
| `orders.exception.title` | Cette commande demande votre attention | This order needs attention |
| `orders.reject.title` | Refuser cette commande ? | Reject this order? |
| `orders.reject.body` | Le client sera intégralement remboursé. Il verra votre motif. | The customer will be refunded in full. They will see your reason. |
| `orders.reject.reason` | Motif | Reason |
| `orders.reject.placeholder` | Expliquez au client pourquoi, par exemple : rupture de stock | Tell the customer why, for example: out of stock |
| `orders.reject.confirm` | Refuser la commande | Reject order |
| `orders.fulfill.title` | Marquer cette commande comme traitée ? | Mark this order as fulfilled? |
| `orders.fulfill.body` | Ajoutez une note pour le client, par exemple ce qui a été remis. | Add a note for the customer, such as what was delivered. |
| `orders.fulfill.bodyDigital` | Ajoutez le contenu que le client reçoit, ainsi qu'une note. | Add the content the customer receives, and a note. |
| `orders.fulfill.note` | Note pour le client | Note for the customer |
| `orders.fulfill.noteHint` | Obligatoire. Au moins une phrase. | Required. At least one sentence. |
| `orders.fulfill.content` | Contenu numérique | Digital content |
| `orders.fulfill.contentHint` | Codes, liens ou instructions. Le client le voit. | Codes, links or instructions. The customer sees this. |
| `orders.fulfill.confirm` | Marquer comme traitée | Mark as fulfilled |
| `errors.INVALID_TRANSITION` | Cette commande a changé. Actualisez et réessayez. | Something about this order changed. Refresh and try again. |
| `errors.REJECT_NOT_ALLOWED` | Cette commande ne peut plus être refusée. Contactez le support. | This order can't be rejected now. Contact support. |
| `errors.REASON_REQUIRED` | Saisissez un motif d'au moins 3 caractères. | Enter a reason of at least 3 characters. |
| `errors.CONTACT_SUPPORT` | Cette commande nécessite l'aide du support Ciuna. Contactez-le pour continuer. | This order needs Ciuna support. Contact support to continue. |
| `errors.DELIVERY_CONTENT_REQUIRED` | Ajoutez le contenu numérique avant de marquer la commande comme traitée. | Add the digital content before marking this order fulfilled. |
| `errors.NOTE_REQUIRED` | Ajoutez une note pour le client. | Add a note for the customer. |
| `errors.SESSION_NOT_ENDED` | Vous pouvez marquer une réservation comme traitée une fois la séance terminée. | You can mark a booking fulfilled after the session has ended. |
| `errors.ORDER_NOT_FOUND` | Nous n'avons pas trouvé cette commande. | We couldn't find this order. |
| `errors.INVALID_ACTION` | Cette action n'est pas disponible. | That action isn't available. |
| `errors.UNAVAILABLE` | Impossible de joindre Ciuna. Vérifiez votre connexion et réessayez. | We couldn't reach Ciuna. Check your connection and try again. |
| `orders.messageCustomer` | Écrire au client | Message the customer |

### `seller/locales/fr/reviews.json` (32 strings)

| Key | Text | English source |
| --- | --- | --- |
| `reviews.title` | Avis | Reviews |
| `reviews.subtitle` | Ce que les clients disent de vos commandes. | What customers say about your orders. |
| `reviews.nav` | Avis | Reviews |
| `reviews.stars` | {n} sur 5 | {n} out of 5 |
| `reviews.starsShort` | {n} étoiles | {n} stars |
| `reviews.count` | {count} avis | {count} reviews |
| `reviews.count.one` | 1 avis | 1 review |
| `reviews.distribution` | Avis par note | Reviews by star rating |
| `reviews.customer` | Client | Customer |
| `reviews.noText` | Aucun commentaire écrit. | No written review. |
| `reviews.yourReply` | Votre réponse | Your reply |
| `reviews.reply` | Répondre | Reply |
| `reviews.editReply` | Modifier la réponse | Edit reply |
| `reviews.reply.public` | Votre réponse est publique. | Your reply is public. |
| `reviews.reply.label` | Réponse | Reply |
| `reviews.reply.editWindow` | Vous pouvez modifier cette réponse pendant 24 heures après sa publication. | You can edit this reply for 24 hours after posting. |
| `reviews.reply.counter` | {used} / {max} | {used} / {max} |
| `reviews.reply.send` | Publier la réponse | Post reply |
| `reviews.reply.sent` | Réponse publiée. | Reply posted. |
| `reviews.tab.all` | Tous | All |
| `reviews.tab.needsReply` | À répondre | Needs reply |
| `reviews.empty.title` | Aucun avis pour l'instant | No reviews yet |
| `reviews.empty.body` | Les clients peuvent donner leur avis une fois la commande exécutée. Les avis apparaissent ici. | Customers can review an order after it is fulfilled. Reviews show up here. |
| `reviews.empty.caughtUp.title` | Vous êtes à jour | You're all caught up |
| `reviews.empty.caughtUp.body` | Chaque avis a une réponse. | Every review has a reply. |
| `reviews.more` | Afficher plus | Show more |
| `reviews.noAccess.title` | Vous n'avez pas accès aux avis | You don't have access to reviews |
| `reviews.noAccess.body` | Demandez au propriétaire de l'entreprise de vous donner l'autorisation sur les commandes. | Ask the business owner to give you the orders permission. |
| `errors.REPLY_REQUIRED` | Écrivez une réponse. | Write a reply. |
| `errors.REPLY_TOO_LONG` | La réponse ne doit pas dépasser 600 caractères. | Keep the reply to 600 characters. |
| `errors.REPLY_LOCKED` | Cette réponse ne peut plus être modifiée. | This reply can no longer be edited. |
| `errors.REVIEW_NOT_FOUND` | Nous n'avons pas trouvé cet avis. | We couldn't find that review. |

### `seller/locales/fr/settings.json` (49 strings)

| Key | Text | English source |
| --- | --- | --- |
| `profile.subtitle` | Ce que les clients voient sur votre page. | What customers see on your page. |
| `profile.basics` | Informations de base | Basics |
| `profile.description` | Description | Description |
| `profile.description.hint` | Présentez-vous aux clients et décrivez votre offre. Obligatoire dans votre langue par défaut. | Tell customers who you are and what you offer. Required in your default language. |
| `profile.images` | Images | Images |
| `profile.cover.upload` | Téléverser l'image de couverture | Upload cover image |
| `profile.contact` | Contact et région | Contact and region |
| `profile.phone` | Téléphone | Phone |
| `profile.website` | Site web | Website |
| `profile.currency` | Devise par défaut | Default currency |
| `team.title` | Équipe | Team |
| `team.subtitle` | Les personnes qui peuvent se connecter à cette activité. | People who can sign in to this business. |
| `team.invite` | Inviter une personne | Invite a person |
| `team.invite.cta` | Envoyer l'invitation | Send invite |
| `team.invite.link` | Lien d'invitation | Invite link |
| `team.invite.copied` | Lien copié | Link copied |
| `team.pending` | Invitations en attente | Pending invites |
| `team.remove.q` | Retirer cette personne ? | Remove this person? |
| `team.remove` | Retirer | Remove |
| `team.you` | Vous | You |
| `team.role.hint` | Les responsables gèrent le travail au quotidien. L'équipe traite les commandes et les annonces. La finance consulte les revenus et les versements. | Managers run daily work. Staff handle orders and listings. Finance sees earnings and payouts. |
| `errors.TOO_MANY_INVITES` | Trop d'invitations en attente. Annulez-en quelques-unes d'abord. | Too many open invites. Cancel some first. |
| `errors.ROLE_INVALID` | Choisissez un rôle. | Choose a role. |
| `errors.OWNER_IMMUTABLE` | Le propriétaire ne peut être ni modifié ni retiré. | The owner can't be changed or removed. |
| `errors.CANNOT_CHANGE_SELF` | Vous ne pouvez pas modifier votre propre rôle. | You can't change your own role. |
| `errors.INVITE_INVALID` | Cette invitation n'est pas valide ou a expiré. | This invite is invalid or has expired. |
| `errors.INVITE_EMAIL_MISMATCH` | Connectez-vous avec l'adresse e-mail qui a reçu l'invitation. | Sign in with the email address that was invited. |
| `team.role` | Rôle | Role |
| `notif.title` | Alertes | Alerts |
| `notif.subtitle` | Soyez prévenu dès qu'une commande ou une réservation vous attend. | Get told the moment an order or booking needs you. |
| `notif.channels` | Où envoyer les alertes | Where to send alerts |
| `notif.email` | E-mail | Email |
| `notif.email.body` | Un court message sur l'e-mail de votre compte. | A short message to your account email. |
| `notif.telegram.body` | Messages instantanés dans Telegram. Liez votre compte pour l'activer. | Instant messages in Telegram. Link your account to turn this on. |
| `notif.telegram.linked` | Connecté {name} | Connected {name} |
| `notif.telegram.connect` | Connecter Telegram | Connect Telegram |
| `notif.telegram.disconnect` | Déconnecter | Disconnect |
| `notif.telegram.open` | Terminez dans Telegram | Finish in Telegram |
| `notif.telegram.openLink` | Ouvrez Telegram et appuyez sur Start | Open Telegram and press Start |
| `notif.telegram.unavailable` | Les alertes Telegram ne sont pas encore disponibles. Les e-mails fonctionnent. | Telegram alerts are not available yet. Email alerts still work. |
| `notif.kinds` | Quoi signaler | What to alert |
| `notif.kinds.body` | Désactivez les alertes inutiles. | Turn off alerts you don't need. |
| `notif.kind.order_new` | Nouvelles commandes | New orders |
| `notif.kind.booking_new` | Nouvelles demandes de réservation | New booking requests |
| `notif.kind.payout_update` | Suivi des versements | Payout updates |
| `notif.kind.merchant_status` | Changements de votre dossier | Changes to your application |
| `more.alerts` | Alertes | Alerts |
| `more.payoutMethods` | Moyens de versement | Payout methods |
| `notif.kind.message_new` | Nouveaux messages des clients | New customer messages |

### `seller/locales/fr/setup.json` (61 strings)

| Key | Text | English source |
| --- | --- | --- |
| `onb.title` | Configurez votre activité | Set up your business |
| `onb.subtitle` | Dites-nous ce que vous vendez. Vous pourrez modifier la plupart de ces informations plus tard. | Tell us what you sell. You can change most of this later. |
| `onb.type` | Que souhaitez-vous faire sur Ciuna ? | What do you want to do on Ciuna? |
| `onb.type.store` | Vendre des produits | Sell products |
| `onb.type.store.body` | Repas, produits alimentaires et articles, livrés ou à retirer sur place. | Food, groceries and goods, delivered or picked up. |
| `onb.type.expert` | Proposer mon expertise | Offer my expertise |
| `onb.type.expert.body` | Traduction, aide juridique, soutien scolaire et autres services, réservés par créneau. | Translation, legal help, tutoring and other services, booked by time. |
| `onb.name.store` | Nom de la boutique | Store name |
| `onb.name.expert` | Votre nom ou le nom de votre cabinet | Your name or practice name |
| `onb.line` | Rubrique de la place de marché | Marketplace section |
| `onb.line.hint` | C'est là que les clients vous trouveront. | Where customers will find you. |
| `onb.line.food` | Restauration | Food |
| `onb.line.mart` | Mart (produits alimentaires et articles) | Mart (groceries and goods) |
| `onb.country` | Dans quel pays votre activité est-elle établie ? | Where is your business based? |
| `onb.country.hint` | Cela détermine les documents de vérification que nous vous demandons. | This decides which verification documents we ask for. |
| `onb.operating` | Où vendez-vous ou livrez-vous ? | Where do you sell or deliver? |
| `onb.operating.hint` | Les clients de ces zones verront vos annonces. | Customers there will see your listings. |
| `onb.languages` | Langues dans lesquelles vous servez vos clients | Languages you serve customers in |
| `onb.languages.hint` | Choisissez-en au moins une. Vous rédigez vos annonces dans ces langues. | Choose at least one. You write your listings in these languages. |
| `onb.invite` | Vous êtes invité à rejoindre {name} | You are invited to join {name} |
| `onb.invite.accept` | Rejoindre | Join |
| `setup.title` | Configuration et vérification | Set up and verify |
| `setup.subtitle` | Terminez ces étapes. Ciuna examine votre activité avant sa mise en ligne. | Complete these steps. Ciuna reviews your business before you go live. |
| `setup.done` | Terminé | Done |
| `setup.todo` | À faire | To do |
| `setup.optional` | Facultatif | Optional |
| `setup.approved` | Votre activité est approuvée | Your business is approved |
| `setup.item.profile` | Profil de l'activité | Business profile |
| `setup.item.logo` | Logo | Logo |
| `setup.item.tier` | Choisir le type de vérification | Choose verification type |
| `setup.item.kyb_fields` | Informations de vérification | Verification details |
| `setup.item.kyb_documents` | Documents de vérification | Verification documents |
| `setup.item.first_listing` | Première annonce | First listing |
| `setup.profile.body` | Ajoutez votre description dans votre langue principale et vos coordonnées. | Add your description in your main language and contact details. |
| `setup.profile.cta` | Modifier le profil | Edit profile |
| `setup.logo.upload` | Téléverser le logo | Upload logo |
| `setup.verify.title` | Vérification | Verification |
| `setup.verify.body` | Les documents demandés varient selon le pays où votre activité est établie. | We ask for different documents depending on where your business is based. |
| `setup.verify.tier` | Type de vérification | Verification type |
| `setup.tier1.body` | Pour les particuliers et les vendeurs indépendants. Plafonds réduits. | For individuals and self-employed sellers. Lower limits. |
| `setup.tier2.body` | Pour les entreprises immatriculées. Plafonds complets. | For registered companies. Full limits. |
| `setup.docs.title` | Documents | Documents |
| `doc.pending` | En cours d'examen | In review |
| `doc.approved` | Approuvé | Approved |
| `doc.rejected` | Refusé | Rejected |
| `doc.expired` | Expiré | Expired |
| `setup.listing.store` | Ajoutez votre premier produit | Add your first product |
| `setup.listing.expert` | Ajoutez votre premier service | Add your first service |
| `setup.listing.body` | Enregistrez-le dès maintenant comme brouillon. Vous pourrez le publier une fois votre activité approuvée par Ciuna. | Save it as a draft now. You can publish once Ciuna approves your business. |
| `setup.listing.addProduct` | Ajouter un produit | Add product |
| `setup.listing.addService` | Ajouter un service | Add service |
| `setup.submit.title` | Envoyer pour examen | Submit for review |
| `setup.submit.ready` | Tout est prêt. Ciuna effectue généralement son examen sous un jour ouvré. | Everything is ready. Ciuna usually reviews within one business day. |
| `setup.submit.notReady` | Certaines étapes restent à faire. Vous pourrez envoyer votre demande une fois qu'elles seront terminées. | Some steps are still open. You can submit once they are done. |
| `setup.submit.cta` | Envoyer pour examen | Submit for review |
| `setup.submitted` | Envoyé pour examen | Submitted for review |
| `errors.APPLICATION_INCOMPLETE` | Certaines étapes restent à faire. Terminez-les, puis envoyez votre demande. | Some steps are still open. Complete them, then submit. |
| `errors.TIER_INVALID` | Choisissez un type de vérification. | Choose a verification type. |
| `errors.DOCUMENT_LOCKED` | Les documents approuvés ne peuvent pas être supprimés. | Approved documents can't be removed. |
| `errors.PATH_INVALID` | Ce téléversement n'est pas valide. Réessayez. | That upload isn't valid. Try again. |
| `errors.EXPIRY_INVALID` | Indiquez une date d'expiration future. | Use a future expiry date. |

### `seller/locales/es/auth.json` (18 strings)

| Key | Text | English source |
| --- | --- | --- |
| `auth.login.title` | Iniciar sesión en Ciuna Seller | Sign in to Ciuna Seller |
| `auth.login.subtitle` | Use su cuenta de Ciuna. ¿Es nuevo en Ciuna? Cree una cuenta en un minuto. | Use your Ciuna account. New to Ciuna? Create one in a minute. |
| `auth.login.cta` | Iniciar sesión | Sign in |
| `auth.register.title` | Empiece a vender en Ciuna | Start selling on Ciuna |
| `auth.register.subtitle` | Llegue a las personas que viven en el extranjero y buscan lo que usted ofrece. | Reach people living abroad who are looking for what you offer. |
| `auth.register.cta` | Crear cuenta | Create account |
| `auth.noAccount` | ¿Aún no tiene cuenta? | No account yet? |
| `auth.haveAccount` | ¿Ya tiene una cuenta? | Already have an account? |
| `auth.email` | Correo electrónico | Email |
| `auth.password` | Contraseña | Password |
| `auth.passwordHint` | Al menos 8 caracteres. | At least 8 characters. |
| `auth.passwordShort` | La contraseña debe tener al menos 8 caracteres. | Use at least 8 characters for your password. |
| `auth.firstName` | Nombre | First name |
| `auth.lastName` | Apellidos | Last name |
| `auth.invalid` | El correo electrónico o la contraseña no son correctos. | Email or password is incorrect. |
| `auth.exists` | Ya existe una cuenta con este correo. Inicie sesión. | An account with this email already exists. Sign in instead. |
| `auth.checkEmail.title` | Revise su correo | Check your email |
| `auth.checkEmail.body` | Enviamos un enlace de confirmación a {email}. Ábralo y después inicie sesión. | We sent a confirmation link to {email}. Open it, then sign in. |

### `seller/locales/es/catalog.json` (147 strings)

| Key | Text | English source |
| --- | --- | --- |
| `catalog.title` | Catálogo | Catalog |
| `catalog.intro` | Todo lo que vendes. Los cambios de precio y stock se aplican al instante. | Everything you sell. Edits to prices and stock apply straight away. |
| `catalog.back` | Volver al catálogo | Back to catalog |
| `catalog.search` | Buscar productos | Search products |
| `catalog.new.title` | Añadir producto | Add product |
| `catalog.edit.title` | Editar producto | Edit product |
| `catalog.action.add` | Añadir producto | Add product |
| `catalog.action.import` | Importar desde CSV | Import from CSV |
| `catalog.action.pause` | Pausar | Pause |
| `catalog.action.publish` | Publicar | Publish |
| `catalog.action.saveDraft` | Guardar como borrador | Save as draft |
| `catalog.action.moveToDraft` | Pasar a borrador | Move to draft |
| `catalog.action.saveChanges` | Guardar cambios | Save changes |
| `catalog.action.archive` | Archivar producto | Archive product |
| `catalog.link.fulfilment` | Zonas de entrega y recogida | Delivery zones and pickup |
| `catalog.tab.all` | Todos | All |
| `catalog.tab.live` | Publicados | Live |
| `catalog.tab.draft` | Borradores | Draft |
| `catalog.tab.archived` | Archivados | Archived |
| `catalog.status.draft` | Borrador | Draft |
| `catalog.status.live` | Publicado | Live |
| `catalog.status.archived` | Archivado | Archived |
| `catalog.stock.count` | {n} en stock | {n} in stock |
| `catalog.stock.unlimited` | Ilimitado | Unlimited |
| `catalog.stock.soldOut` | Agotado | Sold out |
| `catalog.stock.soldOutToggle` | Marcar {title} como agotado | Mark {title} as sold out |
| `catalog.review.pending` | En revisión | Under review |
| `catalog.review.rejected` | Rechazado: {note} | Rejected: {note} |
| `catalog.empty.title` | Aún no hay productos | No products yet |
| `catalog.empty.body` | Añade tu primer producto o importa varios a la vez desde un archivo CSV. | Add your first product, or import many at once from a CSV file. |
| `catalog.empty.noMatch` | Ningún producto coincide. | No products match. |
| `catalog.toast.savedDraft` | Guardado como borrador | Saved as draft |
| `catalog.toast.published` | Publicado | Published |
| `catalog.toast.paused` | En pausa | Paused |
| `catalog.toast.archived` | Producto archivado | Product archived |
| `catalog.toast.soldOutOn` | Marcado como agotado | Marked as sold out |
| `catalog.toast.soldOutOff` | De nuevo en stock | Back in stock |
| `catalog.toast.fulfilmentSaved` | Entrega y recogida guardadas | Fulfilment saved |
| `catalog.form.moderationHint` | Los cambios en textos y fotos se publican al instante. Ciuna los revisa después y puede pedirte que los corrijas. | Changes to text and photos go live straight away. Ciuna reviews them afterwards and may ask you to fix them. |
| `catalog.form.publishLater` | Podrás publicar cuando Ciuna apruebe tu negocio. | You can publish once Ciuna approves your business. |
| `catalog.form.unsaved` | Tienes cambios sin guardar. | You have unsaved changes. |
| `catalog.form.fixErrors` | Revisa los campos resaltados. | Check the highlighted fields. |
| `catalog.section.basics` | Datos básicos | Basics |
| `catalog.section.photos` | Fotos | Photos |
| `catalog.section.price` | Precio | Price |
| `catalog.section.stock` | Stock | Stock |
| `catalog.section.fulfilment` | Entrega del pedido | Fulfilment |
| `catalog.lang.defaultHint` | Idioma predeterminado. Se muestra cuando el idioma del cliente no está completado. | Default language. This is shown when a customer's language isn't filled in. |
| `catalog.lang.otherHint` | Opcional. Déjalo vacío para mostrar tu idioma predeterminado. | Optional. Leave blank to show your default language. |
| `catalog.field.title` | Nombre | Name |
| `catalog.field.short` | Descripción corta | Short description |
| `catalog.field.shortHint` | Se muestra en las listas. Hasta 300 caracteres. | Shown in lists. Up to 300 characters. |
| `catalog.field.long` | Descripción completa | Full description |
| `catalog.field.category` | Categoría | Category |
| `catalog.field.listPrice` | Precio | Price |
| `catalog.field.salePrice` | Precio de oferta | Sale price |
| `catalog.field.salePriceHint` | Opcional. Debe ser menor que el precio. | Optional. Must be lower than the price. |
| `catalog.field.currency` | Moneda | Currency |
| `catalog.field.unlimited` | Stock ilimitado | Unlimited stock |
| `catalog.field.stock` | Cantidad en stock | Quantity in stock |
| `catalog.field.soldOut` | Agotado | Sold out |
| `catalog.field.soldOutHint` | Los clientes no podrán pedirlo hasta que desactives esta opción. | Customers can't order it until you switch this off. |
| `catalog.cat.Meals` | Comidas | Meals |
| `catalog.cat.Snacks` | Snacks | Snacks |
| `catalog.cat.Drinks` | Bebidas | Drinks |
| `catalog.cat.Other` | Otros | Other |
| `catalog.cat.Groceries` | Alimentación | Groceries |
| `catalog.cat.Household` | Hogar | Household |
| `catalog.cat.Electronics` | Electrónica | Electronics |
| `catalog.photos.hint` | La primera foto es la principal. Añade hasta 8 más. | The first photo is the main one. Add up to 8 more. |
| `catalog.photos.main` | Foto principal | Main photo |
| `catalog.photos.addMain` | Añadir foto principal | Add main photo |
| `catalog.photos.add` | Añadir foto | Add photo |
| `catalog.photos.gallery` | Más fotos ({n} de 8) | More photos ({n} of 8) |
| `catalog.mode.delivery` | Entrega a domicilio | Delivery |
| `catalog.mode.pickup` | Recogida | Pickup |
| `catalog.mode.digital` | Digital | Digital |
| `catalog.mode.deliveryHint` | Entregas este producto al cliente. | You deliver this to the customer. |
| `catalog.mode.pickupHint` | El cliente lo recoge en tu punto de recogida. | The customer collects it from your pickup location. |
| `catalog.mode.digitalHint` | Se entrega en línea, no hay nada que enviar. | Delivered online, nothing to ship. |
| `catalog.archive.title` | ¿Archivar este producto? | Archive this product? |
| `catalog.archive.body` | Desaparecerá de la tienda. Los pedidos anteriores conservan sus datos y podrás encontrarlo en Archivados. | It will disappear from the store. Past orders keep their details, and you can still find it under Archived. |
| `catalog.fulfilment.title` | Entrega y recogida | Delivery and pickup |
| `catalog.fulfilment.intro` | Indica dónde recogen los clientes sus pedidos y a qué zonas entregas. Necesitas zonas de entrega para publicar productos con entrega y los datos de recogida para publicar productos con recogida. | Set where customers collect orders and which areas you deliver to. You need delivery zones to publish delivery products, and pickup details to publish pickup products. |
| `catalog.fulfilment.pickup` | Recogida | Pickup |
| `catalog.fulfilment.pickupHint` | Los clientes lo ven al elegir recogida. | Customers see this when they choose pickup. |
| `catalog.fulfilment.location` | Dirección de recogida | Pickup address |
| `catalog.fulfilment.hours` | Horario | Opening hours |
| `catalog.fulfilment.hoursHint` | Por ejemplo: lun. a sáb., de 9:00 a 20:00 | For example: Mon to Sat, 9:00 to 20:00 |
| `catalog.fulfilment.notes` | Notas para los clientes | Notes for customers |
| `catalog.fulfilment.zones` | Zonas de entrega | Delivery zones |
| `catalog.fulfilment.zonesHint` | Los clientes solo pueden pedir entrega en las zonas que añadas. | Customers can order delivery only in the zones you list. |
| `catalog.fulfilment.noZones` | Aún no hay zonas de entrega. | No delivery zones yet. |
| `catalog.fulfilment.city` | Ciudad | City |
| `catalog.fulfilment.district` | Barrio | District |
| `catalog.fulfilment.fee` | Coste de entrega | Delivery fee |
| `catalog.fulfilment.active` | Activa | Active |
| `catalog.fulfilment.inactive` | Inactiva | Inactive |
| `catalog.fulfilment.addZone` | Añadir zona | Add zone |
| `catalog.fulfilment.pickupMissing` | Añade tu dirección de recogida para publicar productos con recogida. | Add your pickup address to publish pickup products. |
| `catalog.fulfilment.zonesMissing` | Añade al menos una zona de entrega activa para publicar productos con entrega. | Add at least one active delivery zone to publish delivery products. |
| `catalog.fulfilment.setup` | Configurar | Set up |
| `catalog.import.title` | Importar productos | Import products |
| `catalog.import.intro` | Añade hasta 200 productos desde un archivo CSV. Se crean como borradores para que puedas revisarlos. | Add up to 200 products from a CSV file. They are created as drafts so you can check them first. |
| `catalog.import.step1` | 1. Descarga la plantilla | 1. Get the template |
| `catalog.import.step1Hint` | Un producto por fila. Hasta {max} filas. Usa punto o coma para los decimales. | Fill in one product per row. Up to {max} rows. Use a period or comma for decimals. |
| `catalog.import.template` | Descargar plantilla | Download template |
| `catalog.import.choose` | Elegir archivo CSV | Choose CSV file |
| `catalog.import.badFile` | No pudimos leer ese archivo. Usa la plantilla y revisa las columnas title y list_price. | We couldn't read that file. Use the template and check the title and list_price columns. |
| `catalog.import.step2` | 2. Revisa tus productos | 2. Check your products |
| `catalog.import.summary` | {file}: {valid} listos, {invalid} con problemas. Solo se importan las filas listas. | {file}: {valid} ready, {invalid} with problems. Only ready rows are imported. |
| `catalog.import.tooMany` | Solo se usan las primeras {max} de {total} filas. | Only the first {max} of {total} rows are used. |
| `catalog.import.lineUnknown` | Las categorías se comprueban al crear cada producto. | Categories are checked when each product is created. |
| `catalog.import.col.row` | Fila | Row |
| `catalog.import.col.status` | Estado | Status |
| `catalog.import.ready` | Listo | Ready |
| `catalog.import.progress` | {done} de {total} importados | {done} of {total} imported |
| `catalog.import.step3` | 3. Importar | 3. Import |
| `catalog.import.result` | {created} creados, {failed} con error. | {created} created, {failed} failed. |
| `catalog.import.draftNote` | Los productos creados son borradores. Ábrelos para añadir fotos y publícalos. | Created products are drafts. Open each one to add photos, then publish. |
| `catalog.import.failedRow` | Fila {line} ({title}): {reason} | Row {line} ({title}): {reason} |
| `catalog.import.another` | Importar otro archivo | Import another file |
| `catalog.import.viewCatalog` | Ver catálogo | View catalog |
| `catalog.import.start` | Importar {n} productos | Import {n} products |
| `catalog.import.finished` | Importación terminada | Import finished |
| `errors.PRODUCT_NOT_FOUND` | No encontramos ese producto. | We couldn't find that product. |
| `errors.STORE_ONLY` | Solo las tiendas pueden gestionar productos. | Only stores can manage products. |
| `errors.TITLE_REQUIRED` | Introduce un nombre de al menos 2 caracteres. | Enter a name with at least 2 characters. |
| `errors.PRICE_REQUIRED` | Introduce un precio mayor que 0. | Enter a price above 0. |
| `errors.SALE_PRICE_TOO_HIGH` | El precio de oferta debe ser menor que el precio. | The sale price must be lower than the price. |
| `errors.INVALID_STOCK` | Introduce un número entero igual o mayor que 0. | Enter a whole number of 0 or more. |
| `errors.CATEGORY_OUTSIDE_LINE` | Esa categoría no está disponible para tu tienda. | That category isn't available for your store. |
| `errors.FULFILLMENT_REQUIRED` | Elige entrega, recogida o digital. | Choose delivery, pickup or digital. |
| `errors.GALLERY_INVALID` | Usa hasta 8 fotos con enlaces https. | Use up to 8 photos with https links. |
| `errors.LISTING_REJECTED` | Este anuncio fue rechazado. Edita el texto o las fotos para enviarlo de nuevo. | This listing was rejected. Edit the text or photos to submit it again. |
| `errors.VENDOR_UNAVAILABLE` | Tu tienda no está disponible para los clientes en este momento. | Your store isn't available to customers right now. |
| `errors.PICKUP_CONFIGURATION_REQUIRED` | Añade tu dirección de recogida antes de publicar productos con recogida. | Add your pickup address before publishing pickup products. |
| `errors.DELIVERY_ZONE_REQUIRED` | Añade una zona de entrega antes de publicar productos con entrega. | Add a delivery zone before publishing delivery products. |
| `errors.PAYMENT_METHOD_REQUIRED` | Añade un método de pago antes de publicar. | Add a payment method before publishing. |
| `errors.VENDOR_REQUIRED` | Configura tu tienda antes de añadir productos. | Set up your store before adding products. |
| `errors.TRANSLATIONS_INVALID` | Algunas traducciones no son válidas. | Some translations aren't valid. |
| `errors.STATUS_INVALID` | Elige borrador, publicado o archivado. | Choose draft, live or archived. |
| `errors.TOO_MANY_ZONES` | Puedes añadir hasta 200 zonas. | You can add up to 200 zones. |
| `errors.ZONE_INVALID` | Introduce una ciudad y un barrio para cada zona. | Enter a city and a district for every zone. |
| `errors.ZONE_FEE_INVALID` | Introduce un coste de entrega igual o mayor que 0. | Enter a delivery fee of 0 or more. |
| `errors.ZONE_CURRENCY_INVALID` | Elige una moneda compatible para la zona. | Choose a supported currency for the zone. |
| `errors.ZONE_DUPLICATE` | Cada ciudad y barrio solo puede aparecer una vez. | Each city and district can be listed only once. |

### `seller/locales/es/common.json` (151 strings)

| Key | Text | English source |
| --- | --- | --- |
| `app.name` | Ciuna Seller | Ciuna Seller |
| `nav.home` | Inicio | Home |
| `nav.orders` | Pedidos | Orders |
| `nav.bookings` | Reservas | Bookings |
| `nav.catalog` | Catálogo | Catalog |
| `nav.services` | Servicios | Services |
| `nav.messages` | Mensajes | Messages |
| `nav.earnings` | Ingresos | Earnings |
| `nav.profile` | Perfil | Profile |
| `nav.store` | Tienda | Store |
| `nav.availability` | Disponibilidad | Availability |
| `nav.settings` | Configuración | Settings |
| `nav.more` | Más | More |
| `action.save` | Guardar cambios | Save changes |
| `action.cancel` | Cancelar | Cancel |
| `action.continue` | Continuar | Continue |
| `action.back` | Atrás | Back |
| `action.retry` | Reintentar | Try again |
| `action.signOut` | Cerrar sesión | Sign out |
| `action.add` | Añadir | Add |
| `action.remove` | Quitar | Remove |
| `action.edit` | Editar | Edit |
| `action.close` | Cerrar | Close |
| `state.loading` | Cargando | Loading |
| `state.saved` | Guardado | Saved |
| `state.required` | Obligatorio | Required |
| `status.draft` | Borrador | Draft |
| `status.in_review` | En revisión | In review |
| `status.live` | Publicado | Live |
| `status.paused` | En pausa | Paused |
| `status.rejected` | Rechazado | Rejected |
| `status.suspended` | Suspendido | Suspended |
| `type.store` | Tienda | Store |
| `type.expert` | Experto | Expert |
| `role.owner` | Propietario | Owner |
| `role.manager` | Gerente | Manager |
| `role.staff` | Personal | Staff |
| `role.finance` | Finanzas | Finance |
| `language.label` | Idioma | Language |
| `merchant.switch` | Cambiar de negocio | Switch business |
| `banner.review.title` | Su solicitud está en revisión | Your application is in review |
| `banner.review.body` | Ciuna está comprobando sus datos. Puede seguir preparando sus publicaciones. | Ciuna is checking your details. You can keep preparing your listings. |
| `banner.rejected.title` | Su solicitud necesita cambios | Your application needs changes |
| `banner.suspended.title` | Su negocio está suspendido | Your business is suspended |
| `banner.paused.title` | No está aceptando pedidos nuevos | You are not accepting new orders |
| `banner.paused.action` | Reanudar ventas | Resume selling |
| `banner.draft.title` | Termine la configuración para empezar a vender | Finish setup to start selling |
| `banner.draft.action` | Continuar la configuración | Continue setup |
| `errors.generic` | Algo salió mal. Inténtelo de nuevo. | Something went wrong. Try again. |
| `errors.UNAUTHENTICATED` | Inicie sesión para continuar. | Sign in to continue. |
| `errors.FORBIDDEN` | No tiene acceso a esta sección. | You don't have access to this. |
| `errors.NO_MERCHANT` | Cree un negocio o únase a uno para continuar. | Create or join a business to continue. |
| `errors.MERCHANT_NOT_LIVE` | Podrá publicar cuando Ciuna apruebe su negocio. | You can publish once Ciuna approves your business. |
| `errors.MERCHANT_SUSPENDED` | Su negocio está suspendido. Contacte con soporte. | Your business is suspended. Contact support. |
| `errors.MERCHANT_STATUS_NOT_ALLOWED` | Esta opción no está disponible con su estado actual. | This isn't available in your current status. |
| `errors.DISPLAY_NAME_INVALID` | Introduzca un nombre de entre 2 y 80 caracteres. | Enter a name between 2 and 80 characters. |
| `errors.COUNTRY_INVALID` | Elija un país. | Choose a country. |
| `errors.LANGUAGE_INVALID` | Elija al menos un idioma compatible. | Choose at least one supported language. |
| `errors.EMAIL_INVALID` | Introduzca un correo electrónico válido. | Enter a valid email address. |
| `errors.URL_INVALID` | Use un enlace que empiece por https://. | Use a link that starts with https://. |
| `errors.CURRENCY_INVALID` | Elija una moneda compatible. | Choose a supported currency. |
| `errors.MERCHANT_LIMIT_REACHED` | Puede tener hasta 5 negocios. | You can own up to 5 businesses. |
| `errors.UNSUPPORTED_FILE_TYPE` | Use una imagen JPG, PNG o WebP, o un PDF para los documentos. | Use a JPG, PNG or WebP image, or a PDF for documents. |
| `errors.FILE_TOO_LARGE` | El archivo es demasiado grande. Elija uno más pequeño. | That file is too large. |
| `errors.UPLOAD_FAILED` | No se pudo subir el archivo. Inténtelo de nuevo. | Upload failed. Try again. |
| `image.replace` | Reemplazar imagen | Replace image |
| `action.upload` | Subir | Upload |
| `action.submit` | Enviar | Submit |
| `action.done` | Listo | Done |
| `state.default` | predeterminado | default |
| `noAccess.title` | No tienes acceso a esta página | You don't have access to this page |
| `noAccess.body` | Pide al propietario del negocio que te dé acceso. | Ask the business owner to give you access. |
| `noAccess.back` | Volver al inicio | Back to Home |
| `home.setup.progress` | Progreso de la configuración | Setup progress |
| `home.setup.count` | {done} de {total} hechos | {done} of {total} done |
| `home.overdue` | Con retraso | Overdue |
| `home.inProgress.help` | Aceptados o en preparación | Accepted or preparing |
| `home.needs.title` | Te necesita | Needs you |
| `home.needs.count.one` | {count} asunto | {count} item |
| `home.needs.count.other` | {count} asuntos | {count} items |
| `home.needs.empty.title` | Estás al día | You are all caught up |
| `home.needs.empty.body` | Nada requiere tu atención ahora. | Nothing needs you right now. |
| `home.needs.accept.one` | Aceptar 1 pedido nuevo | Accept 1 new order |
| `home.needs.accept.other` | Aceptar {count} pedidos nuevos | Accept {count} new orders |
| `home.needs.acceptBooking.one` | Aceptar 1 solicitud de reserva | Accept 1 booking request |
| `home.needs.acceptBooking.other` | Aceptar {count} solicitudes de reserva | Accept {count} booking requests |
| `home.needs.acceptSub.due` | El más antiguo vence en {time} | The oldest is due in {time} |
| `home.needs.acceptSub.overdue` | El más antiguo lleva {time} de retraso | The oldest is overdue by {time} |
| `home.needs.acceptSub.none` | Esperan tu aceptación | Waiting for you to accept |
| `home.needs.reply` | Responder a {name} | Reply to {name} |
| `home.needs.replySub` | Mensaje nuevo sobre el pedido {id} | New message about order {id} |
| `home.needs.lowStock` | {title}: quedan {count} | {title}: {count} left |
| `home.needs.lowStockSub` | Actualiza el stock o márcalo como agotado | Update stock or mark it sold out |
| `home.needs.doc` | {label} caduca el {date} | {label} expires {date} |
| `home.needs.docSub` | Sube el documento renovado | Upload the renewed document |
| `home.today.title` | Ganancias de hoy | Today's earnings |
| `home.today.orders.one` | {count} pedido | {count} order |
| `home.today.orders.other` | {count} pedidos | {count} orders |
| `home.today.gross` | Ventas brutas | Gross sales |
| `home.today.fee` | Comisión de Ciuna | Ciuna fee |
| `home.today.net` | Neto | Net |
| `home.today.view` | Ver ganancias | View earnings |
| `home.today.empty` | Aún no hay pedidos completados hoy. | No completed orders yet today. |
| `orders.action.acceptBooking` | Aceptar reserva | Accept booking |
| `orders.tab.board` | Tablero | Board |
| `orders.board.empty` | Nada aquí | Nothing here |
| `orders.rejectedReason` | Motivo: | Reason: |
| `orders.reject.bodyRefund` | Se reembolsarán {amount} al cliente. Verá tu motivo. | The customer will be refunded {amount}. They will see your reason. |
| `earnings.item.keep` | Te quedas con | You keep |
| `earnings.item.reversedNote` | Revertido: este pedido ya no cuenta en tu saldo. | Reversed, so this order no longer counts toward your balance. |
| `earnings.methods.sendRow` | Retirar con Ciuna Send | Withdraw via Ciuna Send |
| `earnings.methods.sendRow.help` | Aún no disponible. | Not available yet. |
| `earnings.methods.defaultBadge` | Predeterminado | Default |
| `home.delta.more` | {count} pedidos más que ayer | {count} more orders than yesterday |
| `home.delta.fewer` | {count} pedidos menos que ayer | {count} fewer orders than yesterday |
| `earnings.rule.food` | Comida | Food |
| `earnings.rule.mart` | Mercado | Mart |
| `earnings.rule.experts` | Servicios de expertos | Expert services |
| `earnings.rule.generic` | Comisión | Commission |
| `earnings.rule.percent` | {line} {percent}% | {line} {percent}% |
| `earnings.rule.fixed` | {line}: tarifa fija | {line} fixed fee |
| `catalog.section.visibility` | Visibilidad | Visibility |
| `catalog.field.visible` | Visible en tu tienda | Visible in your store |
| `catalog.field.visibleOn` | Los clientes podrán encontrar y pedir este producto al guardar. | Customers can find and order this product after you save. |
| `catalog.field.visibleOff` | Oculto para los clientes. Puedes activarlo cuando quieras. | Hidden from customers. You can turn it on any time. |
| `catalog.import.fileHint` | Archivo CSV, hasta 2 MB. | CSV file, up to 2 MB. |
| `catalog.import.problem` | Con error | Has a problem |
| `catalog.fulfilment.unlocks` | Qué se desbloquea | What this unlocks |
| `catalog.fulfilment.unlock.pickup` | Dirección de recogida | Pickup address |
| `catalog.fulfilment.unlock.pickupHelp` | Los clientes podrán elegir recogida. | Lets customers choose Pickup. |
| `catalog.fulfilment.unlock.delivery` | Una zona de entrega activa | An active delivery zone |
| `catalog.fulfilment.unlock.deliveryHelp` | Los clientes de esa zona podrán pedir entrega. | Lets customers in that area order delivery. |
| `catalog.fulfilment.unlock.digital` | Productos digitales | Digital products |
| `catalog.fulfilment.unlock.digitalHelp` | No necesitan recogida ni entrega. | Need neither pickup nor delivery. |
| `messages.pick.title` | Elige una conversación | Choose a conversation |
| `messages.pick.body` | Elige un cliente a la izquierda para leer y responder. | Pick a customer on the left to read and reply. |
| `reviews.editLeft` | Puedes editar esta respuesta durante {hours} h más. | You can edit this reply for {hours} more hours. |
| `reviews.locked` | Esta respuesta ya no se puede editar. | This reply can no longer be edited. |
| `merchant.add` | Añadir un negocio | Add a business |
| `merchant.current` | Negocio actual | Current business |
| `shell.account` | Menú de la cuenta | Account menu |
| `shell.notifications` | Notificaciones | Notifications |
| `shell.notifications.count` | Notificaciones: {count} esperan por ti | Notifications: {count} waiting for you |
| `more.group.business` | Negocio | Business |
| `more.group.settings` | Ajustes | Settings |
| `more.verification.action` | Acción necesaria | Action needed |
| `more.verification.review` | En revisión | In review |
| `more.verification.rejected` | Rechazado | Rejected |
| `more.verification.verified` | Verificado | Verified |
| `more.team.count` | {count} personas | {count} people |
| `more.team.count.one` | 1 persona | 1 person |

### `seller/locales/es/earnings.json` (152 strings)

| Key | Text | English source |
| --- | --- | --- |
| `earnings.title` | Ingresos | Earnings |
| `earnings.subtitle` | Lo que has ganado, lo que está pendiente y lo que ya se pagó. | What you have earned, what is waiting, and what has been paid out. |
| `earnings.nav.overview` | Ingresos | Earnings |
| `earnings.nav.payouts` | Pagos | Payouts |
| `earnings.nav.methods` | Métodos de cobro | Payout methods |
| `earnings.available` | Disponible | Available |
| `earnings.available.help` | Listo para retirar | Ready to withdraw |
| `earnings.pending` | Pendiente | Pending |
| `earnings.pending.help` | Disponible en {days} días, cuando se cumpla el pedido | Available after {days} days, once the order is fulfilled |
| `earnings.inPayout` | En proceso de pago | In payout |
| `earnings.inPayout.help` | Solicitado, en espera de envío | Requested and waiting to be sent |
| `earnings.paidOut` | Pagado | Paid out |
| `earnings.paidOut.help` | Ya enviado a tu cuenta | Already sent to your account |
| `earnings.withdraw` | Retirar | Withdraw |
| `earnings.withdraw.cta` | Solicitar pago | Request payout |
| `earnings.withdraw.timing` | Ciuna revisa los pagos y los envía a tu cuenta. Verás el estado aquí. | Ciuna reviews payouts and sends them to your account. You'll see the status here. |
| `earnings.withdraw.currency` | Moneda | Currency |
| `earnings.withdraw.method` | Pagar a | Pay out to |
| `earnings.withdraw.noMethod` | Ningún método verificado | No verified method |
| `earnings.withdraw.unverified.title` | En espera de verificación | Waiting for verification |
| `earnings.withdraw.unverified.body` | Ciuna aún está verificando: {names}. Podrás retirar cuando esté verificado. | Ciuna is still verifying: {names}. You can withdraw once it is verified. |
| `earnings.withdraw.unverified.note` | Aún no disponible, en verificación: {names}. | Not available yet, still being verified: {names}. |
| `earnings.withdraw.none.title` | Sin método de cobro en {currency} | No payout method for {currency} |
| `earnings.withdraw.none.body` | Añade una cuenta bancaria en {currency}. Ciuna la verifica antes de tu primer pago. | Add a bank account in {currency}. Ciuna verifies it before your first payout. |
| `earnings.methods.manage` | Gestionar métodos | Manage methods |
| `earnings.withdraw.amount` | Importe | Amount |
| `earnings.withdraw.all` | Retirar todo | Withdraw all |
| `earnings.withdraw.available` | Disponible: | Available: |
| `earnings.withdraw.min` | Mínimo | Minimum |
| `earnings.withdraw.requested` | Retiras | You withdraw |
| `earnings.withdraw.fee` | Comisión de pago | Payout fee |
| `earnings.withdraw.receive` | Recibes | You receive |
| `earnings.withdraw.success` | Pago solicitado. Ciuna lo revisará y lo enviará a tu cuenta. | Payout requested. Ciuna will review it and send it to your account. |
| `earnings.withdraw.nothing` | Aún no hay nada que retirar. Los ingresos quedan disponibles tras el periodo de retención. | Nothing available to withdraw yet. Earnings become available after the hold period. |
| `earnings.noAccess.title` | Ingresos privados | Earnings are private |
| `earnings.noAccess.body` | Pide al propietario, a un gerente o a finanzas que consulte los ingresos. | Ask the owner, a manager or finance to view earnings. |
| `earnings.empty.title` | Aún no hay ingresos | No earnings yet |
| `earnings.empty.body` | Cuando cumplas un pedido, sus ingresos aparecerán aquí y estarán disponibles en {days} días. | When you fulfil an order, its earnings show here and become available after {days} days. |
| `earnings.statement` | Extracto | Statement |
| `earnings.statement.help` | Cada pedido con artículos, envío, comisión de Ciuna y lo que te queda. | Every order with items, delivery, Ciuna fee and what you keep. |
| `earnings.tab.all` | Todos | All |
| `earnings.tab.pending` | Pendientes | Pending |
| `earnings.tab.available` | Disponibles | Available |
| `earnings.tab.reversed` | Revertidos | Reversed |
| `earnings.item.pending` | Pendiente | Pending |
| `earnings.item.available` | Disponible | Available |
| `earnings.item.reversed` | Revertido | Reversed |
| `earnings.item.availableOn` | Disponible el {date} | Available on {date} |
| `earnings.item.availableSince` | Disponible desde el {date} | Available since {date} |
| `earnings.empty.all.title` | Aún no hay ingresos | No earnings yet |
| `earnings.empty.all.body` | Los pedidos cumplidos aparecerán aquí. | Fulfilled orders will appear here. |
| `earnings.empty.pending.title` | Nada pendiente | Nothing pending |
| `earnings.empty.pending.body` | Los pedidos cumplidos recientemente esperan aquí a que acabe el periodo de retención. | Orders you have fulfilled recently wait here until the hold period ends. |
| `earnings.empty.available.title` | Nada disponible | Nothing available |
| `earnings.empty.available.body` | Aquí aparecen los ingresos que superaron el periodo de retención. | Earnings that passed the hold period appear here. |
| `earnings.empty.reversed.title` | Nada revertido | Nothing reversed |
| `earnings.empty.reversed.body` | Aquí aparecen los pedidos reembolsados tras cumplirse. | Orders refunded after fulfilment appear here. |
| `earnings.col.order` | Pedido | Order |
| `earnings.col.date` | Fecha | Date |
| `earnings.col.items` | Artículos | Items |
| `earnings.col.delivery` | Envío | Delivery |
| `earnings.col.fee` | Comisión de Ciuna | Ciuna fee |
| `earnings.col.net` | Ganas | You earn |
| `earnings.col.status` | Estado | Status |
| `earnings.loadMore` | Ver más | Load more |
| `earnings.download.title` | Descargar extracto | Download statement |
| `earnings.download.help` | Todos los pedidos de un periodo en un archivo CSV. | Get every order in a date range as a CSV file. |
| `earnings.download.from` | Desde | From |
| `earnings.download.to` | Hasta | To |
| `earnings.download.cta` | Descargar CSV | Download CSV |
| `earnings.payouts.title` | Pagos | Payouts |
| `earnings.payouts.subtitle` | Todos los pagos que solicitaste y en qué estado están. | Every payout you requested, and where it stands. |
| `earnings.payouts.noAccess.title` | Pagos privados | Payouts are private |
| `earnings.payouts.noAccess.body` | Pide al propietario o a finanzas que consulte los pagos. | Ask the owner or finance to view payouts. |
| `earnings.payouts.empty.title` | Aún no hay pagos | No payouts yet |
| `earnings.payouts.empty.body` | Cuando retires fondos, la solicitud y su estado aparecerán aquí. | When you withdraw, the request and its status appear here. |
| `earnings.payouts.empty.cta` | Ir a ingresos | Go to earnings |
| `earnings.payout.status.requested` | Solicitado | Requested |
| `earnings.payout.status.approved` | Aprobado | Approved |
| `earnings.payout.status.paid` | Pagado | Paid |
| `earnings.payout.status.rejected` | Rechazado | Rejected |
| `earnings.payout.status.cancelled` | Cancelado | Cancelled |
| `earnings.payout.requestedOn` | Solicitado el {date} | Requested {date} |
| `earnings.payout.fee` | Comisión de pago | Payout fee |
| `earnings.payout.received` | Recibiste | You received |
| `earnings.payout.method` | Pagado a | Paid to |
| `earnings.payout.paidOn` | Pagado el | Paid on |
| `earnings.payout.reference` | Referencia | Reference |
| `earnings.payout.reason` | Motivo | Reason |
| `earnings.payout.note.requested` | A la espera de que Ciuna lo revise. Puedes cancelarlo hasta que se apruebe. | Waiting for Ciuna to review. You can cancel until it is approved. |
| `earnings.payout.note.approved` | Aprobado. Ciuna enviará el dinero a tu cuenta. | Approved. Ciuna will send the money to your account. |
| `earnings.payout.note.paid` | Enviado a tu cuenta. | Sent to your account. |
| `earnings.payout.note.rejected` | No se pagó. El dinero volvió a tu saldo disponible. | Not paid. The money is back in your available balance. |
| `earnings.payout.note.cancelled` | Cancelado. El dinero volvió a tu saldo disponible. | Cancelled. The money is back in your available balance. |
| `earnings.payout.cancel` | Cancelar solicitud | Cancel request |
| `earnings.payout.cancel.q` | ¿Cancelar esta solicitud de pago? | Cancel this payout request? |
| `earnings.payout.cancel.body` | El dinero vuelve de inmediato a tu saldo disponible. | The money returns to your available balance right away. |
| `earnings.payout.cancel.confirm` | Cancelar solicitud | Cancel request |
| `earnings.payout.cancel.keep` | Mantener solicitud | Keep request |
| `earnings.payout.cancelled` | Solicitud de pago cancelada. | Payout request cancelled. |
| `earnings.kind.bank` | Cuenta bancaria | Bank account |
| `earnings.kind.sbp` | SBP (Rusia) | SBP (Russia) |
| `earnings.kind.ciuna_send` | Ciuna Send | Ciuna Send |
| `earnings.comingSoon` | Próximamente | Coming soon |
| `earnings.methods.title` | Métodos de cobro | Payout methods |
| `earnings.methods.subtitle` | Adónde envía Ciuna tu dinero. | Where Ciuna sends your money. |
| `earnings.methods.add` | Añadir método | Add method |
| `earnings.methods.add.cta` | Añadir método | Add method |
| `earnings.methods.default` | predeterminado | default |
| `earnings.methods.verified` | Verificado | Verified |
| `earnings.methods.waiting` | En espera de verificación | Waiting for verification |
| `earnings.methods.makeDefault` | Hacer predeterminado | Make default |
| `earnings.methods.defaultSet` | Método predeterminado actualizado. | Default method updated. |
| `earnings.methods.removed` | Método eliminado. | Method removed. |
| `earnings.methods.added` | Método añadido. Ciuna lo verificará antes de tu primer pago. | Method added. Ciuna will verify it before your first payout. |
| `earnings.methods.remove.q` | ¿Eliminar este método? | Remove this method? |
| `earnings.methods.remove.body` | Puedes añadirlo de nuevo más tarde. Las solicitudes abiertas conservan su método original. | You can add it again later. Open payout requests keep their original method. |
| `earnings.methods.verify.title` | Ciuna verifica los métodos nuevos | Ciuna verifies new methods |
| `earnings.methods.verify.body` | Un método nuevo no puede recibir dinero hasta que Ciuna lo verifique. Verás «Verificado» aquí cuando esté listo. | A new method can't receive money until Ciuna has verified it. You'll see "Verified" here when it is ready. |
| `earnings.methods.empty.title` | Sin métodos de cobro | No payout methods |
| `earnings.methods.empty.body` | Añade una cuenta bancaria para retirar tus ingresos. | Add a bank account so you can withdraw your earnings. |
| `earnings.methods.kind` | Tipo | Type |
| `earnings.methods.currency` | Moneda | Currency |
| `earnings.methods.sbp.rubOnly` | SBP solo paga en RUB. | SBP pays out in RUB only. |
| `earnings.methods.label` | Nombre de este método | Name for this method |
| `earnings.methods.label.hint` | Opcional, p. ej. «Cuenta principal». Solo lo ves tú. | Optional, e.g. "Main account". Only you see it. |
| `earnings.methods.privacy` | Guardamos estos datos cifrados y no volvemos a mostrarlos. Solo se ven los últimos 4 dígitos. | We keep these details encrypted and never show them again. Only the last 4 digits are shown. |
| `earnings.field.phone` | Número de teléfono | Phone number |
| `earnings.field.bank_name` | Nombre del banco | Bank name |
| `earnings.field.recipient_name` | Nombre del destinatario | Recipient name |
| `earnings.field.account_number` | Número de cuenta | Account number |
| `earnings.field.bik` | BIK (opcional) | BIK (optional) |
| `earnings.field.swift` | SWIFT (opcional) | SWIFT (optional) |
| `earnings.field.iban` | IBAN (opcional) | IBAN (optional) |
| `earnings.field.country` | País (opcional) | Country (optional) |
| `errors.INSUFFICIENT_BALANCE` | Tu saldo disponible es menor que este importe. | Your available balance is lower than this amount. |
| `errors.BELOW_MINIMUM_PAYOUT` | Este importe es inferior al pago mínimo. | This is below the minimum payout. |
| `errors.PAYOUT_METHOD_NOT_FOUND` | No se encontró ese método de cobro. | That payout method wasn't found. |
| `errors.PAYOUT_METHOD_NOT_VERIFIED` | Ese método aún no está verificado. | That method hasn't been verified yet. |
| `errors.PAYOUT_CURRENCY_MISMATCH` | La moneda del método no coincide con este pago. | The method's currency doesn't match this payout. |
| `errors.AMOUNT_INVALID` | Introduce un importe mayor que cero, con un máximo de 2 decimales. | Enter an amount greater than zero, with up to 2 decimals. |
| `errors.TOO_MANY_OPEN_PAYOUTS` | Ya tienes 3 solicitudes de pago abiertas. Espera a que termine una o cancela una. | You already have 3 open payout requests. Wait for one to finish or cancel one. |
| `errors.PAYOUT_FEE_INVALID` | La comisión de pago supera el importe. Prueba con un importe mayor. | The payout fee is higher than the amount. Try a larger amount. |
| `errors.METHOD_IN_USE` | Este método tiene un pago abierto. Inténtalo de nuevo cuando termine. | This method has an open payout. Try again after it finishes. |
| `errors.TOO_MANY_METHODS` | Puedes tener hasta 10 métodos de cobro. | You can keep up to 10 payout methods. |
| `errors.KIND_INVALID` | Elige un tipo de método. | Choose a method type. |
| `errors.CURRENCY_NOT_SUPPORTED` | Este tipo de método no admite esa moneda. | This method type doesn't support that currency. |
| `errors.PHONE_INVALID` | Introduce un teléfono de 10 a 15 dígitos. | Enter a phone number with 10 to 15 digits. |
| `errors.FIELD_REQUIRED` | Obligatorio | Required |
| `errors.PAYOUT_NOT_FOUND` | No se encontró ese pago. | That payout wasn't found. |
| `errors.DATE_INVALID` | Elige un periodo válido. | Choose a valid date range. |
| `errors.METHOD_HAS_HISTORY` | Este método se usó en un pago anterior, por lo que no se puede eliminar. Elige otro como predeterminado. | This method was used for a past payout, so it can't be removed. Make another method the default instead. |

### `seller/locales/es/expert.json` (219 strings)

| Key | Text | English source |
| --- | --- | --- |
| `expert.only.title` | Solo para expertos | Experts only |
| `expert.only.body` | Esta sección es para cuentas de experto. Cambia a tu negocio de experto para usarla. | This section is for expert accounts. Switch to your expert business to use it. |
| `expert.only.home` | Ir al inicio | Go to home |
| `expert.unit.label` | Unidad | Unit |
| `expert.unit.minutes` | minutos | minutes |
| `expert.unit.hours` | horas | hours |
| `expert.unit.min` | min | min |
| `expert.unit.h` | h | h |
| `expert.services.title` | Servicios | Services |
| `expert.services.subtitle` | Lo que los clientes pueden reservar contigo. | What customers can book with you. |
| `expert.services.add` | Añadir servicio | Add service |
| `expert.services.empty.title` | Aún no hay servicios | No services yet |
| `expert.services.empty.body` | Añade tu primer servicio y define tu disponibilidad para que los clientes puedan reservar. | Add your first service, then set your availability so customers can book. |
| `expert.services.per_hour` | por hora | per hour |
| `expert.services.slots` | {count} huecos libres en los próximos 14 días | {count} open slots in the next 14 days |
| `expert.services.slots.none` | Sin huecos libres en 14 días | No open slots in the next 14 days |
| `expert.services.slots.set` | Definir disponibilidad | Set availability |
| `expert.services.publish` | Publicar este servicio | Publish this service |
| `expert.services.published` | Visible para los clientes | Visible to customers |
| `expert.services.publish_toggle` | Publicar {title} | Publish {title} |
| `expert.services.needs_instructions` | Añade las instrucciones de la reunión antes de publicar. | Add meeting instructions before publishing. |
| `expert.pricing.hourly` | Tarifa por hora | Hourly rate |
| `expert.pricing.fixed` | Precio fijo por sesión | Fixed price per session |
| `expert.pricing.quote` | Presupuesto a petición | Quote on request |
| `expert.delivery.online` | En línea | Online |
| `expert.delivery.in_person` | En persona | In person |
| `expert.delivery.both` | En línea o en persona | Online or in person |
| `expert.form.new` | Nuevo servicio | New service |
| `expert.form.edit` | Editar servicio | Edit service |
| `expert.form.notlive.title` | Podrás publicar cuando Ciuna apruebe tu negocio | You can publish once Ciuna approves your business |
| `expert.form.rejected` | Este servicio fue rechazado. Edita el título, la descripción o las instrucciones y guarda para enviarlo de nuevo a revisión. | This service was rejected. Edit the title, description or instructions and save to send it for review again. |
| `expert.form.review` | Ciuna revisa los cambios de título, descripción o instrucciones antes de que los vean los clientes. | Changes to the title, description or instructions are reviewed by Ciuna before customers see them. |
| `expert.form.basics` | Datos básicos | Basics |
| `expert.form.basics.hint` | Escribe en el idioma en el que trabajas. Los demás idiomas son opcionales. | Write in the language you serve. Other languages are optional. |
| `expert.form.title` | Título del servicio | Service title |
| `expert.form.title.ph` | Por ejemplo, sesión de coaching profesional | For example, Career coaching session |
| `expert.form.short` | Descripción breve | Short description |
| `expert.form.lang.hint` | Si lo dejas vacío, los clientes verán el idioma predeterminado. | If you leave this empty, customers see the default language. |
| `expert.form.err.title` | Introduce un título. | Enter a title. |
| `expert.form.pricing` | Precio | Pricing |
| `expert.form.pricing.type` | Tipo de precio | Pricing type |
| `expert.form.rate` | Tarifa por hora | Rate per hour |
| `expert.form.price` | Precio por sesión | Price per session |
| `expert.form.currency` | Moneda | Currency |
| `expert.form.quote.note` | Los servicios con presupuesto a petición no se pueden reservar en línea, por eso no se ofrecen aquí. | Services priced on request can't be booked online, so they aren't offered here. |
| `expert.form.err.amount` | Introduce un importe mayor que cero. | Enter an amount greater than zero. |
| `expert.form.duration` | Duración | Duration |
| `expert.form.duration.default` | Duración de la sesión | Session length |
| `expert.form.duration.min` | Sesión más corta | Shortest session |
| `expert.form.duration.max` | Sesión más larga | Longest session |
| `expert.form.optional` | Opcional | Optional |
| `expert.form.err.duration` | Introduce una duración mayor que cero. | Enter a session length greater than zero. |
| `expert.form.err.range` | La sesión más corta no puede ser más larga que la más larga. | The shortest session can't be longer than the longest. |
| `expert.form.delivery` | Modalidad | Delivery |
| `expert.form.delivery.mode` | Dónde se realizan las sesiones | Where sessions happen |
| `expert.form.instructions` | Instrucciones de la reunión | Meeting instructions |
| `expert.form.instructions.hint` | Cómo conectarse o dónde reunirse. Obligatorio para publicar. | How customers join or where to meet. Required to publish. |
| `expert.form.err.instructions` | Añade las instrucciones de la reunión para publicar. | Add meeting instructions to publish. |
| `expert.form.rules` | Reglas de reserva | Booking rules |
| `expert.form.lead` | Aviso mínimo antes de una sesión | Minimum notice before a session |
| `expert.form.lead.hint` | Los clientes no podrán reservar huecos que empiecen antes. | Customers can't book slots that start sooner than this. |
| `expert.form.cutoff` | Plazo de pago antes de una sesión | Payment deadline before a session |
| `expert.form.cutoff.hint` | Una reserva debe pagarse con al menos este tiempo de antelación. | A booking must be paid at least this long before it starts. |
| `expert.form.err.number` | Introduce cero o más. | Enter zero or more. |
| `expert.form.timezone` | Zona horaria del servicio | Service time zone |
| `expert.form.timezone.hint` | Los clientes ven las horas de las sesiones con esta zona. | Customers see session times with this zone. |
| `expert.form.save_draft` | Guardar borrador | Save draft |
| `expert.form.publish` | Publicar | Publish |
| `expert.form.unsaved` | Cambios sin guardar | Unsaved changes |
| `expert.form.toast.saved` | Servicio guardado | Service saved |
| `expert.form.toast.published` | Servicio publicado | Service published |
| `expert.form.toast.unpublished` | Servicio despublicado | Service unpublished |
| `expert.form.unpublish.title` | Dejar de aceptar reservas | Stop accepting bookings |
| `expert.form.unpublish.body` | El servicio se oculta a los clientes y se eliminan sus huecos libres. | The service is hidden from customers and its open slots are removed. |
| `expert.form.unpublish.action` | Despublicar | Unpublish |
| `expert.form.unpublish.confirm` | ¿Despublicar este servicio? | Unpublish this service? |
| `expert.form.unpublish.confirm.body` | Los clientes dejarán de verlo y se eliminarán sus huecos libres. Las reservas existentes se mantienen. Para ofrecerlo de nuevo, publícalo y guarda tu disponibilidad. | Customers will no longer see it and its open slots will be removed. Existing bookings stay. To offer it again, publish it and save your availability. |
| `expert.avail.title` | Disponibilidad | Availability |
| `expert.avail.subtitle` | Define cuándo pueden reservar los clientes. Al guardar se recrean tus huecos libres. | Set when customers can book you. Saving rebuilds your open slots. |
| `expert.avail.service` | Servicio | Service |
| `expert.avail.noservice.title` | Primero añade un servicio | Add a service first |
| `expert.avail.noservice.body` | La disponibilidad se define por servicio. | Availability is set per service. |
| `expert.avail.settings` | Ajustes del horario | Schedule settings |
| `expert.avail.timezone` | Zona horaria | Time zone |
| `expert.avail.timezone.hint` | Tus horas semanales están en esta zona horaria. | Your weekly hours are in this time zone. |
| `expert.avail.slot` | Duración del hueco | Slot length |
| `expert.avail.slot.hint` | Cada franja abierta se divide en huecos de esta duración. | Each open range is cut into slots of this length. |
| `expert.avail.window.start` | Reservable desde | Bookable from |
| `expert.avail.window.end` | Reservable hasta | Bookable until |
| `expert.avail.window.days` | Los clientes pueden reservar con {count} días de margen (máximo {max}). | Customers can book {count} days ahead (up to {max}). |
| `expert.avail.window.max` | El periodo puede ser de {max} días como máximo. | The window can be at most {max} days. |
| `expert.avail.window.reset` | Próximos 60 días | Next 60 days |
| `expert.avail.window.order` | La fecha final no puede ser anterior a la inicial. | The end date must be on or after the start date. |
| `expert.avail.window.long` | Elige un periodo de {max} días o menos. | Choose a window of {max} days or fewer. |
| `expert.avail.weekly` | Horario semanal | Weekly hours |
| `expert.avail.weekly.hint` | Las horas están en {zone}. Añade varias franjas al día para los descansos. | Times are in {zone}. Add several ranges to a day for breaks. |
| `expert.avail.closed` | No disponible | Not available |
| `expert.avail.add` | Añadir horas | Add hours |
| `expert.avail.copy` | Copiar a otros días | Copy to other days |
| `expert.avail.copy.title` | Copiar {day} a otros días | Copy {day} to other days |
| `expert.avail.copy.hint` | Las horas de los días que elijas se sustituirán. | Hours on the days you choose will be replaced. |
| `expert.avail.copy.apply` | Copiar horas | Copy hours |
| `expert.avail.from` | Hora de inicio | Start time |
| `expert.avail.to` | Hora de fin | End time |
| `expert.avail.issue.order` | La hora de fin debe ser posterior a la de inicio. | End time must be after start time. |
| `expert.avail.issue.overlap` | Esta franja se solapa con otra del mismo día. | This range overlaps another range on the same day. |
| `expert.avail.issue.empty` | Introduce la hora de inicio y la de fin. | Enter both a start and an end time. |
| `expert.avail.norules` | Aún no hay horas semanales. Si guardas ahora, se eliminarán tus huecos libres. | No weekly hours yet. Saving now will remove your open slots. |
| `expert.avail.save` | Guardar y actualizar huecos | Save and update slots |
| `expert.avail.saves_note` | Las sesiones reservadas nunca se modifican. | Booked sessions are never changed. |
| `expert.avail.fix` | Corrige los campos marcados para guardar. | Fix the highlighted fields to save. |
| `expert.avail.saved` | Disponibilidad guardada | Availability saved |
| `expert.avail.preview` | Próximos 14 días | Next 14 days |
| `expert.avail.preview.hint` | Huecos que los clientes pueden reservar, en {zone}. {count} huecos creados. | Slots customers can book, in {zone}. {count} slots created. |
| `expert.avail.preview.empty` | No hay huecos en los próximos 14 días. Revisa tu horario semanal y el periodo de reserva. | No slots in the next 14 days. Check your weekly hours and booking window. |
| `expert.slots.title` | Próximos huecos | Upcoming slots |
| `expert.slots.hint` | Bloquea un hueco que no puedas atender o elimínalo. Horas en {zone}. | Block a slot you can't take, or remove it. Times in {zone}. |
| `expert.slots.range` | Periodo | Time range |
| `expert.slots.next` | Próximos {count} días | Next {count} days |
| `expert.slots.empty` | No hay huecos en este periodo | No slots in this period |
| `expert.slots.empty.body` | Guarda tu horario semanal para crear huecos. | Save your weekly hours to create slots. |
| `expert.slots.status.available` | Libre | Open |
| `expert.slots.status.booked` | Reservado | Booked |
| `expert.slots.status.blocked` | Bloqueado | Blocked |
| `expert.slots.block` | Bloquear | Block |
| `expert.slots.unblock` | Desbloquear | Unblock |
| `expert.slots.view_booking` | Ver reserva | View booking |
| `expert.slots.delete.title` | ¿Eliminar este hueco? | Delete this slot? |
| `expert.slots.delete.action` | Eliminar hueco | Delete slot |
| `expert.slots.deleted` | Hueco eliminado | Slot deleted |
| `expert.timeoff.title` | Tiempo libre | Time off |
| `expert.timeoff.hint` | Bloquea todos los huecos libres en un rango de fechas. Las sesiones ya reservadas no cambian. | Block all open slots in a date range. Sessions already booked stay as they are. |
| `expert.timeoff.from` | Primer día libre | First day off |
| `expert.timeoff.to` | Último día libre | Last day off |
| `expert.timeoff.service` | Servicio | Service |
| `expert.timeoff.all` | Todos los servicios | All services |
| `expert.timeoff.zone` | Días completos en {zone}. | Whole days in {zone}. |
| `expert.timeoff.action` | Bloquear estas fechas | Block these dates |
| `expert.timeoff.confirm` | ¿Bloquear del {from} al {to}? | Block {from} to {to}? |
| `expert.timeoff.confirm.body` | Se bloquearán todos los huecos libres ({scope}) de este rango (zona horaria {zone}). Podrás desbloquearlos uno a uno. | All open slots for {scope} in this range will be blocked (time zone {zone}). You can unblock them one by one. |
| `expert.timeoff.done` | {count} huecos bloqueados. | {count} slots blocked. |
| `expert.bookings.title` | Reservas | Bookings |
| `expert.bookings.subtitle` | Sesiones que los clientes han reservado y pagado. | Sessions customers have booked and paid for. |
| `expert.bookings.tab.requests` | Solicitudes | Requests |
| `expert.bookings.tab.upcoming` | Próximas | Upcoming |
| `expert.bookings.tab.past` | Pasadas | Past |
| `expert.bookings.empty.requests.title` | No hay solicitudes pendientes | No requests to answer |
| `expert.bookings.empty.requests.body` | Las nuevas reservas pagadas aparecerán aquí para que las aceptes. | New paid bookings appear here for you to accept. |
| `expert.bookings.empty.upcoming.title` | No hay sesiones próximas | No upcoming sessions |
| `expert.bookings.empty.upcoming.body` | Las sesiones aceptadas aparecen aquí hasta que terminan. | Accepted sessions show up here until they end. |
| `expert.bookings.empty.past.title` | No hay sesiones pasadas | No past sessions |
| `expert.bookings.empty.past.body` | Aquí se listan las sesiones completadas y canceladas. | Completed and cancelled sessions are listed here. |
| `expert.bookings.status.new` | Nueva solicitud | New request |
| `expert.bookings.status.accepted` | Aceptada | Accepted |
| `expert.bookings.status.preparing` | En curso | In progress |
| `expert.bookings.status.completed` | Completada | Completed |
| `expert.bookings.status.cancelled` | Cancelada | Cancelled |
| `expert.bookings.session` | Sesión | Session |
| `expert.bookings.customer` | Cliente | Customer |
| `expert.bookings.no_slot` | Sin hora definida | No time set |
| `expert.bookings.yours` | Tu hora | Your time |
| `expert.bookings.session_time` | Hora de la sesión ({zone}) | Session time ({zone}) |
| `expert.bookings.your_time` | Hora de tu dispositivo ({zone}) | Your device time ({zone}) |
| `expert.bookings.accept` | Aceptar | Accept |
| `expert.bookings.accepted` | Reserva aceptada | Booking accepted |
| `expert.bookings.complete` | Marcar como completada | Mark as completed |
| `expert.bookings.view` | Ver detalles | View details |
| `expert.bookings.overdue` | Responde ya, la solicitud está atrasada | Answer now, this request is overdue |
| `expert.bookings.respond_by` | Responde antes de {time} | Respond by {time} |
| `expert.bookings.exception` | Requiere atención | Needs attention |
| `expert.detail.title` | Reserva | Booking |
| `expert.detail.session` | Sesión | Session |
| `expert.detail.price` | Precio | Price |
| `expert.detail.customer` | Cliente | Customer |
| `expert.detail.note` | Nota del cliente | Note from the customer |
| `expert.detail.exception` | Esta reserva necesita la atención de Ciuna | This booking needs attention from Ciuna |
| `expert.detail.meeting` | Enlace de la reunión | Meeting link |
| `expert.detail.meeting.hint` | El cliente lo verá en cuanto lo guardes. | The customer sees this once you save it. |
| `expert.detail.meeting.url` | Enlace de la reunión (https) | Meeting link (https) |
| `expert.detail.meeting.url.err` | Introduce un enlace que empiece por https:// | Enter a link that starts with https:// |
| `expert.detail.meeting.instructions` | Instrucciones para el cliente | Instructions for the customer |
| `expert.detail.meeting.save` | Guardar datos de la reunión | Save meeting details |
| `expert.detail.meeting.saved` | Datos de la reunión guardados | Meeting details saved |
| `expert.detail.meeting.open` | Abrir el enlace actual | Open current link |
| `expert.detail.reject` | Rechazar | Decline |
| `expert.detail.reject.title` | ¿Rechazar esta reserva? | Decline this booking? |
| `expert.detail.reject.body` | Se reembolsa al cliente el importe completo y se le explica el motivo. No se puede deshacer. | The customer is refunded in full and told why. This can't be undone. |
| `expert.detail.reject.reason` | Motivo del rechazo | Reason for declining |
| `expert.detail.reject.confirm` | Rechazar reserva | Decline booking |
| `expert.detail.fulfill` | Marcar como completada | Mark as completed |
| `expert.detail.fulfill.wait` | Podrás completar esta sesión cuando termine, a las {time}. | You can complete this session after it ends at {time}. |
| `expert.detail.fulfill.title` | ¿Marcar esta sesión como completada? | Mark this session as completed? |
| `expert.detail.fulfill.body` | Esto confirma que la sesión tuvo lugar e inicia tu pago. | This confirms the session took place and starts your payout. |
| `expert.detail.fulfill.note` | Nota sobre la sesión | Note about the session |
| `expert.detail.done.accept` | Reserva aceptada | Booking accepted |
| `expert.detail.done.reject` | Reserva rechazada y reembolsada | Booking declined and refunded |
| `expert.detail.done.fulfill` | Sesión marcada como completada | Session marked as completed |
| `errors.SERVICE_INVALID` | Revisa los datos del servicio e inténtalo de nuevo. | Check the service details and try again. |
| `errors.HAS_FUTURE_BOOKINGS` | Este servicio tiene {count} sesiones reservadas próximas. Complétalas o recházalas primero y luego despublica. | This service has {count} upcoming booked sessions. Complete or decline them first, then unpublish. |
| `errors.SLOT_BOOKED` | Este hueco ya está reservado y no se puede cambiar. | This slot is already booked, so it can't be changed. |
| `errors.SLOT_NOT_EDITABLE` | Este hueco no se puede cambiar. | This slot can't be changed. |
| `errors.SLOT_NOT_FOUND` | Este hueco ya no existe. Actualiza la lista. | This slot no longer exists. Refresh the list. |
| `errors.SLOT_OVERLAP` | Esta hora se solapa con un hueco existente. | This time overlaps an existing slot. |
| `errors.SLOT_IN_PAST` | Elige una hora futura. | Choose a time in the future. |
| `errors.WINDOW_TOO_LONG` | El periodo de reserva puede ser de {maxDays} días como máximo. | The booking window can be at most {maxDays} days. |
| `errors.WINDOW_INVALID` | Introduce fechas de inicio y fin válidas. | Enter a valid start and end date. |
| `errors.WINDOW_ORDER` | La fecha final no puede ser anterior a la inicial. | The end date must be on or after the start date. |
| `errors.RULE_TIME_ORDER` | Cada franja debe terminar después de empezar. | Each range must end after it starts. |
| `errors.TIMEZONE_INVALID` | Elige una zona horaria válida. | Choose a valid time zone. |
| `errors.RANGE_ORDER` | La fecha final debe ser posterior a la inicial. | The end date must be after the start date. |
| `errors.RANGE_TOO_LONG` | Elige un rango de {maxDays} días o menos. | Choose a range of {maxDays} days or fewer. |
| `errors.SCHEDULE_REQUIRED` | Guarda primero tu horario semanal. | Save your weekly hours first. |
| `errors.EXPERT_ONLY` | Esto solo está disponible para cuentas de experto. | This is only available to expert accounts. |
| `errors.EXPERT_PROFILE_NOT_FOUND` | Tu perfil de experto aún no está configurado. Termina primero la configuración. | Your expert profile isn't set up yet. Finish setup first. |
| `errors.SERVICE_NOT_FOUND` | Este servicio ya no existe. | This service no longer exists. |
| `errors.MEETING_URL_INVALID` | Introduce un enlace que empiece por https:// | Enter a link that starts with https:// |
| `errors.MEETING_EMPTY` | Añade un enlace de reunión o instrucciones. | Add a meeting link or instructions. |
| `errors.BOOKING_CLOSED` | Esta reserva está cerrada y no se pueden cambiar los datos de la reunión. | This booking is closed, so meeting details can't be changed. |
| `errors.BOOKING_NOT_PAID` | Esta reserva aún no está pagada. | This booking isn't paid yet. |

### `seller/locales/es/home.json` (13 strings)

| Key | Text | English source |
| --- | --- | --- |
| `home.welcome` | Bienvenido, {name} | Welcome, {name} |
| `home.setup.body` | Complete estos pasos y Ciuna revisará su negocio. | Finish these steps and Ciuna will review your business. |
| `home.live.body` | Lo que requiere su atención hoy. | What needs your attention today. |
| `home.setup.title` | Prepárese para vender | Get ready to sell |
| `home.newOrders` | Pedidos nuevos | New orders |
| `home.newBookings` | Solicitudes de reserva nuevas | New booking requests |
| `home.needsAction` | Esperan su aceptación | Waiting for you to accept |
| `home.inProgress` | En curso | In progress |
| `more.storeProfile` | Perfil de la tienda | Store profile |
| `more.expertProfile` | Perfil de experto | Expert profile |
| `more.verification` | Verificación y documentos | Verification and documents |
| `more.fulfillment` | Recogida y entrega | Pickup and delivery |
| `more.team` | Equipo | Team |

### `seller/locales/es/messages.json` (33 strings)

| Key | Text | English source |
| --- | --- | --- |
| `messages.title` | Mensajes | Messages |
| `messages.subtitle` | Habla con tus clientes sobre sus pedidos. Responde rápido para que todo avance. | Chat with customers about their orders. Reply quickly to keep orders moving. |
| `messages.noAccess.title` | No tienes acceso a los mensajes | You don't have access to messages |
| `messages.noAccess.body` | Pide al propietario del negocio que te dé el permiso de mensajes. | Ask the business owner to give you the messages permission. |
| `messages.empty.title` | Aún no hay mensajes | No messages yet |
| `messages.empty.body` | Cuando un cliente escriba sobre un pedido, la conversación aparecerá aquí. | When a customer writes about an order, the conversation appears here. |
| `messages.customer` | Cliente | Customer |
| `messages.you` | Tú | You |
| `messages.unread` | {count} sin leer | {count} unread |
| `messages.closed.chip` | Chat cerrado | Chat closed |
| `messages.back` | Todos los mensajes | All messages |
| `messages.viewOrder` | Ver pedido | View order |
| `messages.history` | Conversación | Conversation |
| `messages.thread.empty` | Aún no hay mensajes en este chat. Saluda abajo. | No messages in this chat yet. Say hello below. |
| `messages.closed.title` | Este chat está cerrado | This chat is closed |
| `messages.closed.body` | Los chats se cierran 14 días después de completar o cancelar un pedido. Aún puedes ver el historial. | Chats close 14 days after an order is completed or cancelled. You can still see the history. |
| `messages.unavailable.title` | El chat no está disponible | Chat isn't available |
| `messages.unavailable.body` | El chat se abre cuando el cliente paga el pedido. | Chat opens once the customer has paid for the order. |
| `messages.composer.label` | Mensaje | Message |
| `messages.composer.placeholder` | Escribe un mensaje | Write a message |
| `messages.composer.closed` | Chat cerrado | Chat is closed |
| `messages.send` | Enviar | Send |
| `messages.seen` | Visto | Seen |
| `messages.quick.label` | Respuestas rápidas | Quick replies |
| `messages.quick.preparing` | Tu pedido se está preparando. | Your order is being prepared. |
| `messages.quick.delivery` | Entregaremos en menos de una hora. | We will deliver within the hour. |
| `messages.quick.thanks` | ¡Gracias por tu pedido! | Thank you for your order! |
| `messages.quick.question` | ¿Puedes confirmar tu dirección, por favor? | Could you confirm your address, please? |
| `errors.CHAT_CLOSED` | Este chat está cerrado, no se envió el mensaje. | This chat is closed, so the message was not sent. |
| `errors.RATE_LIMITED` | Estás enviando mensajes demasiado rápido. Espera un poco e inténtalo de nuevo. | You're sending messages too fast. Wait a little and try again. |
| `errors.MESSAGE_EMPTY` | Escribe un mensaje antes de enviar. | Write a message before sending. |
| `errors.MESSAGE_TOO_LONG` | El mensaje es demasiado largo. Máximo 2000 caracteres. | That message is too long. Keep it under 2000 characters. |
| `errors.CHAT_UNAVAILABLE` | El chat no está disponible para este pedido. | Chat isn't available for this order. |

### `seller/locales/es/orders.json` (89 strings)

| Key | Text | English source |
| --- | --- | --- |
| `orders.title` | Pedidos | Orders |
| `orders.subtitle` | Los pedidos nuevos aparecen aquí. Acepta rápido para que los clientes esperen menos. | New orders appear here. Accept quickly to keep customers waiting less. |
| `orders.tab.new` | Nuevos | New |
| `orders.tab.active` | En curso | In progress |
| `orders.tab.done` | Completados | Completed |
| `orders.tab.cancelled` | Cancelados | Cancelled |
| `orders.empty.new.title` | No hay pedidos nuevos | No new orders |
| `orders.empty.new.body` | Los pedidos nuevos aparecerán aquí en cuanto los clientes paguen. | New orders show up here as soon as customers pay. |
| `orders.empty.active.title` | Nada en curso | Nothing in progress |
| `orders.empty.active.body` | Los pedidos que aceptes aparecen aquí hasta que los marques como completados. | Orders you accept appear here until you mark them fulfilled. |
| `orders.empty.done.title` | Aún no hay pedidos completados | No completed orders yet |
| `orders.empty.done.body` | Los pedidos completados se mostrarán aquí. | Fulfilled orders will be listed here. |
| `orders.empty.cancelled.title` | No hay pedidos cancelados | No cancelled orders |
| `orders.empty.cancelled.body` | Los pedidos rechazados y cancelados se mostrarán aquí. | Rejected and cancelled orders will be listed here. |
| `orders.noAccess.title` | No tienes acceso a los pedidos | You don't have access to orders |
| `orders.noAccess.body` | Pide al propietario del negocio que te dé el permiso de pedidos. | Ask the business owner to give you the orders permission. |
| `orders.number` | Pedido {id} | Order {id} |
| `orders.moreItems` | +{count} más | +{count} more |
| `orders.mode.delivery` | Entrega | Delivery |
| `orders.mode.pickup` | Recogida | Pickup |
| `orders.mode.digital` | Digital | Digital |
| `orders.mode.booking` | Reserva | Booking |
| `orders.due.in` | Vence en {time} | Due in {time} |
| `orders.due.overdue` | Retrasado {time} | Overdue by {time} |
| `orders.duration.hm` | {h} h {m} min | {h} h {m} min |
| `orders.duration.m` | {m} min | {m} min |
| `orders.status.new` | Nuevo | New |
| `orders.status.accepted` | Aceptado | Accepted |
| `orders.status.preparing` | En preparación | Preparing |
| `orders.status.completed` | Completado | Completed |
| `orders.status.cancelled` | Cancelado | Cancelled |
| `orders.action.accept` | Aceptar | Accept |
| `orders.action.start` | Empezar a preparar | Start preparing |
| `orders.action.fulfill` | Marcar como completado | Mark as fulfilled |
| `orders.action.reject` | Rechazar | Reject |
| `orders.view` | Ver pedido | View order |
| `orders.back` | Volver a pedidos | Back to orders |
| `orders.toast.newOrder` | Nuevo pedido | New order |
| `orders.toast.accept` | Pedido {id} aceptado | Order {id} accepted |
| `orders.toast.start` | Pedido {id} en preparación | Order {id} is being prepared |
| `orders.toast.fulfill` | Pedido {id} marcado como completado | Order {id} marked as fulfilled |
| `orders.toast.reject` | Pedido {id} rechazado | Order {id} rejected |
| `orders.items` | Artículos | Items |
| `orders.col.item` | Artículo | Item |
| `orders.col.qty` | Cant. | Qty |
| `orders.col.unit` | Precio unitario | Unit price |
| `orders.col.total` | Total | Total |
| `orders.subtotal` | Subtotal | Subtotal |
| `orders.deliveryFee` | Gastos de envío | Delivery fee |
| `orders.total` | Total | Total |
| `orders.note` | Nota del cliente | Customer note |
| `orders.slot` | Hora de la reserva | Booking time |
| `orders.slot.timezone` | Horas mostradas en {tz} | Times shown in {tz} |
| `orders.digital` | Contenido digital | Digital content |
| `orders.digital.hint` | Esto es lo que enviaste al cliente. | This is what you sent to the customer. |
| `orders.customer` | Cliente | Customer |
| `orders.customer.unknown` | Nombre no indicado | Name not provided |
| `orders.pickup` | Recogida | Pickup |
| `orders.pickup.hours` | Horario de recogida: {hours} | Pickup hours: {hours} |
| `orders.deliveryTo` | Entregar en | Deliver to |
| `orders.location` | Lugar | Location |
| `orders.noAddress` | Sin dirección | No address provided |
| `orders.timeline` | Historial | Timeline |
| `orders.timeline.empty` | Aún no hay actividad. | No activity yet. |
| `orders.exception.title` | Este pedido requiere atención | This order needs attention |
| `orders.reject.title` | ¿Rechazar este pedido? | Reject this order? |
| `orders.reject.body` | Se reembolsará el importe completo al cliente. Verá tu motivo. | The customer will be refunded in full. They will see your reason. |
| `orders.reject.reason` | Motivo | Reason |
| `orders.reject.placeholder` | Cuéntale al cliente por qué, por ejemplo: sin existencias | Tell the customer why, for example: out of stock |
| `orders.reject.confirm` | Rechazar pedido | Reject order |
| `orders.fulfill.title` | ¿Marcar este pedido como completado? | Mark this order as fulfilled? |
| `orders.fulfill.body` | Añade una nota para el cliente, por ejemplo qué se entregó. | Add a note for the customer, such as what was delivered. |
| `orders.fulfill.bodyDigital` | Añade el contenido que recibe el cliente y una nota. | Add the content the customer receives, and a note. |
| `orders.fulfill.note` | Nota para el cliente | Note for the customer |
| `orders.fulfill.noteHint` | Obligatorio. Al menos una frase. | Required. At least one sentence. |
| `orders.fulfill.content` | Contenido digital | Digital content |
| `orders.fulfill.contentHint` | Códigos, enlaces o instrucciones. El cliente lo verá. | Codes, links or instructions. The customer sees this. |
| `orders.fulfill.confirm` | Marcar como completado | Mark as fulfilled |
| `errors.INVALID_TRANSITION` | Este pedido ha cambiado. Actualiza e inténtalo de nuevo. | Something about this order changed. Refresh and try again. |
| `errors.REJECT_NOT_ALLOWED` | Este pedido ya no se puede rechazar. Contacta con soporte. | This order can't be rejected now. Contact support. |
| `errors.REASON_REQUIRED` | Escribe un motivo de al menos 3 caracteres. | Enter a reason of at least 3 characters. |
| `errors.CONTACT_SUPPORT` | Este pedido necesita ayuda de soporte de Ciuna. Contacta con soporte para continuar. | This order needs Ciuna support. Contact support to continue. |
| `errors.DELIVERY_CONTENT_REQUIRED` | Añade el contenido digital antes de marcar el pedido como completado. | Add the digital content before marking this order fulfilled. |
| `errors.NOTE_REQUIRED` | Añade una nota para el cliente. | Add a note for the customer. |
| `errors.SESSION_NOT_ENDED` | Puedes marcar una reserva como completada cuando termine la sesión. | You can mark a booking fulfilled after the session has ended. |
| `errors.ORDER_NOT_FOUND` | No encontramos este pedido. | We couldn't find this order. |
| `errors.INVALID_ACTION` | Esa acción no está disponible. | That action isn't available. |
| `errors.UNAVAILABLE` | No pudimos conectar con Ciuna. Revisa tu conexión e inténtalo de nuevo. | We couldn't reach Ciuna. Check your connection and try again. |
| `orders.messageCustomer` | Escribir al cliente | Message the customer |

### `seller/locales/es/reviews.json` (32 strings)

| Key | Text | English source |
| --- | --- | --- |
| `reviews.title` | Reseñas | Reviews |
| `reviews.subtitle` | Lo que los clientes dicen de tus pedidos. | What customers say about your orders. |
| `reviews.nav` | Reseñas | Reviews |
| `reviews.stars` | {n} de 5 | {n} out of 5 |
| `reviews.starsShort` | {n} estrellas | {n} stars |
| `reviews.count` | {count} reseñas | {count} reviews |
| `reviews.count.one` | 1 reseña | 1 review |
| `reviews.distribution` | Reseñas por puntuación | Reviews by star rating |
| `reviews.customer` | Cliente | Customer |
| `reviews.noText` | Sin comentario escrito. | No written review. |
| `reviews.yourReply` | Tu respuesta | Your reply |
| `reviews.reply` | Responder | Reply |
| `reviews.editReply` | Editar respuesta | Edit reply |
| `reviews.reply.public` | Tu respuesta es pública. | Your reply is public. |
| `reviews.reply.label` | Respuesta | Reply |
| `reviews.reply.editWindow` | Puedes editar esta respuesta durante 24 horas después de publicarla. | You can edit this reply for 24 hours after posting. |
| `reviews.reply.counter` | {used} / {max} | {used} / {max} |
| `reviews.reply.send` | Publicar respuesta | Post reply |
| `reviews.reply.sent` | Respuesta publicada. | Reply posted. |
| `reviews.tab.all` | Todas | All |
| `reviews.tab.needsReply` | Por responder | Needs reply |
| `reviews.empty.title` | Aún no hay reseñas | No reviews yet |
| `reviews.empty.body` | Los clientes pueden reseñar un pedido cuando se completa. Las reseñas aparecen aquí. | Customers can review an order after it is fulfilled. Reviews show up here. |
| `reviews.empty.caughtUp.title` | Estás al día | You're all caught up |
| `reviews.empty.caughtUp.body` | Todas las reseñas tienen respuesta. | Every review has a reply. |
| `reviews.more` | Mostrar más | Show more |
| `reviews.noAccess.title` | No tienes acceso a las reseñas | You don't have access to reviews |
| `reviews.noAccess.body` | Pide al propietario del negocio que te dé el permiso de pedidos. | Ask the business owner to give you the orders permission. |
| `errors.REPLY_REQUIRED` | Escribe una respuesta. | Write a reply. |
| `errors.REPLY_TOO_LONG` | La respuesta no puede superar los 600 caracteres. | Keep the reply to 600 characters. |
| `errors.REPLY_LOCKED` | Esta respuesta ya no se puede editar. | This reply can no longer be edited. |
| `errors.REVIEW_NOT_FOUND` | No encontramos esa reseña. | We couldn't find that review. |

### `seller/locales/es/settings.json` (49 strings)

| Key | Text | English source |
| --- | --- | --- |
| `profile.subtitle` | Lo que ven los clientes en su página. | What customers see on your page. |
| `profile.basics` | Datos básicos | Basics |
| `profile.description` | Descripción | Description |
| `profile.description.hint` | Cuente a los clientes quién es y qué ofrece. Obligatoria en su idioma predeterminado. | Tell customers who you are and what you offer. Required in your default language. |
| `profile.images` | Imágenes | Images |
| `profile.cover.upload` | Subir imagen de portada | Upload cover image |
| `profile.contact` | Contacto y región | Contact and region |
| `profile.phone` | Teléfono | Phone |
| `profile.website` | Sitio web | Website |
| `profile.currency` | Moneda predeterminada | Default currency |
| `team.title` | Equipo | Team |
| `team.subtitle` | Personas que pueden iniciar sesión en este negocio. | People who can sign in to this business. |
| `team.invite` | Invitar a una persona | Invite a person |
| `team.invite.cta` | Enviar invitación | Send invite |
| `team.invite.link` | Enlace de invitación | Invite link |
| `team.invite.copied` | Enlace copiado | Link copied |
| `team.pending` | Invitaciones pendientes | Pending invites |
| `team.remove.q` | ¿Quitar a esta persona? | Remove this person? |
| `team.remove` | Quitar | Remove |
| `team.you` | Usted | You |
| `team.role.hint` | Los gerentes dirigen el trabajo diario. El personal gestiona pedidos y publicaciones. Finanzas ve los ingresos y los pagos. | Managers run daily work. Staff handle orders and listings. Finance sees earnings and payouts. |
| `errors.TOO_MANY_INVITES` | Hay demasiadas invitaciones abiertas. Cancele algunas primero. | Too many open invites. Cancel some first. |
| `errors.ROLE_INVALID` | Elija un rol. | Choose a role. |
| `errors.OWNER_IMMUTABLE` | El propietario no se puede cambiar ni quitar. | The owner can't be changed or removed. |
| `errors.CANNOT_CHANGE_SELF` | No puede cambiar su propio rol. | You can't change your own role. |
| `errors.INVITE_INVALID` | La invitación no es válida o ha caducado. | This invite is invalid or has expired. |
| `errors.INVITE_EMAIL_MISMATCH` | Inicie sesión con el correo electrónico al que se envió la invitación. | Sign in with the email address that was invited. |
| `team.role` | Rol | Role |
| `notif.title` | Alertas | Alerts |
| `notif.subtitle` | Entérate al momento cuando un pedido o una reserva te necesite. | Get told the moment an order or booking needs you. |
| `notif.channels` | Dónde enviar las alertas | Where to send alerts |
| `notif.email` | Correo | Email |
| `notif.email.body` | Un mensaje corto al correo de tu cuenta. | A short message to your account email. |
| `notif.telegram.body` | Mensajes instantáneos en Telegram. Vincula tu cuenta para activarlo. | Instant messages in Telegram. Link your account to turn this on. |
| `notif.telegram.linked` | Conectado {name} | Connected {name} |
| `notif.telegram.connect` | Conectar Telegram | Connect Telegram |
| `notif.telegram.disconnect` | Desconectar | Disconnect |
| `notif.telegram.open` | Termina en Telegram | Finish in Telegram |
| `notif.telegram.openLink` | Abre Telegram y pulsa Start | Open Telegram and press Start |
| `notif.telegram.unavailable` | Las alertas de Telegram aún no están disponibles. El correo sí funciona. | Telegram alerts are not available yet. Email alerts still work. |
| `notif.kinds` | Qué avisar | What to alert |
| `notif.kinds.body` | Desactiva las alertas que no necesites. | Turn off alerts you don't need. |
| `notif.kind.order_new` | Pedidos nuevos | New orders |
| `notif.kind.booking_new` | Nuevas solicitudes de reserva | New booking requests |
| `notif.kind.payout_update` | Estado de los pagos | Payout updates |
| `notif.kind.merchant_status` | Cambios en tu solicitud | Changes to your application |
| `more.alerts` | Alertas | Alerts |
| `more.payoutMethods` | Métodos de pago | Payout methods |
| `notif.kind.message_new` | Mensajes nuevos de clientes | New customer messages |

### `seller/locales/es/setup.json` (61 strings)

| Key | Text | English source |
| --- | --- | --- |
| `onb.title` | Configure su negocio | Set up your business |
| `onb.subtitle` | Cuéntenos qué vende. Podrá cambiar casi todo más adelante. | Tell us what you sell. You can change most of this later. |
| `onb.type` | ¿Qué quiere hacer en Ciuna? | What do you want to do on Ciuna? |
| `onb.type.store` | Vender productos | Sell products |
| `onb.type.store.body` | Comida, alimentos y artículos, con entrega a domicilio o recogida. | Food, groceries and goods, delivered or picked up. |
| `onb.type.expert` | Ofrecer mi experiencia | Offer my expertise |
| `onb.type.expert.body` | Traducción, ayuda legal, clases particulares y otros servicios, reservados por horario. | Translation, legal help, tutoring and other services, booked by time. |
| `onb.name.store` | Nombre de la tienda | Store name |
| `onb.name.expert` | Su nombre o el nombre de su consulta | Your name or practice name |
| `onb.line` | Sección del marketplace | Marketplace section |
| `onb.line.hint` | Aquí lo encontrarán los clientes. | Where customers will find you. |
| `onb.line.food` | Comida | Food |
| `onb.line.mart` | Mart (alimentos y artículos) | Mart (groceries and goods) |
| `onb.country` | ¿En qué país tiene su sede el negocio? | Where is your business based? |
| `onb.country.hint` | Esto determina qué documentos de verificación le pedimos. | This decides which verification documents we ask for. |
| `onb.operating` | ¿Dónde vende o entrega? | Where do you sell or deliver? |
| `onb.operating.hint` | Los clientes de esas zonas verán sus publicaciones. | Customers there will see your listings. |
| `onb.languages` | Idiomas en los que atiende a los clientes | Languages you serve customers in |
| `onb.languages.hint` | Elija al menos uno. Escribirá sus publicaciones en estos idiomas. | Choose at least one. You write your listings in these languages. |
| `onb.invite` | Le han invitado a unirse a {name} | You are invited to join {name} |
| `onb.invite.accept` | Unirse | Join |
| `setup.title` | Configuración y verificación | Set up and verify |
| `setup.subtitle` | Complete estos pasos. Ciuna revisa su negocio antes de que salga a la venta. | Complete these steps. Ciuna reviews your business before you go live. |
| `setup.done` | Hecho | Done |
| `setup.todo` | Pendiente | To do |
| `setup.optional` | Opcional | Optional |
| `setup.approved` | Su negocio está aprobado | Your business is approved |
| `setup.item.profile` | Perfil del negocio | Business profile |
| `setup.item.logo` | Logotipo | Logo |
| `setup.item.tier` | Elegir tipo de verificación | Choose verification type |
| `setup.item.kyb_fields` | Datos de verificación | Verification details |
| `setup.item.kyb_documents` | Documentos de verificación | Verification documents |
| `setup.item.first_listing` | Primera publicación | First listing |
| `setup.profile.body` | Añada su descripción en su idioma principal y los datos de contacto. | Add your description in your main language and contact details. |
| `setup.profile.cta` | Editar perfil | Edit profile |
| `setup.logo.upload` | Subir logotipo | Upload logo |
| `setup.verify.title` | Verificación | Verification |
| `setup.verify.body` | Pedimos documentos distintos según el país donde tenga su sede el negocio. | We ask for different documents depending on where your business is based. |
| `setup.verify.tier` | Tipo de verificación | Verification type |
| `setup.tier1.body` | Para particulares y vendedores autónomos. Límites más bajos. | For individuals and self-employed sellers. Lower limits. |
| `setup.tier2.body` | Para empresas registradas. Límites completos. | For registered companies. Full limits. |
| `setup.docs.title` | Documentos | Documents |
| `doc.pending` | En revisión | In review |
| `doc.approved` | Aprobado | Approved |
| `doc.rejected` | Rechazado | Rejected |
| `doc.expired` | Caducado | Expired |
| `setup.listing.store` | Añada su primer producto | Add your first product |
| `setup.listing.expert` | Añada su primer servicio | Add your first service |
| `setup.listing.body` | Guárdelo ahora como borrador. Podrá publicarlo cuando Ciuna apruebe su negocio. | Save it as a draft now. You can publish once Ciuna approves your business. |
| `setup.listing.addProduct` | Añadir producto | Add product |
| `setup.listing.addService` | Añadir servicio | Add service |
| `setup.submit.title` | Enviar a revisión | Submit for review |
| `setup.submit.ready` | Todo está listo. Ciuna suele revisar en un día hábil. | Everything is ready. Ciuna usually reviews within one business day. |
| `setup.submit.notReady` | Aún hay pasos pendientes. Podrá enviar la solicitud cuando los complete. | Some steps are still open. You can submit once they are done. |
| `setup.submit.cta` | Enviar a revisión | Submit for review |
| `setup.submitted` | Enviado a revisión | Submitted for review |
| `errors.APPLICATION_INCOMPLETE` | Aún hay pasos pendientes. Complételos y envíe la solicitud. | Some steps are still open. Complete them, then submit. |
| `errors.TIER_INVALID` | Elija un tipo de verificación. | Choose a verification type. |
| `errors.DOCUMENT_LOCKED` | Los documentos aprobados no se pueden quitar. | Approved documents can't be removed. |
| `errors.PATH_INVALID` | La subida no es válida. Inténtelo de nuevo. | That upload isn't valid. Try again. |
| `errors.EXPIRY_INVALID` | Use una fecha de caducidad futura. | Use a future expiry date. |

### `seller/locales/zh/auth.json` (18 strings)

| Key | Text | English source |
| --- | --- | --- |
| `auth.login.title` | 登录 Ciuna Seller | Sign in to Ciuna Seller |
| `auth.login.subtitle` | 使用您的 Ciuna 账号登录。刚接触 Ciuna？一分钟即可创建账号。 | Use your Ciuna account. New to Ciuna? Create one in a minute. |
| `auth.login.cta` | 登录 | Sign in |
| `auth.register.title` | 在 Ciuna 开始销售 | Start selling on Ciuna |
| `auth.register.subtitle` | 触达身在海外、正在寻找您所提供内容的人。 | Reach people living abroad who are looking for what you offer. |
| `auth.register.cta` | 创建账号 | Create account |
| `auth.noAccount` | 还没有账号？ | No account yet? |
| `auth.haveAccount` | 已有账号？ | Already have an account? |
| `auth.email` | 电子邮箱 | Email |
| `auth.password` | 密码 | Password |
| `auth.passwordHint` | 至少 8 个字符。 | At least 8 characters. |
| `auth.passwordShort` | 密码至少需要 8 个字符。 | Use at least 8 characters for your password. |
| `auth.firstName` | 名 | First name |
| `auth.lastName` | 姓 | Last name |
| `auth.invalid` | 电子邮箱或密码不正确。 | Email or password is incorrect. |
| `auth.exists` | 该邮箱已注册账号，请直接登录。 | An account with this email already exists. Sign in instead. |
| `auth.checkEmail.title` | 请查收邮件 | Check your email |
| `auth.checkEmail.body` | 我们已向 {email} 发送确认链接。请打开链接，然后登录。 | We sent a confirmation link to {email}. Open it, then sign in. |

### `seller/locales/zh/catalog.json` (147 strings)

| Key | Text | English source |
| --- | --- | --- |
| `catalog.title` | 商品目录 | Catalog |
| `catalog.intro` | 你销售的所有商品。价格和库存的修改会立即生效。 | Everything you sell. Edits to prices and stock apply straight away. |
| `catalog.back` | 返回商品目录 | Back to catalog |
| `catalog.search` | 搜索商品 | Search products |
| `catalog.new.title` | 添加商品 | Add product |
| `catalog.edit.title` | 编辑商品 | Edit product |
| `catalog.action.add` | 添加商品 | Add product |
| `catalog.action.import` | 从 CSV 导入 | Import from CSV |
| `catalog.action.pause` | 暂停 | Pause |
| `catalog.action.publish` | 发布 | Publish |
| `catalog.action.saveDraft` | 保存为草稿 | Save as draft |
| `catalog.action.moveToDraft` | 转为草稿 | Move to draft |
| `catalog.action.saveChanges` | 保存更改 | Save changes |
| `catalog.action.archive` | 归档商品 | Archive product |
| `catalog.link.fulfilment` | 配送区域与自提 | Delivery zones and pickup |
| `catalog.tab.all` | 全部 | All |
| `catalog.tab.live` | 已上架 | Live |
| `catalog.tab.draft` | 草稿 | Draft |
| `catalog.tab.archived` | 已归档 | Archived |
| `catalog.status.draft` | 草稿 | Draft |
| `catalog.status.live` | 已上架 | Live |
| `catalog.status.archived` | 已归档 | Archived |
| `catalog.stock.count` | 库存 {n} | {n} in stock |
| `catalog.stock.unlimited` | 不限量 | Unlimited |
| `catalog.stock.soldOut` | 已售罄 | Sold out |
| `catalog.stock.soldOutToggle` | 将“{title}”标记为已售罄 | Mark {title} as sold out |
| `catalog.review.pending` | 审核中 | Under review |
| `catalog.review.rejected` | 已拒绝：{note} | Rejected: {note} |
| `catalog.empty.title` | 还没有商品 | No products yet |
| `catalog.empty.body` | 添加你的第一件商品，或通过 CSV 文件一次导入多件。 | Add your first product, or import many at once from a CSV file. |
| `catalog.empty.noMatch` | 没有符合条件的商品。 | No products match. |
| `catalog.toast.savedDraft` | 已保存为草稿 | Saved as draft |
| `catalog.toast.published` | 已发布 | Published |
| `catalog.toast.paused` | 已暂停 | Paused |
| `catalog.toast.archived` | 商品已归档 | Product archived |
| `catalog.toast.soldOutOn` | 已标记为售罄 | Marked as sold out |
| `catalog.toast.soldOutOff` | 已恢复有货 | Back in stock |
| `catalog.toast.fulfilmentSaved` | 配送设置已保存 | Fulfilment saved |
| `catalog.form.moderationHint` | 文字和图片的修改会立即生效。Ciuna 会在之后进行审核，并可能要求你修改。 | Changes to text and photos go live straight away. Ciuna reviews them afterwards and may ask you to fix them. |
| `catalog.form.publishLater` | Ciuna 批准你的商家后即可发布。 | You can publish once Ciuna approves your business. |
| `catalog.form.unsaved` | 有未保存的更改。 | You have unsaved changes. |
| `catalog.form.fixErrors` | 请检查标出的字段。 | Check the highlighted fields. |
| `catalog.section.basics` | 基本信息 | Basics |
| `catalog.section.photos` | 图片 | Photos |
| `catalog.section.price` | 价格 | Price |
| `catalog.section.stock` | 库存 | Stock |
| `catalog.section.fulfilment` | 履约方式 | Fulfilment |
| `catalog.lang.defaultHint` | 默认语言。顾客所用语言未填写时会显示这一版本。 | Default language. This is shown when a customer's language isn't filled in. |
| `catalog.lang.otherHint` | 选填。留空则显示默认语言。 | Optional. Leave blank to show your default language. |
| `catalog.field.title` | 名称 | Name |
| `catalog.field.short` | 简短描述 | Short description |
| `catalog.field.shortHint` | 显示在列表中，最多 300 个字符。 | Shown in lists. Up to 300 characters. |
| `catalog.field.long` | 详细描述 | Full description |
| `catalog.field.category` | 分类 | Category |
| `catalog.field.listPrice` | 价格 | Price |
| `catalog.field.salePrice` | 促销价 | Sale price |
| `catalog.field.salePriceHint` | 选填，必须低于原价。 | Optional. Must be lower than the price. |
| `catalog.field.currency` | 币种 | Currency |
| `catalog.field.unlimited` | 库存不限 | Unlimited stock |
| `catalog.field.stock` | 库存数量 | Quantity in stock |
| `catalog.field.soldOut` | 已售罄 | Sold out |
| `catalog.field.soldOutHint` | 关闭此选项前，顾客无法下单。 | Customers can't order it until you switch this off. |
| `catalog.cat.Meals` | 餐食 | Meals |
| `catalog.cat.Snacks` | 小吃 | Snacks |
| `catalog.cat.Drinks` | 饮品 | Drinks |
| `catalog.cat.Other` | 其他 | Other |
| `catalog.cat.Groceries` | 食品杂货 | Groceries |
| `catalog.cat.Household` | 家居用品 | Household |
| `catalog.cat.Electronics` | 电子产品 | Electronics |
| `catalog.photos.hint` | 第一张图片为主图，最多可再添加 8 张。 | The first photo is the main one. Add up to 8 more. |
| `catalog.photos.main` | 主图 | Main photo |
| `catalog.photos.addMain` | 添加主图 | Add main photo |
| `catalog.photos.add` | 添加图片 | Add photo |
| `catalog.photos.gallery` | 更多图片（{n}/8） | More photos ({n} of 8) |
| `catalog.mode.delivery` | 配送 | Delivery |
| `catalog.mode.pickup` | 自提 | Pickup |
| `catalog.mode.digital` | 数字商品 | Digital |
| `catalog.mode.deliveryHint` | 由你把商品送到顾客手中。 | You deliver this to the customer. |
| `catalog.mode.pickupHint` | 顾客到你的自提点取货。 | The customer collects it from your pickup location. |
| `catalog.mode.digitalHint` | 线上交付，无需发货。 | Delivered online, nothing to ship. |
| `catalog.archive.title` | 归档此商品？ | Archive this product? |
| `catalog.archive.body` | 商品将从店铺中消失。历史订单会保留其信息，你仍可在“已归档”中找到它。 | It will disappear from the store. Past orders keep their details, and you can still find it under Archived. |
| `catalog.fulfilment.title` | 配送与自提 | Delivery and pickup |
| `catalog.fulfilment.intro` | 设置顾客取货的地点和你的配送范围。发布配送商品需要配送区域，发布自提商品需要自提信息。 | Set where customers collect orders and which areas you deliver to. You need delivery zones to publish delivery products, and pickup details to publish pickup products. |
| `catalog.fulfilment.pickup` | 自提 | Pickup |
| `catalog.fulfilment.pickupHint` | 顾客选择自提时会看到这些信息。 | Customers see this when they choose pickup. |
| `catalog.fulfilment.location` | 自提地址 | Pickup address |
| `catalog.fulfilment.hours` | 营业时间 | Opening hours |
| `catalog.fulfilment.hoursHint` | 例如：周一至周六 9:00–20:00 | For example: Mon to Sat, 9:00 to 20:00 |
| `catalog.fulfilment.notes` | 给顾客的备注 | Notes for customers |
| `catalog.fulfilment.zones` | 配送区域 | Delivery zones |
| `catalog.fulfilment.zonesHint` | 顾客只能在你列出的区域下单配送。 | Customers can order delivery only in the zones you list. |
| `catalog.fulfilment.noZones` | 还没有配送区域。 | No delivery zones yet. |
| `catalog.fulfilment.city` | 城市 | City |
| `catalog.fulfilment.district` | 区域 | District |
| `catalog.fulfilment.fee` | 配送费 | Delivery fee |
| `catalog.fulfilment.active` | 启用 | Active |
| `catalog.fulfilment.inactive` | 停用 | Inactive |
| `catalog.fulfilment.addZone` | 添加区域 | Add zone |
| `catalog.fulfilment.pickupMissing` | 请先填写自提地址，才能发布自提商品。 | Add your pickup address to publish pickup products. |
| `catalog.fulfilment.zonesMissing` | 请至少添加一个启用的配送区域，才能发布配送商品。 | Add at least one active delivery zone to publish delivery products. |
| `catalog.fulfilment.setup` | 去设置 | Set up |
| `catalog.import.title` | 导入商品 | Import products |
| `catalog.import.intro` | 通过 CSV 文件最多添加 200 件商品。它们会以草稿创建，方便你先检查。 | Add up to 200 products from a CSV file. They are created as drafts so you can check them first. |
| `catalog.import.step1` | 1. 获取模板 | 1. Get the template |
| `catalog.import.step1Hint` | 每行一件商品，最多 {max} 行。小数可用句点或逗号。 | Fill in one product per row. Up to {max} rows. Use a period or comma for decimals. |
| `catalog.import.template` | 下载模板 | Download template |
| `catalog.import.choose` | 选择 CSV 文件 | Choose CSV file |
| `catalog.import.badFile` | 无法读取该文件。请使用模板，并检查 title 和 list_price 列。 | We couldn't read that file. Use the template and check the title and list_price columns. |
| `catalog.import.step2` | 2. 检查商品 | 2. Check your products |
| `catalog.import.summary` | {file}：{valid} 行可导入，{invalid} 行有问题。只会导入可导入的行。 | {file}: {valid} ready, {invalid} with problems. Only ready rows are imported. |
| `catalog.import.tooMany` | 只使用 {total} 行中的前 {max} 行。 | Only the first {max} of {total} rows are used. |
| `catalog.import.lineUnknown` | 创建每件商品时会校验分类。 | Categories are checked when each product is created. |
| `catalog.import.col.row` | 行 | Row |
| `catalog.import.col.status` | 状态 | Status |
| `catalog.import.ready` | 可导入 | Ready |
| `catalog.import.progress` | 已导入 {done}/{total} | {done} of {total} imported |
| `catalog.import.step3` | 3. 导入 | 3. Import |
| `catalog.import.result` | 已创建 {created} 件，失败 {failed} 件。 | {created} created, {failed} failed. |
| `catalog.import.draftNote` | 创建的商品均为草稿。请逐个打开添加图片后再发布。 | Created products are drafts. Open each one to add photos, then publish. |
| `catalog.import.failedRow` | 第 {line} 行（{title}）：{reason} | Row {line} ({title}): {reason} |
| `catalog.import.another` | 导入其他文件 | Import another file |
| `catalog.import.viewCatalog` | 查看商品目录 | View catalog |
| `catalog.import.start` | 导入 {n} 件商品 | Import {n} products |
| `catalog.import.finished` | 导入完成 | Import finished |
| `errors.PRODUCT_NOT_FOUND` | 找不到该商品。 | We couldn't find that product. |
| `errors.STORE_ONLY` | 只有店铺可以管理商品。 | Only stores can manage products. |
| `errors.TITLE_REQUIRED` | 请输入至少 2 个字符的名称。 | Enter a name with at least 2 characters. |
| `errors.PRICE_REQUIRED` | 请输入大于 0 的价格。 | Enter a price above 0. |
| `errors.SALE_PRICE_TOO_HIGH` | 促销价必须低于原价。 | The sale price must be lower than the price. |
| `errors.INVALID_STOCK` | 请输入 0 或更大的整数。 | Enter a whole number of 0 or more. |
| `errors.CATEGORY_OUTSIDE_LINE` | 你的店铺不支持该分类。 | That category isn't available for your store. |
| `errors.FULFILLMENT_REQUIRED` | 请选择配送、自提或数字商品。 | Choose delivery, pickup or digital. |
| `errors.GALLERY_INVALID` | 最多 8 张图片，链接需以 https 开头。 | Use up to 8 photos with https links. |
| `errors.LISTING_REJECTED` | 此商品已被拒绝。修改文字或图片后可重新提交。 | This listing was rejected. Edit the text or photos to submit it again. |
| `errors.VENDOR_UNAVAILABLE` | 你的店铺目前对顾客不可用。 | Your store isn't available to customers right now. |
| `errors.PICKUP_CONFIGURATION_REQUIRED` | 发布自提商品前，请先填写自提地址。 | Add your pickup address before publishing pickup products. |
| `errors.DELIVERY_ZONE_REQUIRED` | 发布配送商品前，请先添加配送区域。 | Add a delivery zone before publishing delivery products. |
| `errors.PAYMENT_METHOD_REQUIRED` | 发布前请先添加支付方式。 | Add a payment method before publishing. |
| `errors.VENDOR_REQUIRED` | 添加商品前请先完成店铺设置。 | Set up your store before adding products. |
| `errors.TRANSLATIONS_INVALID` | 部分翻译无效。 | Some translations aren't valid. |
| `errors.STATUS_INVALID` | 请选择草稿、已上架或已归档。 | Choose draft, live or archived. |
| `errors.TOO_MANY_ZONES` | 最多可添加 200 个区域。 | You can add up to 200 zones. |
| `errors.ZONE_INVALID` | 请为每个区域填写城市和区域。 | Enter a city and a district for every zone. |
| `errors.ZONE_FEE_INVALID` | 请输入 0 或更大的配送费。 | Enter a delivery fee of 0 or more. |
| `errors.ZONE_CURRENCY_INVALID` | 请为该区域选择支持的币种。 | Choose a supported currency for the zone. |
| `errors.ZONE_DUPLICATE` | 每个城市和区域只能列出一次。 | Each city and district can be listed only once. |

### `seller/locales/zh/common.json` (151 strings)

| Key | Text | English source |
| --- | --- | --- |
| `app.name` | Ciuna Seller | Ciuna Seller |
| `nav.home` | 首页 | Home |
| `nav.orders` | 订单 | Orders |
| `nav.bookings` | 预约 | Bookings |
| `nav.catalog` | 商品目录 | Catalog |
| `nav.services` | 服务 | Services |
| `nav.messages` | 消息 | Messages |
| `nav.earnings` | 收入 | Earnings |
| `nav.profile` | 资料 | Profile |
| `nav.store` | 店铺 | Store |
| `nav.availability` | 可预约时间 | Availability |
| `nav.settings` | 设置 | Settings |
| `nav.more` | 更多 | More |
| `action.save` | 保存更改 | Save changes |
| `action.cancel` | 取消 | Cancel |
| `action.continue` | 继续 | Continue |
| `action.back` | 返回 | Back |
| `action.retry` | 重试 | Try again |
| `action.signOut` | 退出登录 | Sign out |
| `action.add` | 添加 | Add |
| `action.remove` | 移除 | Remove |
| `action.edit` | 编辑 | Edit |
| `action.close` | 关闭 | Close |
| `state.loading` | 加载中 | Loading |
| `state.saved` | 已保存 | Saved |
| `state.required` | 必填 | Required |
| `status.draft` | 草稿 | Draft |
| `status.in_review` | 审核中 | In review |
| `status.live` | 已上线 | Live |
| `status.paused` | 已暂停 | Paused |
| `status.rejected` | 已拒绝 | Rejected |
| `status.suspended` | 已停用 | Suspended |
| `type.store` | 店铺 | Store |
| `type.expert` | 专家 | Expert |
| `role.owner` | 所有者 | Owner |
| `role.manager` | 经理 | Manager |
| `role.staff` | 员工 | Staff |
| `role.finance` | 财务 | Finance |
| `language.label` | 语言 | Language |
| `merchant.switch` | 切换业务 | Switch business |
| `banner.review.title` | 您的申请正在审核中 | Your application is in review |
| `banner.review.body` | Ciuna 正在核对您的信息。您可以继续准备商品或服务信息。 | Ciuna is checking your details. You can keep preparing your listings. |
| `banner.rejected.title` | 您的申请需要修改 | Your application needs changes |
| `banner.suspended.title` | 您的业务已被停用 | Your business is suspended |
| `banner.paused.title` | 您目前不接收新订单 | You are not accepting new orders |
| `banner.paused.action` | 恢复销售 | Resume selling |
| `banner.draft.title` | 完成设置后即可开始销售 | Finish setup to start selling |
| `banner.draft.action` | 继续设置 | Continue setup |
| `errors.generic` | 出了点问题，请重试。 | Something went wrong. Try again. |
| `errors.UNAUTHENTICATED` | 请登录后继续。 | Sign in to continue. |
| `errors.FORBIDDEN` | 您没有权限访问此内容。 | You don't have access to this. |
| `errors.NO_MERCHANT` | 请创建或加入一个业务后继续。 | Create or join a business to continue. |
| `errors.MERCHANT_NOT_LIVE` | Ciuna 批准您的业务后，您才能发布。 | You can publish once Ciuna approves your business. |
| `errors.MERCHANT_SUSPENDED` | 您的业务已被停用，请联系客服。 | Your business is suspended. Contact support. |
| `errors.MERCHANT_STATUS_NOT_ALLOWED` | 当前状态下无法使用此功能。 | This isn't available in your current status. |
| `errors.DISPLAY_NAME_INVALID` | 请输入 2 到 80 个字符的名称。 | Enter a name between 2 and 80 characters. |
| `errors.COUNTRY_INVALID` | 请选择国家或地区。 | Choose a country. |
| `errors.LANGUAGE_INVALID` | 请至少选择一种支持的语言。 | Choose at least one supported language. |
| `errors.EMAIL_INVALID` | 请输入有效的电子邮箱地址。 | Enter a valid email address. |
| `errors.URL_INVALID` | 请使用以 https:// 开头的链接。 | Use a link that starts with https://. |
| `errors.CURRENCY_INVALID` | 请选择支持的币种。 | Choose a supported currency. |
| `errors.MERCHANT_LIMIT_REACHED` | 您最多可拥有 5 个业务。 | You can own up to 5 businesses. |
| `errors.UNSUPPORTED_FILE_TYPE` | 请上传 JPG、PNG 或 WebP 图片；证件文件请上传 PDF。 | Use a JPG, PNG or WebP image, or a PDF for documents. |
| `errors.FILE_TOO_LARGE` | 文件过大，请选择更小的文件。 | That file is too large. |
| `errors.UPLOAD_FAILED` | 上传失败，请重试。 | Upload failed. Try again. |
| `image.replace` | 更换图片 | Replace image |
| `action.upload` | 上传 | Upload |
| `action.submit` | 提交 | Submit |
| `action.done` | 完成 | Done |
| `state.default` | 默认 | default |
| `noAccess.title` | 您无权访问此页面 | You don't have access to this page |
| `noAccess.body` | 请联系企业所有者为您开通权限。 | Ask the business owner to give you access. |
| `noAccess.back` | 返回首页 | Back to Home |
| `home.setup.progress` | 设置进度 | Setup progress |
| `home.setup.count` | 已完成 {done}/{total} | {done} of {total} done |
| `home.overdue` | 已逾期 | Overdue |
| `home.inProgress.help` | 已接受或准备中 | Accepted or preparing |
| `home.needs.title` | 待处理 | Needs you |
| `home.needs.count.one` | {count} 项 | {count} item |
| `home.needs.count.other` | {count} 项 | {count} items |
| `home.needs.empty.title` | 已全部处理 | You are all caught up |
| `home.needs.empty.body` | 目前没有需要处理的事项。 | Nothing needs you right now. |
| `home.needs.accept.one` | 接受 1 个新订单 | Accept 1 new order |
| `home.needs.accept.other` | 接受 {count} 个新订单 | Accept {count} new orders |
| `home.needs.acceptBooking.one` | 接受 1 个预约请求 | Accept 1 booking request |
| `home.needs.acceptBooking.other` | 接受 {count} 个预约请求 | Accept {count} booking requests |
| `home.needs.acceptSub.due` | 最早的订单将在 {time} 后到期 | The oldest is due in {time} |
| `home.needs.acceptSub.overdue` | 最早的订单已逾期 {time} | The oldest is overdue by {time} |
| `home.needs.acceptSub.none` | 等待您接受 | Waiting for you to accept |
| `home.needs.reply` | 回复 {name} | Reply to {name} |
| `home.needs.replySub` | 关于订单 {id} 的新消息 | New message about order {id} |
| `home.needs.lowStock` | {title}：剩余 {count} | {title}: {count} left |
| `home.needs.lowStockSub` | 更新库存或标记为售罄 | Update stock or mark it sold out |
| `home.needs.doc` | {label} 将于 {date} 到期 | {label} expires {date} |
| `home.needs.docSub` | 上传更新后的文件 | Upload the renewed document |
| `home.today.title` | 今日收入 | Today's earnings |
| `home.today.orders.one` | {count} 个订单 | {count} order |
| `home.today.orders.other` | {count} 个订单 | {count} orders |
| `home.today.gross` | 销售总额 | Gross sales |
| `home.today.fee` | Ciuna 手续费 | Ciuna fee |
| `home.today.net` | 净额 | Net |
| `home.today.view` | 查看收入 | View earnings |
| `home.today.empty` | 今天还没有已完成的订单。 | No completed orders yet today. |
| `orders.action.acceptBooking` | 接受预约 | Accept booking |
| `orders.tab.board` | 看板 | Board |
| `orders.board.empty` | 暂无 | Nothing here |
| `orders.rejectedReason` | 原因： | Reason: |
| `orders.reject.bodyRefund` | 将向顾客退款 {amount}。顾客会看到您的原因。 | The customer will be refunded {amount}. They will see your reason. |
| `earnings.item.keep` | 您保留 | You keep |
| `earnings.item.reversedNote` | 已冲销：此订单不再计入您的余额。 | Reversed, so this order no longer counts toward your balance. |
| `earnings.methods.sendRow` | 通过 Ciuna Send 提现 | Withdraw via Ciuna Send |
| `earnings.methods.sendRow.help` | 暂不可用。 | Not available yet. |
| `earnings.methods.defaultBadge` | 默认 | Default |
| `home.delta.more` | 比昨天多 {count} 单 | {count} more orders than yesterday |
| `home.delta.fewer` | 比昨天少 {count} 单 | {count} fewer orders than yesterday |
| `earnings.rule.food` | 美食 | Food |
| `earnings.rule.mart` | 超市 | Mart |
| `earnings.rule.experts` | 专家服务 | Expert services |
| `earnings.rule.generic` | 佣金 | Commission |
| `earnings.rule.percent` | {line} {percent}% | {line} {percent}% |
| `earnings.rule.fixed` | {line} 固定费用 | {line} fixed fee |
| `catalog.section.visibility` | 可见性 | Visibility |
| `catalog.field.visible` | 在您的店铺中可见 | Visible in your store |
| `catalog.field.visibleOn` | 保存后顾客可以找到并下单。 | Customers can find and order this product after you save. |
| `catalog.field.visibleOff` | 对顾客隐藏。您可以随时开启。 | Hidden from customers. You can turn it on any time. |
| `catalog.import.fileHint` | CSV 文件，最大 2 MB。 | CSV file, up to 2 MB. |
| `catalog.import.problem` | 有问题 | Has a problem |
| `catalog.fulfilment.unlocks` | 这将解锁什么 | What this unlocks |
| `catalog.fulfilment.unlock.pickup` | 自提地址 | Pickup address |
| `catalog.fulfilment.unlock.pickupHelp` | 顾客可以选择自提。 | Lets customers choose Pickup. |
| `catalog.fulfilment.unlock.delivery` | 一个启用的配送区域 | An active delivery zone |
| `catalog.fulfilment.unlock.deliveryHelp` | 该区域的顾客可以下单配送。 | Lets customers in that area order delivery. |
| `catalog.fulfilment.unlock.digital` | 数字商品 | Digital products |
| `catalog.fulfilment.unlock.digitalHelp` | 无需自提或配送。 | Need neither pickup nor delivery. |
| `messages.pick.title` | 选择一个对话 | Choose a conversation |
| `messages.pick.body` | 在左侧选择顾客以阅读并回复。 | Pick a customer on the left to read and reply. |
| `reviews.editLeft` | 您还可以在 {hours} 小时内修改此回复。 | You can edit this reply for {hours} more hours. |
| `reviews.locked` | 此回复已无法修改。 | This reply can no longer be edited. |
| `merchant.add` | 添加业务 | Add a business |
| `merchant.current` | 当前业务 | Current business |
| `shell.account` | 账户菜单 | Account menu |
| `shell.notifications` | 通知 | Notifications |
| `shell.notifications.count` | 通知：{count} 条待处理 | Notifications: {count} waiting for you |
| `more.group.business` | 业务 | Business |
| `more.group.settings` | 设置 | Settings |
| `more.verification.action` | 需要操作 | Action needed |
| `more.verification.review` | 审核中 | In review |
| `more.verification.rejected` | 已拒绝 | Rejected |
| `more.verification.verified` | 已验证 | Verified |
| `more.team.count` | {count} 人 | {count} people |
| `more.team.count.one` | 1 人 | 1 person |

### `seller/locales/zh/earnings.json` (152 strings)

| Key | Text | English source |
| --- | --- | --- |
| `earnings.title` | 收入 | Earnings |
| `earnings.subtitle` | 你的收入、待结算金额和已打款金额。 | What you have earned, what is waiting, and what has been paid out. |
| `earnings.nav.overview` | 收入 | Earnings |
| `earnings.nav.payouts` | 打款 | Payouts |
| `earnings.nav.methods` | 收款方式 | Payout methods |
| `earnings.available` | 可提现 | Available |
| `earnings.available.help` | 可立即提现 | Ready to withdraw |
| `earnings.pending` | 待结算 | Pending |
| `earnings.pending.help` | 订单履约后 {days} 天可提现 | Available after {days} days, once the order is fulfilled |
| `earnings.inPayout` | 打款中 | In payout |
| `earnings.inPayout.help` | 已申请，等待发出 | Requested and waiting to be sent |
| `earnings.paidOut` | 已打款 | Paid out |
| `earnings.paidOut.help` | 已发送到你的账户 | Already sent to your account |
| `earnings.withdraw` | 提现 | Withdraw |
| `earnings.withdraw.cta` | 申请打款 | Request payout |
| `earnings.withdraw.timing` | Ciuna 会审核打款并发送到你的账户，状态会显示在这里。 | Ciuna reviews payouts and sends them to your account. You'll see the status here. |
| `earnings.withdraw.currency` | 币种 | Currency |
| `earnings.withdraw.method` | 打款至 | Pay out to |
| `earnings.withdraw.noMethod` | 没有已验证的收款方式 | No verified method |
| `earnings.withdraw.unverified.title` | 等待验证 | Waiting for verification |
| `earnings.withdraw.unverified.body` | Ciuna 仍在验证：{names}。验证通过后即可提现。 | Ciuna is still verifying: {names}. You can withdraw once it is verified. |
| `earnings.withdraw.unverified.note` | 暂不可用，正在验证：{names}。 | Not available yet, still being verified: {names}. |
| `earnings.withdraw.none.title` | 没有 {currency} 收款方式 | No payout method for {currency} |
| `earnings.withdraw.none.body` | 请添加 {currency} 银行账户。Ciuna 会在首次打款前进行验证。 | Add a bank account in {currency}. Ciuna verifies it before your first payout. |
| `earnings.methods.manage` | 管理收款方式 | Manage methods |
| `earnings.withdraw.amount` | 金额 | Amount |
| `earnings.withdraw.all` | 全部提现 | Withdraw all |
| `earnings.withdraw.available` | 可提现： | Available: |
| `earnings.withdraw.min` | 最低金额 | Minimum |
| `earnings.withdraw.requested` | 提现金额 | You withdraw |
| `earnings.withdraw.fee` | 打款手续费 | Payout fee |
| `earnings.withdraw.receive` | 实际到账 | You receive |
| `earnings.withdraw.success` | 已提交打款申请。Ciuna 审核后会发送到你的账户。 | Payout requested. Ciuna will review it and send it to your account. |
| `earnings.withdraw.nothing` | 暂无可提现金额。收入在保留期结束后才可提现。 | Nothing available to withdraw yet. Earnings become available after the hold period. |
| `earnings.noAccess.title` | 收入仅限授权成员查看 | Earnings are private |
| `earnings.noAccess.body` | 请联系店主、经理或财务查看收入。 | Ask the owner, a manager or finance to view earnings. |
| `earnings.empty.title` | 暂无收入 | No earnings yet |
| `earnings.empty.body` | 订单履约后，收入会显示在这里，并在 {days} 天后可提现。 | When you fulfil an order, its earnings show here and become available after {days} days. |
| `earnings.statement` | 对账单 | Statement |
| `earnings.statement.help` | 每笔订单的商品、配送、Ciuna 费用和你的实收金额。 | Every order with items, delivery, Ciuna fee and what you keep. |
| `earnings.tab.all` | 全部 | All |
| `earnings.tab.pending` | 待结算 | Pending |
| `earnings.tab.available` | 可提现 | Available |
| `earnings.tab.reversed` | 已冲回 | Reversed |
| `earnings.item.pending` | 待结算 | Pending |
| `earnings.item.available` | 可提现 | Available |
| `earnings.item.reversed` | 已冲回 | Reversed |
| `earnings.item.availableOn` | {date} 可提现 | Available on {date} |
| `earnings.item.availableSince` | 自 {date} 起可提现 | Available since {date} |
| `earnings.empty.all.title` | 暂无收入 | No earnings yet |
| `earnings.empty.all.body` | 已履约的订单会显示在这里。 | Fulfilled orders will appear here. |
| `earnings.empty.pending.title` | 没有待结算款项 | Nothing pending |
| `earnings.empty.pending.body` | 近期履约的订单会在这里等待保留期结束。 | Orders you have fulfilled recently wait here until the hold period ends. |
| `earnings.empty.available.title` | 没有可提现款项 | Nothing available |
| `earnings.empty.available.body` | 已过保留期的收入会显示在这里。 | Earnings that passed the hold period appear here. |
| `earnings.empty.reversed.title` | 没有冲回记录 | Nothing reversed |
| `earnings.empty.reversed.body` | 履约后退款的订单会显示在这里。 | Orders refunded after fulfilment appear here. |
| `earnings.col.order` | 订单 | Order |
| `earnings.col.date` | 日期 | Date |
| `earnings.col.items` | 商品 | Items |
| `earnings.col.delivery` | 配送 | Delivery |
| `earnings.col.fee` | Ciuna 费用 | Ciuna fee |
| `earnings.col.net` | 实收 | You earn |
| `earnings.col.status` | 状态 | Status |
| `earnings.loadMore` | 加载更多 | Load more |
| `earnings.download.title` | 下载对账单 | Download statement |
| `earnings.download.help` | 按日期范围导出所有订单（CSV 文件）。 | Get every order in a date range as a CSV file. |
| `earnings.download.from` | 从 | From |
| `earnings.download.to` | 到 | To |
| `earnings.download.cta` | 下载 CSV | Download CSV |
| `earnings.payouts.title` | 打款 | Payouts |
| `earnings.payouts.subtitle` | 你申请的所有打款及其进度。 | Every payout you requested, and where it stands. |
| `earnings.payouts.noAccess.title` | 打款记录仅限授权成员查看 | Payouts are private |
| `earnings.payouts.noAccess.body` | 请联系店主或财务查看打款。 | Ask the owner or finance to view payouts. |
| `earnings.payouts.empty.title` | 暂无打款 | No payouts yet |
| `earnings.payouts.empty.body` | 你提现后，申请及其状态会显示在这里。 | When you withdraw, the request and its status appear here. |
| `earnings.payouts.empty.cta` | 前往收入 | Go to earnings |
| `earnings.payout.status.requested` | 已申请 | Requested |
| `earnings.payout.status.approved` | 已批准 | Approved |
| `earnings.payout.status.paid` | 已打款 | Paid |
| `earnings.payout.status.rejected` | 已拒绝 | Rejected |
| `earnings.payout.status.cancelled` | 已取消 | Cancelled |
| `earnings.payout.requestedOn` | {date} 申请 | Requested {date} |
| `earnings.payout.fee` | 打款手续费 | Payout fee |
| `earnings.payout.received` | 实际到账 | You received |
| `earnings.payout.method` | 打款至 | Paid to |
| `earnings.payout.paidOn` | 打款日期 | Paid on |
| `earnings.payout.reference` | 参考号 | Reference |
| `earnings.payout.reason` | 原因 | Reason |
| `earnings.payout.note.requested` | 等待 Ciuna 审核。批准前你可以取消。 | Waiting for Ciuna to review. You can cancel until it is approved. |
| `earnings.payout.note.approved` | 已批准。Ciuna 将把款项发送到你的账户。 | Approved. Ciuna will send the money to your account. |
| `earnings.payout.note.paid` | 已发送到你的账户。 | Sent to your account. |
| `earnings.payout.note.rejected` | 未打款。款项已退回可提现余额。 | Not paid. The money is back in your available balance. |
| `earnings.payout.note.cancelled` | 已取消。款项已退回可提现余额。 | Cancelled. The money is back in your available balance. |
| `earnings.payout.cancel` | 取消申请 | Cancel request |
| `earnings.payout.cancel.q` | 取消这笔打款申请？ | Cancel this payout request? |
| `earnings.payout.cancel.body` | 款项会立即退回你的可提现余额。 | The money returns to your available balance right away. |
| `earnings.payout.cancel.confirm` | 取消申请 | Cancel request |
| `earnings.payout.cancel.keep` | 保留申请 | Keep request |
| `earnings.payout.cancelled` | 打款申请已取消。 | Payout request cancelled. |
| `earnings.kind.bank` | 银行账户 | Bank account |
| `earnings.kind.sbp` | SBP（俄罗斯） | SBP (Russia) |
| `earnings.kind.ciuna_send` | Ciuna Send | Ciuna Send |
| `earnings.comingSoon` | 即将推出 | Coming soon |
| `earnings.methods.title` | 收款方式 | Payout methods |
| `earnings.methods.subtitle` | Ciuna 把款项发送到哪里。 | Where Ciuna sends your money. |
| `earnings.methods.add` | 添加方式 | Add method |
| `earnings.methods.add.cta` | 添加方式 | Add method |
| `earnings.methods.default` | 默认 | default |
| `earnings.methods.verified` | 已验证 | Verified |
| `earnings.methods.waiting` | 等待验证 | Waiting for verification |
| `earnings.methods.makeDefault` | 设为默认 | Make default |
| `earnings.methods.defaultSet` | 默认方式已更新。 | Default method updated. |
| `earnings.methods.removed` | 已删除该方式。 | Method removed. |
| `earnings.methods.added` | 已添加。Ciuna 会在首次打款前进行验证。 | Method added. Ciuna will verify it before your first payout. |
| `earnings.methods.remove.q` | 删除这个收款方式？ | Remove this method? |
| `earnings.methods.remove.body` | 之后可以重新添加。进行中的申请仍使用原来的方式。 | You can add it again later. Open payout requests keep their original method. |
| `earnings.methods.verify.title` | Ciuna 会验证新的收款方式 | Ciuna verifies new methods |
| `earnings.methods.verify.body` | 新的收款方式在 Ciuna 验证通过之前无法收款。准备好后这里会显示“已验证”。 | A new method can't receive money until Ciuna has verified it. You'll see "Verified" here when it is ready. |
| `earnings.methods.empty.title` | 没有收款方式 | No payout methods |
| `earnings.methods.empty.body` | 添加银行账户即可提现你的收入。 | Add a bank account so you can withdraw your earnings. |
| `earnings.methods.kind` | 类型 | Type |
| `earnings.methods.currency` | 币种 | Currency |
| `earnings.methods.sbp.rubOnly` | SBP 仅支持卢布（RUB）打款。 | SBP pays out in RUB only. |
| `earnings.methods.label` | 此方式的名称 | Name for this method |
| `earnings.methods.label.hint` | 选填，例如“主账户”。仅你可见。 | Optional, e.g. "Main account". Only you see it. |
| `earnings.methods.privacy` | 这些信息加密保存，之后不会再显示，只显示末 4 位。 | We keep these details encrypted and never show them again. Only the last 4 digits are shown. |
| `earnings.field.phone` | 手机号码 | Phone number |
| `earnings.field.bank_name` | 银行名称 | Bank name |
| `earnings.field.recipient_name` | 收款人姓名 | Recipient name |
| `earnings.field.account_number` | 账号 | Account number |
| `earnings.field.bik` | BIK（选填） | BIK (optional) |
| `earnings.field.swift` | SWIFT（选填） | SWIFT (optional) |
| `earnings.field.iban` | IBAN（选填） | IBAN (optional) |
| `earnings.field.country` | 国家/地区（选填） | Country (optional) |
| `errors.INSUFFICIENT_BALANCE` | 可提现余额不足。 | Your available balance is lower than this amount. |
| `errors.BELOW_MINIMUM_PAYOUT` | 金额低于最低打款金额。 | This is below the minimum payout. |
| `errors.PAYOUT_METHOD_NOT_FOUND` | 找不到该收款方式。 | That payout method wasn't found. |
| `errors.PAYOUT_METHOD_NOT_VERIFIED` | 该收款方式尚未通过验证。 | That method hasn't been verified yet. |
| `errors.PAYOUT_CURRENCY_MISMATCH` | 收款方式的币种与本次打款不一致。 | The method's currency doesn't match this payout. |
| `errors.AMOUNT_INVALID` | 请输入大于 0 的金额，最多 2 位小数。 | Enter an amount greater than zero, with up to 2 decimals. |
| `errors.TOO_MANY_OPEN_PAYOUTS` | 你已有 3 笔未完成的打款申请。请等待其中一笔完成或取消一笔。 | You already have 3 open payout requests. Wait for one to finish or cancel one. |
| `errors.PAYOUT_FEE_INVALID` | 打款手续费高于金额，请输入更大的金额。 | The payout fee is higher than the amount. Try a larger amount. |
| `errors.METHOD_IN_USE` | 该方式有未完成的打款，请在完成后再试。 | This method has an open payout. Try again after it finishes. |
| `errors.TOO_MANY_METHODS` | 最多可保存 10 个收款方式。 | You can keep up to 10 payout methods. |
| `errors.KIND_INVALID` | 请选择方式类型。 | Choose a method type. |
| `errors.CURRENCY_NOT_SUPPORTED` | 该方式不支持此币种。 | This method type doesn't support that currency. |
| `errors.PHONE_INVALID` | 请输入 10 到 15 位的手机号码。 | Enter a phone number with 10 to 15 digits. |
| `errors.FIELD_REQUIRED` | 必填 | Required |
| `errors.PAYOUT_NOT_FOUND` | 找不到该打款。 | That payout wasn't found. |
| `errors.DATE_INVALID` | 请选择有效的日期范围。 | Choose a valid date range. |
| `errors.METHOD_HAS_HISTORY` | 此收款方式已用于过往提现，无法删除。请改为将其他方式设为默认。 | This method was used for a past payout, so it can't be removed. Make another method the default instead. |

### `seller/locales/zh/expert.json` (219 strings)

| Key | Text | English source |
| --- | --- | --- |
| `expert.only.title` | 仅限专家 | Experts only |
| `expert.only.body` | 此部分仅适用于专家账户。请切换到您的专家业务后使用。 | This section is for expert accounts. Switch to your expert business to use it. |
| `expert.only.home` | 返回首页 | Go to home |
| `expert.unit.label` | 单位 | Unit |
| `expert.unit.minutes` | 分钟 | minutes |
| `expert.unit.hours` | 小时 | hours |
| `expert.unit.min` | 分钟 | min |
| `expert.unit.h` | 小时 | h |
| `expert.services.title` | 服务 | Services |
| `expert.services.subtitle` | 客户可以向您预约的内容。 | What customers can book with you. |
| `expert.services.add` | 添加服务 | Add service |
| `expert.services.empty.title` | 还没有服务 | No services yet |
| `expert.services.empty.body` | 添加您的第一项服务，然后设置可预约时间，客户即可预约。 | Add your first service, then set your availability so customers can book. |
| `expert.services.per_hour` | 每小时 | per hour |
| `expert.services.slots` | 未来 14 天内有 {count} 个空闲时段 | {count} open slots in the next 14 days |
| `expert.services.slots.none` | 未来 14 天没有空闲时段 | No open slots in the next 14 days |
| `expert.services.slots.set` | 设置可预约时间 | Set availability |
| `expert.services.publish` | 发布此服务 | Publish this service |
| `expert.services.published` | 客户可见 | Visible to customers |
| `expert.services.publish_toggle` | 发布 {title} | Publish {title} |
| `expert.services.needs_instructions` | 发布前请先填写会面说明。 | Add meeting instructions before publishing. |
| `expert.pricing.hourly` | 按小时计费 | Hourly rate |
| `expert.pricing.fixed` | 每次固定价格 | Fixed price per session |
| `expert.pricing.quote` | 按需报价 | Quote on request |
| `expert.delivery.online` | 线上 | Online |
| `expert.delivery.in_person` | 线下 | In person |
| `expert.delivery.both` | 线上或线下 | Online or in person |
| `expert.form.new` | 新建服务 | New service |
| `expert.form.edit` | 编辑服务 | Edit service |
| `expert.form.notlive.title` | Ciuna 批准您的业务后即可发布 | You can publish once Ciuna approves your business |
| `expert.form.rejected` | 此服务未通过审核。请修改标题、描述或说明并保存，以重新提交审核。 | This service was rejected. Edit the title, description or instructions and save to send it for review again. |
| `expert.form.review` | 标题、描述或说明的更改将先由 Ciuna 审核，客户才能看到。 | Changes to the title, description or instructions are reviewed by Ciuna before customers see them. |
| `expert.form.basics` | 基本信息 | Basics |
| `expert.form.basics.hint` | 请使用您提供服务的语言填写，其他语言为选填。 | Write in the language you serve. Other languages are optional. |
| `expert.form.title` | 服务名称 | Service title |
| `expert.form.title.ph` | 例如：职业辅导课程 | For example, Career coaching session |
| `expert.form.short` | 简短描述 | Short description |
| `expert.form.lang.hint` | 留空时，客户将看到默认语言的内容。 | If you leave this empty, customers see the default language. |
| `expert.form.err.title` | 请输入名称。 | Enter a title. |
| `expert.form.pricing` | 定价 | Pricing |
| `expert.form.pricing.type` | 定价方式 | Pricing type |
| `expert.form.rate` | 每小时价格 | Rate per hour |
| `expert.form.price` | 每次价格 | Price per session |
| `expert.form.currency` | 货币 | Currency |
| `expert.form.quote.note` | 按需报价的服务无法在线预约，因此这里不提供该选项。 | Services priced on request can't be booked online, so they aren't offered here. |
| `expert.form.err.amount` | 请输入大于零的金额。 | Enter an amount greater than zero. |
| `expert.form.duration` | 时长 | Duration |
| `expert.form.duration.default` | 每次时长 | Session length |
| `expert.form.duration.min` | 最短时长 | Shortest session |
| `expert.form.duration.max` | 最长时长 | Longest session |
| `expert.form.optional` | 选填 | Optional |
| `expert.form.err.duration` | 请输入大于零的时长。 | Enter a session length greater than zero. |
| `expert.form.err.range` | 最短时长不能超过最长时长。 | The shortest session can't be longer than the longest. |
| `expert.form.delivery` | 服务方式 | Delivery |
| `expert.form.delivery.mode` | 会面方式 | Where sessions happen |
| `expert.form.instructions` | 会面说明 | Meeting instructions |
| `expert.form.instructions.hint` | 客户如何加入或在哪里见面。发布时必填。 | How customers join or where to meet. Required to publish. |
| `expert.form.err.instructions` | 发布前请填写会面说明。 | Add meeting instructions to publish. |
| `expert.form.rules` | 预约规则 | Booking rules |
| `expert.form.lead` | 会面前最短提前时间 | Minimum notice before a session |
| `expert.form.lead.hint` | 客户无法预约在此时间内开始的时段。 | Customers can't book slots that start sooner than this. |
| `expert.form.cutoff` | 会面前付款截止时间 | Payment deadline before a session |
| `expert.form.cutoff.hint` | 预约须在开始前至少此时间内完成付款。 | A booking must be paid at least this long before it starts. |
| `expert.form.err.number` | 请输入 0 或更大的数。 | Enter zero or more. |
| `expert.form.timezone` | 服务时区 | Service time zone |
| `expert.form.timezone.hint` | 客户将按此时区查看会面时间。 | Customers see session times with this zone. |
| `expert.form.save_draft` | 保存草稿 | Save draft |
| `expert.form.publish` | 发布 | Publish |
| `expert.form.unsaved` | 有未保存的更改 | Unsaved changes |
| `expert.form.toast.saved` | 服务已保存 | Service saved |
| `expert.form.toast.published` | 服务已发布 | Service published |
| `expert.form.toast.unpublished` | 服务已取消发布 | Service unpublished |
| `expert.form.unpublish.title` | 停止接受预约 | Stop accepting bookings |
| `expert.form.unpublish.body` | 服务将对客户隐藏，空闲时段也会被移除。 | The service is hidden from customers and its open slots are removed. |
| `expert.form.unpublish.action` | 取消发布 | Unpublish |
| `expert.form.unpublish.confirm` | 取消发布此服务？ | Unpublish this service? |
| `expert.form.unpublish.confirm.body` | 客户将不再看到该服务，空闲时段也会被移除。已有预约不受影响。若要重新提供，请发布并保存可预约时间。 | Customers will no longer see it and its open slots will be removed. Existing bookings stay. To offer it again, publish it and save your availability. |
| `expert.avail.title` | 可预约时间 | Availability |
| `expert.avail.subtitle` | 设置客户可预约的时间。保存后将重新生成空闲时段。 | Set when customers can book you. Saving rebuilds your open slots. |
| `expert.avail.service` | 服务 | Service |
| `expert.avail.noservice.title` | 请先添加服务 | Add a service first |
| `expert.avail.noservice.body` | 可预约时间按服务分别设置。 | Availability is set per service. |
| `expert.avail.settings` | 日程设置 | Schedule settings |
| `expert.avail.timezone` | 时区 | Time zone |
| `expert.avail.timezone.hint` | 每周时间按此时区计算。 | Your weekly hours are in this time zone. |
| `expert.avail.slot` | 时段长度 | Slot length |
| `expert.avail.slot.hint` | 每个开放时间段会按此长度切分。 | Each open range is cut into slots of this length. |
| `expert.avail.window.start` | 开始日期 | Bookable from |
| `expert.avail.window.end` | 结束日期 | Bookable until |
| `expert.avail.window.days` | 客户可提前 {count} 天预约（最多 {max} 天）。 | Customers can book {count} days ahead (up to {max}). |
| `expert.avail.window.max` | 时间范围最多 {max} 天。 | The window can be at most {max} days. |
| `expert.avail.window.reset` | 未来 60 天 | Next 60 days |
| `expert.avail.window.order` | 结束日期不能早于开始日期。 | The end date must be on or after the start date. |
| `expert.avail.window.long` | 请选择不超过 {max} 天的范围。 | Choose a window of {max} days or fewer. |
| `expert.avail.weekly` | 每周时间 | Weekly hours |
| `expert.avail.weekly.hint` | 时间为 {zone} 时区。同一天可添加多个时间段以留出休息。 | Times are in {zone}. Add several ranges to a day for breaks. |
| `expert.avail.closed` | 不可预约 | Not available |
| `expert.avail.add` | 添加时间 | Add hours |
| `expert.avail.copy` | 复制到其他日期 | Copy to other days |
| `expert.avail.copy.title` | 将{day}复制到其他日期 | Copy {day} to other days |
| `expert.avail.copy.hint` | 所选日期的现有时间将被替换。 | Hours on the days you choose will be replaced. |
| `expert.avail.copy.apply` | 复制时间 | Copy hours |
| `expert.avail.from` | 开始时间 | Start time |
| `expert.avail.to` | 结束时间 | End time |
| `expert.avail.issue.order` | 结束时间必须晚于开始时间。 | End time must be after start time. |
| `expert.avail.issue.overlap` | 此时间段与同一天的另一时间段重叠。 | This range overlaps another range on the same day. |
| `expert.avail.issue.empty` | 请填写开始和结束时间。 | Enter both a start and an end time. |
| `expert.avail.norules` | 尚未设置每周时间。现在保存将移除您的空闲时段。 | No weekly hours yet. Saving now will remove your open slots. |
| `expert.avail.save` | 保存并更新时段 | Save and update slots |
| `expert.avail.saves_note` | 已预约的会面不会受影响。 | Booked sessions are never changed. |
| `expert.avail.fix` | 请修正标出的字段后再保存。 | Fix the highlighted fields to save. |
| `expert.avail.saved` | 可预约时间已保存 | Availability saved |
| `expert.avail.preview` | 未来 14 天 | Next 14 days |
| `expert.avail.preview.hint` | 客户可预约的时段（{zone}）。已生成 {count} 个时段。 | Slots customers can book, in {zone}. {count} slots created. |
| `expert.avail.preview.empty` | 未来 14 天没有时段。请检查每周时间和预约范围。 | No slots in the next 14 days. Check your weekly hours and booking window. |
| `expert.slots.title` | 即将到来的时段 | Upcoming slots |
| `expert.slots.hint` | 对无法接待的时段可屏蔽或删除。时间为 {zone}。 | Block a slot you can't take, or remove it. Times in {zone}. |
| `expert.slots.range` | 时间范围 | Time range |
| `expert.slots.next` | 未来 {count} 天 | Next {count} days |
| `expert.slots.empty` | 此期间没有时段 | No slots in this period |
| `expert.slots.empty.body` | 保存每周时间以生成时段。 | Save your weekly hours to create slots. |
| `expert.slots.status.available` | 空闲 | Open |
| `expert.slots.status.booked` | 已预约 | Booked |
| `expert.slots.status.blocked` | 已屏蔽 | Blocked |
| `expert.slots.block` | 屏蔽 | Block |
| `expert.slots.unblock` | 取消屏蔽 | Unblock |
| `expert.slots.view_booking` | 查看预约 | View booking |
| `expert.slots.delete.title` | 删除此时段？ | Delete this slot? |
| `expert.slots.delete.action` | 删除时段 | Delete slot |
| `expert.slots.deleted` | 时段已删除 | Slot deleted |
| `expert.timeoff.title` | 休假 | Time off |
| `expert.timeoff.hint` | 屏蔽日期范围内的所有空闲时段。已预约的会面保持不变。 | Block all open slots in a date range. Sessions already booked stay as they are. |
| `expert.timeoff.from` | 休假开始日 | First day off |
| `expert.timeoff.to` | 休假结束日 | Last day off |
| `expert.timeoff.service` | 服务 | Service |
| `expert.timeoff.all` | 所有服务 | All services |
| `expert.timeoff.zone` | 按 {zone} 时区的整天计算。 | Whole days in {zone}. |
| `expert.timeoff.action` | 屏蔽这些日期 | Block these dates |
| `expert.timeoff.confirm` | 屏蔽 {from} 至 {to}？ | Block {from} to {to}? |
| `expert.timeoff.confirm.body` | 此范围内（{scope}）的所有空闲时段将被屏蔽（时区 {zone}）。您可以逐个取消屏蔽。 | All open slots for {scope} in this range will be blocked (time zone {zone}). You can unblock them one by one. |
| `expert.timeoff.done` | 已屏蔽 {count} 个时段。 | {count} slots blocked. |
| `expert.bookings.title` | 预约 | Bookings |
| `expert.bookings.subtitle` | 客户已预约并付款的会面。 | Sessions customers have booked and paid for. |
| `expert.bookings.tab.requests` | 待处理 | Requests |
| `expert.bookings.tab.upcoming` | 即将开始 | Upcoming |
| `expert.bookings.tab.past` | 已结束 | Past |
| `expert.bookings.empty.requests.title` | 没有待处理的请求 | No requests to answer |
| `expert.bookings.empty.requests.body` | 新的已付款预约会显示在这里，等待您接受。 | New paid bookings appear here for you to accept. |
| `expert.bookings.empty.upcoming.title` | 没有即将开始的会面 | No upcoming sessions |
| `expert.bookings.empty.upcoming.body` | 已接受的会面在结束前会显示在这里。 | Accepted sessions show up here until they end. |
| `expert.bookings.empty.past.title` | 没有已结束的会面 | No past sessions |
| `expert.bookings.empty.past.body` | 已完成和已取消的会面会列在这里。 | Completed and cancelled sessions are listed here. |
| `expert.bookings.status.new` | 新请求 | New request |
| `expert.bookings.status.accepted` | 已接受 | Accepted |
| `expert.bookings.status.preparing` | 进行中 | In progress |
| `expert.bookings.status.completed` | 已完成 | Completed |
| `expert.bookings.status.cancelled` | 已取消 | Cancelled |
| `expert.bookings.session` | 会面 | Session |
| `expert.bookings.customer` | 客户 | Customer |
| `expert.bookings.no_slot` | 未设置时间 | No time set |
| `expert.bookings.yours` | 您的时间 | Your time |
| `expert.bookings.session_time` | 会面时间（{zone}） | Session time ({zone}) |
| `expert.bookings.your_time` | 您设备的时间（{zone}） | Your device time ({zone}) |
| `expert.bookings.accept` | 接受 | Accept |
| `expert.bookings.accepted` | 已接受预约 | Booking accepted |
| `expert.bookings.complete` | 标记为已完成 | Mark as completed |
| `expert.bookings.view` | 查看详情 | View details |
| `expert.bookings.overdue` | 请立即处理，此请求已逾期 | Answer now, this request is overdue |
| `expert.bookings.respond_by` | 请在 {time} 前回复 | Respond by {time} |
| `expert.bookings.exception` | 需要关注 | Needs attention |
| `expert.detail.title` | 预约 | Booking |
| `expert.detail.session` | 会面 | Session |
| `expert.detail.price` | 价格 | Price |
| `expert.detail.customer` | 客户 | Customer |
| `expert.detail.note` | 客户留言 | Note from the customer |
| `expert.detail.exception` | 此预约需要 Ciuna 处理 | This booking needs attention from Ciuna |
| `expert.detail.meeting` | 会议链接 | Meeting link |
| `expert.detail.meeting.hint` | 保存后客户即可看到。 | The customer sees this once you save it. |
| `expert.detail.meeting.url` | 会议链接（https） | Meeting link (https) |
| `expert.detail.meeting.url.err` | 请输入以 https:// 开头的链接 | Enter a link that starts with https:// |
| `expert.detail.meeting.instructions` | 给客户的说明 | Instructions for the customer |
| `expert.detail.meeting.save` | 保存会议信息 | Save meeting details |
| `expert.detail.meeting.saved` | 会议信息已保存 | Meeting details saved |
| `expert.detail.meeting.open` | 打开当前链接 | Open current link |
| `expert.detail.reject` | 拒绝 | Decline |
| `expert.detail.reject.title` | 拒绝此预约？ | Decline this booking? |
| `expert.detail.reject.body` | 客户将获得全额退款并收到原因说明。此操作无法撤销。 | The customer is refunded in full and told why. This can't be undone. |
| `expert.detail.reject.reason` | 拒绝原因 | Reason for declining |
| `expert.detail.reject.confirm` | 拒绝预约 | Decline booking |
| `expert.detail.fulfill` | 标记为已完成 | Mark as completed |
| `expert.detail.fulfill.wait` | 会面于 {time} 结束后即可标记完成。 | You can complete this session after it ends at {time}. |
| `expert.detail.fulfill.title` | 将此会面标记为已完成？ | Mark this session as completed? |
| `expert.detail.fulfill.body` | 这表示会面已进行，并会开始结算您的收入。 | This confirms the session took place and starts your payout. |
| `expert.detail.fulfill.note` | 会面备注 | Note about the session |
| `expert.detail.done.accept` | 已接受预约 | Booking accepted |
| `expert.detail.done.reject` | 已拒绝预约并退款 | Booking declined and refunded |
| `expert.detail.done.fulfill` | 会面已标记为完成 | Session marked as completed |
| `errors.SERVICE_INVALID` | 请检查服务信息后重试。 | Check the service details and try again. |
| `errors.HAS_FUTURE_BOOKINGS` | 此服务还有 {count} 个未到期的已预约会面。请先完成或拒绝它们，再取消发布。 | This service has {count} upcoming booked sessions. Complete or decline them first, then unpublish. |
| `errors.SLOT_BOOKED` | 此时段已被预约，无法更改。 | This slot is already booked, so it can't be changed. |
| `errors.SLOT_NOT_EDITABLE` | 无法更改此时段。 | This slot can't be changed. |
| `errors.SLOT_NOT_FOUND` | 此时段已不存在。请刷新列表。 | This slot no longer exists. Refresh the list. |
| `errors.SLOT_OVERLAP` | 此时间与已有时段重叠。 | This time overlaps an existing slot. |
| `errors.SLOT_IN_PAST` | 请选择未来的时间。 | Choose a time in the future. |
| `errors.WINDOW_TOO_LONG` | 预约范围最多 {maxDays} 天。 | The booking window can be at most {maxDays} days. |
| `errors.WINDOW_INVALID` | 请输入有效的开始和结束日期。 | Enter a valid start and end date. |
| `errors.WINDOW_ORDER` | 结束日期不能早于开始日期。 | The end date must be on or after the start date. |
| `errors.RULE_TIME_ORDER` | 每个时间段的结束时间必须晚于开始时间。 | Each range must end after it starts. |
| `errors.TIMEZONE_INVALID` | 请选择有效的时区。 | Choose a valid time zone. |
| `errors.RANGE_ORDER` | 结束日期必须晚于开始日期。 | The end date must be after the start date. |
| `errors.RANGE_TOO_LONG` | 请选择不超过 {maxDays} 天的范围。 | Choose a range of {maxDays} days or fewer. |
| `errors.SCHEDULE_REQUIRED` | 请先保存每周时间。 | Save your weekly hours first. |
| `errors.EXPERT_ONLY` | 此功能仅适用于专家账户。 | This is only available to expert accounts. |
| `errors.EXPERT_PROFILE_NOT_FOUND` | 您的专家资料尚未设置。请先完成设置。 | Your expert profile isn't set up yet. Finish setup first. |
| `errors.SERVICE_NOT_FOUND` | 此服务已不存在。 | This service no longer exists. |
| `errors.MEETING_URL_INVALID` | 请输入以 https:// 开头的链接 | Enter a link that starts with https:// |
| `errors.MEETING_EMPTY` | 请填写会议链接或说明。 | Add a meeting link or instructions. |
| `errors.BOOKING_CLOSED` | 此预约已关闭，无法再更改会议信息。 | This booking is closed, so meeting details can't be changed. |
| `errors.BOOKING_NOT_PAID` | 此预约尚未付款。 | This booking isn't paid yet. |

### `seller/locales/zh/home.json` (13 strings)

| Key | Text | English source |
| --- | --- | --- |
| `home.welcome` | 欢迎，{name} | Welcome, {name} |
| `home.setup.body` | 完成这些步骤后，Ciuna 将审核您的业务。 | Finish these steps and Ciuna will review your business. |
| `home.live.body` | 今天需要您处理的事项。 | What needs your attention today. |
| `home.setup.title` | 准备开始销售 | Get ready to sell |
| `home.newOrders` | 新订单 | New orders |
| `home.newBookings` | 新的预约请求 | New booking requests |
| `home.needsAction` | 等待您接受 | Waiting for you to accept |
| `home.inProgress` | 进行中 | In progress |
| `more.storeProfile` | 店铺资料 | Store profile |
| `more.expertProfile` | 专家资料 | Expert profile |
| `more.verification` | 验证与文件 | Verification and documents |
| `more.fulfillment` | 自提与配送 | Pickup and delivery |
| `more.team` | 团队 | Team |

### `seller/locales/zh/messages.json` (33 strings)

| Key | Text | English source |
| --- | --- | --- |
| `messages.title` | 消息 | Messages |
| `messages.subtitle` | 就订单与顾客沟通。及时回复，让订单更顺畅。 | Chat with customers about their orders. Reply quickly to keep orders moving. |
| `messages.noAccess.title` | 您没有查看消息的权限 | You don't have access to messages |
| `messages.noAccess.body` | 请让企业所有者为您开通消息权限。 | Ask the business owner to give you the messages permission. |
| `messages.empty.title` | 暂无消息 | No messages yet |
| `messages.empty.body` | 顾客就订单给您留言后，对话会显示在这里。 | When a customer writes about an order, the conversation appears here. |
| `messages.customer` | 顾客 | Customer |
| `messages.you` | 您 | You |
| `messages.unread` | {count} 条未读 | {count} unread |
| `messages.closed.chip` | 聊天已关闭 | Chat closed |
| `messages.back` | 全部消息 | All messages |
| `messages.viewOrder` | 查看订单 | View order |
| `messages.history` | 对话 | Conversation |
| `messages.thread.empty` | 此聊天还没有消息，在下方打个招呼吧。 | No messages in this chat yet. Say hello below. |
| `messages.closed.title` | 此聊天已关闭 | This chat is closed |
| `messages.closed.body` | 订单完成或取消 14 天后聊天将关闭，您仍可查看历史记录。 | Chats close 14 days after an order is completed or cancelled. You can still see the history. |
| `messages.unavailable.title` | 聊天不可用 | Chat isn't available |
| `messages.unavailable.body` | 顾客付款后才能开启聊天。 | Chat opens once the customer has paid for the order. |
| `messages.composer.label` | 消息 | Message |
| `messages.composer.placeholder` | 输入消息 | Write a message |
| `messages.composer.closed` | 聊天已关闭 | Chat is closed |
| `messages.send` | 发送 | Send |
| `messages.seen` | 已读 | Seen |
| `messages.quick.label` | 快捷回复 | Quick replies |
| `messages.quick.preparing` | 您的订单正在准备中。 | Your order is being prepared. |
| `messages.quick.delivery` | 我们会在一小时内送达。 | We will deliver within the hour. |
| `messages.quick.thanks` | 感谢您的订单！ | Thank you for your order! |
| `messages.quick.question` | 请确认一下您的地址。 | Could you confirm your address, please? |
| `errors.CHAT_CLOSED` | 此聊天已关闭，消息未发送。 | This chat is closed, so the message was not sent. |
| `errors.RATE_LIMITED` | 发送过于频繁，请稍等片刻再试。 | You're sending messages too fast. Wait a little and try again. |
| `errors.MESSAGE_EMPTY` | 发送前请先输入消息。 | Write a message before sending. |
| `errors.MESSAGE_TOO_LONG` | 消息太长了，请控制在 2000 字以内。 | That message is too long. Keep it under 2000 characters. |
| `errors.CHAT_UNAVAILABLE` | 此订单无法使用聊天。 | Chat isn't available for this order. |

### `seller/locales/zh/orders.json` (89 strings)

| Key | Text | English source |
| --- | --- | --- |
| `orders.title` | 订单 | Orders |
| `orders.subtitle` | 新订单会显示在这里。尽快接单，减少客户等待。 | New orders appear here. Accept quickly to keep customers waiting less. |
| `orders.tab.new` | 新订单 | New |
| `orders.tab.active` | 处理中 | In progress |
| `orders.tab.done` | 已完成 | Completed |
| `orders.tab.cancelled` | 已取消 | Cancelled |
| `orders.empty.new.title` | 没有新订单 | No new orders |
| `orders.empty.new.body` | 客户付款后，新订单会立即显示在这里。 | New orders show up here as soon as customers pay. |
| `orders.empty.active.title` | 没有处理中的订单 | Nothing in progress |
| `orders.empty.active.body` | 你接受的订单会显示在这里，直到你标记为已完成。 | Orders you accept appear here until you mark them fulfilled. |
| `orders.empty.done.title` | 还没有已完成的订单 | No completed orders yet |
| `orders.empty.done.body` | 已完成的订单会列在这里。 | Fulfilled orders will be listed here. |
| `orders.empty.cancelled.title` | 没有已取消的订单 | No cancelled orders |
| `orders.empty.cancelled.body` | 已拒绝和已取消的订单会列在这里。 | Rejected and cancelled orders will be listed here. |
| `orders.noAccess.title` | 你无权访问订单 | You don't have access to orders |
| `orders.noAccess.body` | 请让商家所有者为你开通订单权限。 | Ask the business owner to give you the orders permission. |
| `orders.number` | 订单 {id} | Order {id} |
| `orders.moreItems` | 另有 {count} 件 | +{count} more |
| `orders.mode.delivery` | 配送 | Delivery |
| `orders.mode.pickup` | 自提 | Pickup |
| `orders.mode.digital` | 数字商品 | Digital |
| `orders.mode.booking` | 预约 | Booking |
| `orders.due.in` | {time}后到期 | Due in {time} |
| `orders.due.overdue` | 已逾期 {time} | Overdue by {time} |
| `orders.duration.hm` | {h} 小时 {m} 分钟 | {h} h {m} min |
| `orders.duration.m` | {m} 分钟 | {m} min |
| `orders.status.new` | 新订单 | New |
| `orders.status.accepted` | 已接单 | Accepted |
| `orders.status.preparing` | 准备中 | Preparing |
| `orders.status.completed` | 已完成 | Completed |
| `orders.status.cancelled` | 已取消 | Cancelled |
| `orders.action.accept` | 接单 | Accept |
| `orders.action.start` | 开始准备 | Start preparing |
| `orders.action.fulfill` | 标记为已完成 | Mark as fulfilled |
| `orders.action.reject` | 拒绝 | Reject |
| `orders.view` | 查看订单 | View order |
| `orders.back` | 返回订单 | Back to orders |
| `orders.toast.newOrder` | 新订单 | New order |
| `orders.toast.accept` | 订单 {id} 已接单 | Order {id} accepted |
| `orders.toast.start` | 订单 {id} 准备中 | Order {id} is being prepared |
| `orders.toast.fulfill` | 订单 {id} 已标记为完成 | Order {id} marked as fulfilled |
| `orders.toast.reject` | 订单 {id} 已拒绝 | Order {id} rejected |
| `orders.items` | 商品 | Items |
| `orders.col.item` | 商品 | Item |
| `orders.col.qty` | 数量 | Qty |
| `orders.col.unit` | 单价 | Unit price |
| `orders.col.total` | 小计 | Total |
| `orders.subtotal` | 商品小计 | Subtotal |
| `orders.deliveryFee` | 配送费 | Delivery fee |
| `orders.total` | 合计 | Total |
| `orders.note` | 客户备注 | Customer note |
| `orders.slot` | 预约时间 | Booking time |
| `orders.slot.timezone` | 时间按 {tz} 显示 | Times shown in {tz} |
| `orders.digital` | 数字内容 | Digital content |
| `orders.digital.hint` | 这是你发送给客户的内容。 | This is what you sent to the customer. |
| `orders.customer` | 客户 | Customer |
| `orders.customer.unknown` | 未提供姓名 | Name not provided |
| `orders.pickup` | 自提 | Pickup |
| `orders.pickup.hours` | 自提时间：{hours} | Pickup hours: {hours} |
| `orders.deliveryTo` | 配送至 | Deliver to |
| `orders.location` | 地点 | Location |
| `orders.noAddress` | 未提供地址 | No address provided |
| `orders.timeline` | 时间线 | Timeline |
| `orders.timeline.empty` | 暂无动态。 | No activity yet. |
| `orders.exception.title` | 此订单需要处理 | This order needs attention |
| `orders.reject.title` | 拒绝此订单？ | Reject this order? |
| `orders.reject.body` | 将全额退款给客户，客户会看到你的原因。 | The customer will be refunded in full. They will see your reason. |
| `orders.reject.reason` | 原因 | Reason |
| `orders.reject.placeholder` | 向客户说明原因，例如：缺货 | Tell the customer why, for example: out of stock |
| `orders.reject.confirm` | 拒绝订单 | Reject order |
| `orders.fulfill.title` | 将此订单标记为已完成？ | Mark this order as fulfilled? |
| `orders.fulfill.body` | 为客户添加备注，例如已交付的内容。 | Add a note for the customer, such as what was delivered. |
| `orders.fulfill.bodyDigital` | 添加客户将收到的内容和备注。 | Add the content the customer receives, and a note. |
| `orders.fulfill.note` | 给客户的备注 | Note for the customer |
| `orders.fulfill.noteHint` | 必填，至少一句话。 | Required. At least one sentence. |
| `orders.fulfill.content` | 数字内容 | Digital content |
| `orders.fulfill.contentHint` | 兑换码、链接或说明，客户可见。 | Codes, links or instructions. The customer sees this. |
| `orders.fulfill.confirm` | 标记为已完成 | Mark as fulfilled |
| `errors.INVALID_TRANSITION` | 订单状态已变化，请刷新后重试。 | Something about this order changed. Refresh and try again. |
| `errors.REJECT_NOT_ALLOWED` | 此订单现在无法拒绝，请联系客服。 | This order can't be rejected now. Contact support. |
| `errors.REASON_REQUIRED` | 请输入至少 3 个字符的原因。 | Enter a reason of at least 3 characters. |
| `errors.CONTACT_SUPPORT` | 此订单需要 Ciuna 客服协助，请联系客服。 | This order needs Ciuna support. Contact support to continue. |
| `errors.DELIVERY_CONTENT_REQUIRED` | 标记为完成前，请先添加数字内容。 | Add the digital content before marking this order fulfilled. |
| `errors.NOTE_REQUIRED` | 请为客户添加备注。 | Add a note for the customer. |
| `errors.SESSION_NOT_ENDED` | 预约结束后才能标记为已完成。 | You can mark a booking fulfilled after the session has ended. |
| `errors.ORDER_NOT_FOUND` | 找不到此订单。 | We couldn't find this order. |
| `errors.INVALID_ACTION` | 此操作不可用。 | That action isn't available. |
| `errors.UNAVAILABLE` | 无法连接 Ciuna，请检查网络后重试。 | We couldn't reach Ciuna. Check your connection and try again. |
| `orders.messageCustomer` | 联系客户 | Message the customer |

### `seller/locales/zh/reviews.json` (32 strings)

| Key | Text | English source |
| --- | --- | --- |
| `reviews.title` | 评价 | Reviews |
| `reviews.subtitle` | 顾客对您订单的评价。 | What customers say about your orders. |
| `reviews.nav` | 评价 | Reviews |
| `reviews.stars` | 满分 5 分，{n} 分 | {n} out of 5 |
| `reviews.starsShort` | {n} 星 | {n} stars |
| `reviews.count` | {count} 条评价 | {count} reviews |
| `reviews.count.one` | 1 条评价 | 1 review |
| `reviews.distribution` | 按星级统计 | Reviews by star rating |
| `reviews.customer` | 顾客 | Customer |
| `reviews.noText` | 没有文字评价。 | No written review. |
| `reviews.yourReply` | 您的回复 | Your reply |
| `reviews.reply` | 回复 | Reply |
| `reviews.editReply` | 编辑回复 | Edit reply |
| `reviews.reply.public` | 您的回复是公开的。 | Your reply is public. |
| `reviews.reply.label` | 回复 | Reply |
| `reviews.reply.editWindow` | 发布后 24 小时内可以修改此回复。 | You can edit this reply for 24 hours after posting. |
| `reviews.reply.counter` | {used} / {max} | {used} / {max} |
| `reviews.reply.send` | 发布回复 | Post reply |
| `reviews.reply.sent` | 回复已发布。 | Reply posted. |
| `reviews.tab.all` | 全部 | All |
| `reviews.tab.needsReply` | 待回复 | Needs reply |
| `reviews.empty.title` | 暂无评价 | No reviews yet |
| `reviews.empty.body` | 订单完成后，顾客可以进行评价。评价会显示在这里。 | Customers can review an order after it is fulfilled. Reviews show up here. |
| `reviews.empty.caughtUp.title` | 已全部处理 | You're all caught up |
| `reviews.empty.caughtUp.body` | 每条评价都已回复。 | Every review has a reply. |
| `reviews.more` | 显示更多 | Show more |
| `reviews.noAccess.title` | 您无权查看评价 | You don't have access to reviews |
| `reviews.noAccess.body` | 请联系企业所有者授予您订单权限。 | Ask the business owner to give you the orders permission. |
| `errors.REPLY_REQUIRED` | 请输入回复内容。 | Write a reply. |
| `errors.REPLY_TOO_LONG` | 回复不能超过 600 个字符。 | Keep the reply to 600 characters. |
| `errors.REPLY_LOCKED` | 此回复已无法修改。 | This reply can no longer be edited. |
| `errors.REVIEW_NOT_FOUND` | 找不到该评价。 | We couldn't find that review. |

### `seller/locales/zh/settings.json` (49 strings)

| Key | Text | English source |
| --- | --- | --- |
| `profile.subtitle` | 客户在您的页面上看到的内容。 | What customers see on your page. |
| `profile.basics` | 基本信息 | Basics |
| `profile.description` | 简介 | Description |
| `profile.description.hint` | 向客户介绍您是谁、提供什么。须用您的默认语言填写。 | Tell customers who you are and what you offer. Required in your default language. |
| `profile.images` | 图片 | Images |
| `profile.cover.upload` | 上传封面图片 | Upload cover image |
| `profile.contact` | 联系方式与地区 | Contact and region |
| `profile.phone` | 电话 | Phone |
| `profile.website` | 网站 | Website |
| `profile.currency` | 默认币种 | Default currency |
| `team.title` | 团队 | Team |
| `team.subtitle` | 可以登录此业务的人员。 | People who can sign in to this business. |
| `team.invite` | 邀请成员 | Invite a person |
| `team.invite.cta` | 发送邀请 | Send invite |
| `team.invite.link` | 邀请链接 | Invite link |
| `team.invite.copied` | 链接已复制 | Link copied |
| `team.pending` | 待接受的邀请 | Pending invites |
| `team.remove.q` | 移除此成员？ | Remove this person? |
| `team.remove` | 移除 | Remove |
| `team.you` | 您 | You |
| `team.role.hint` | 经理负责日常工作。员工处理订单和商品。财务可查看收入和提现。 | Managers run daily work. Staff handle orders and listings. Finance sees earnings and payouts. |
| `errors.TOO_MANY_INVITES` | 待接受的邀请过多，请先取消一些。 | Too many open invites. Cancel some first. |
| `errors.ROLE_INVALID` | 请选择角色。 | Choose a role. |
| `errors.OWNER_IMMUTABLE` | 无法更改或移除所有者。 | The owner can't be changed or removed. |
| `errors.CANNOT_CHANGE_SELF` | 您无法更改自己的角色。 | You can't change your own role. |
| `errors.INVITE_INVALID` | 此邀请无效或已过期。 | This invite is invalid or has expired. |
| `errors.INVITE_EMAIL_MISMATCH` | 请使用收到邀请的邮箱地址登录。 | Sign in with the email address that was invited. |
| `team.role` | 角色 | Role |
| `notif.title` | 提醒 | Alerts |
| `notif.subtitle` | 订单或预约需要您处理时，第一时间通知您。 | Get told the moment an order or booking needs you. |
| `notif.channels` | 提醒发送到哪里 | Where to send alerts |
| `notif.email` | 电子邮件 | Email |
| `notif.email.body` | 向您的账户邮箱发送简短消息。 | A short message to your account email. |
| `notif.telegram.body` | 通过 Telegram 即时接收消息。绑定账户后开启。 | Instant messages in Telegram. Link your account to turn this on. |
| `notif.telegram.linked` | 已连接 {name} | Connected {name} |
| `notif.telegram.connect` | 连接 Telegram | Connect Telegram |
| `notif.telegram.disconnect` | 断开连接 | Disconnect |
| `notif.telegram.open` | 在 Telegram 中完成 | Finish in Telegram |
| `notif.telegram.openLink` | 打开 Telegram 并点击 Start | Open Telegram and press Start |
| `notif.telegram.unavailable` | Telegram 提醒暂未开放，邮件提醒可正常使用。 | Telegram alerts are not available yet. Email alerts still work. |
| `notif.kinds` | 提醒内容 | What to alert |
| `notif.kinds.body` | 关闭不需要的提醒。 | Turn off alerts you don't need. |
| `notif.kind.order_new` | 新订单 | New orders |
| `notif.kind.booking_new` | 新的预约请求 | New booking requests |
| `notif.kind.payout_update` | 提现进度 | Payout updates |
| `notif.kind.merchant_status` | 申请进度变更 | Changes to your application |
| `more.alerts` | 提醒 | Alerts |
| `more.payoutMethods` | 收款方式 | Payout methods |
| `notif.kind.message_new` | 客户的新消息 | New customer messages |

### `seller/locales/zh/setup.json` (61 strings)

| Key | Text | English source |
| --- | --- | --- |
| `onb.title` | 设置您的业务 | Set up your business |
| `onb.subtitle` | 告诉我们您销售什么。大部分内容之后都可以修改。 | Tell us what you sell. You can change most of this later. |
| `onb.type` | 您想在 Ciuna 上做什么？ | What do you want to do on Ciuna? |
| `onb.type.store` | 销售商品 | Sell products |
| `onb.type.store.body` | 餐饮、食品杂货和各类商品，支持配送或自提。 | Food, groceries and goods, delivered or picked up. |
| `onb.type.expert` | 提供专业服务 | Offer my expertise |
| `onb.type.expert.body` | 翻译、法律咨询、辅导等按时段预约的服务。 | Translation, legal help, tutoring and other services, booked by time. |
| `onb.name.store` | 店铺名称 | Store name |
| `onb.name.expert` | 您的姓名或工作室名称 | Your name or practice name |
| `onb.line` | 市场板块 | Marketplace section |
| `onb.line.hint` | 客户将在这里找到您。 | Where customers will find you. |
| `onb.line.food` | 餐饮 | Food |
| `onb.line.mart` | 超市（食品杂货和商品） | Mart (groceries and goods) |
| `onb.country` | 您的业务注册在哪个国家或地区？ | Where is your business based? |
| `onb.country.hint` | 这决定我们需要您提供哪些验证文件。 | This decides which verification documents we ask for. |
| `onb.operating` | 您在哪里销售或配送？ | Where do you sell or deliver? |
| `onb.operating.hint` | 这些地区的客户将看到您的商品或服务。 | Customers there will see your listings. |
| `onb.languages` | 您服务客户使用的语言 | Languages you serve customers in |
| `onb.languages.hint` | 请至少选择一种。您将用这些语言撰写商品或服务信息。 | Choose at least one. You write your listings in these languages. |
| `onb.invite` | 您受邀加入 {name} | You are invited to join {name} |
| `onb.invite.accept` | 加入 | Join |
| `setup.title` | 设置与验证 | Set up and verify |
| `setup.subtitle` | 请完成以下步骤。上线前，Ciuna 会审核您的业务。 | Complete these steps. Ciuna reviews your business before you go live. |
| `setup.done` | 已完成 | Done |
| `setup.todo` | 待办 | To do |
| `setup.optional` | 可选 | Optional |
| `setup.approved` | 您的业务已通过 | Your business is approved |
| `setup.item.profile` | 业务资料 | Business profile |
| `setup.item.logo` | 标志 | Logo |
| `setup.item.tier` | 选择验证类型 | Choose verification type |
| `setup.item.kyb_fields` | 验证信息 | Verification details |
| `setup.item.kyb_documents` | 验证文件 | Verification documents |
| `setup.item.first_listing` | 首个商品或服务 | First listing |
| `setup.profile.body` | 请用您的主要语言填写简介，并添加联系方式。 | Add your description in your main language and contact details. |
| `setup.profile.cta` | 编辑资料 | Edit profile |
| `setup.logo.upload` | 上传标志 | Upload logo |
| `setup.verify.title` | 验证 | Verification |
| `setup.verify.body` | 根据业务所在地不同，我们要求的文件也不同。 | We ask for different documents depending on where your business is based. |
| `setup.verify.tier` | 验证类型 | Verification type |
| `setup.tier1.body` | 适用于个人和个体卖家。额度较低。 | For individuals and self-employed sellers. Lower limits. |
| `setup.tier2.body` | 适用于已注册公司。享有完整额度。 | For registered companies. Full limits. |
| `setup.docs.title` | 文件 | Documents |
| `doc.pending` | 审核中 | In review |
| `doc.approved` | 已通过 | Approved |
| `doc.rejected` | 已拒绝 | Rejected |
| `doc.expired` | 已过期 | Expired |
| `setup.listing.store` | 添加您的第一个商品 | Add your first product |
| `setup.listing.expert` | 添加您的第一项服务 | Add your first service |
| `setup.listing.body` | 现在可先保存为草稿。Ciuna 批准您的业务后即可发布。 | Save it as a draft now. You can publish once Ciuna approves your business. |
| `setup.listing.addProduct` | 添加商品 | Add product |
| `setup.listing.addService` | 添加服务 | Add service |
| `setup.submit.title` | 提交审核 | Submit for review |
| `setup.submit.ready` | 一切就绪。Ciuna 通常会在一个工作日内完成审核。 | Everything is ready. Ciuna usually reviews within one business day. |
| `setup.submit.notReady` | 还有步骤未完成。完成后即可提交。 | Some steps are still open. You can submit once they are done. |
| `setup.submit.cta` | 提交审核 | Submit for review |
| `setup.submitted` | 已提交审核 | Submitted for review |
| `errors.APPLICATION_INCOMPLETE` | 还有步骤未完成。请完成后再提交。 | Some steps are still open. Complete them, then submit. |
| `errors.TIER_INVALID` | 请选择验证类型。 | Choose a verification type. |
| `errors.DOCUMENT_LOCKED` | 已通过的文件无法移除。 | Approved documents can't be removed. |
| `errors.PATH_INVALID` | 该上传无效，请重试。 | That upload isn't valid. Try again. |
| `errors.EXPIRY_INVALID` | 请填写未来的到期日期。 | Use a future expiry date. |

### `seller/locales/pt/auth.json` (18 strings)

| Key | Text | English source |
| --- | --- | --- |
| `auth.login.title` | Entrar na Ciuna Seller | Sign in to Ciuna Seller |
| `auth.login.subtitle` | Use sua conta Ciuna. Novo na Ciuna? Crie uma conta em um minuto. | Use your Ciuna account. New to Ciuna? Create one in a minute. |
| `auth.login.cta` | Entrar | Sign in |
| `auth.register.title` | Comece a vender na Ciuna | Start selling on Ciuna |
| `auth.register.subtitle` | Alcance pessoas que vivem no exterior e procuram o que você oferece. | Reach people living abroad who are looking for what you offer. |
| `auth.register.cta` | Criar conta | Create account |
| `auth.noAccount` | Ainda não tem conta? | No account yet? |
| `auth.haveAccount` | Já tem uma conta? | Already have an account? |
| `auth.email` | E-mail | Email |
| `auth.password` | Senha | Password |
| `auth.passwordHint` | Pelo menos 8 caracteres. | At least 8 characters. |
| `auth.passwordShort` | Use pelo menos 8 caracteres na senha. | Use at least 8 characters for your password. |
| `auth.firstName` | Nome | First name |
| `auth.lastName` | Sobrenome | Last name |
| `auth.invalid` | E-mail ou senha incorretos. | Email or password is incorrect. |
| `auth.exists` | Já existe uma conta com este e-mail. Entre nela. | An account with this email already exists. Sign in instead. |
| `auth.checkEmail.title` | Verifique seu e-mail | Check your email |
| `auth.checkEmail.body` | Enviamos um link de confirmação para {email}. Abra o link e depois entre. | We sent a confirmation link to {email}. Open it, then sign in. |

### `seller/locales/pt/catalog.json` (147 strings)

| Key | Text | English source |
| --- | --- | --- |
| `catalog.title` | Catálogo | Catalog |
| `catalog.intro` | Tudo o que você vende. Alterações de preço e estoque valem na hora. | Everything you sell. Edits to prices and stock apply straight away. |
| `catalog.back` | Voltar ao catálogo | Back to catalog |
| `catalog.search` | Buscar produtos | Search products |
| `catalog.new.title` | Adicionar produto | Add product |
| `catalog.edit.title` | Editar produto | Edit product |
| `catalog.action.add` | Adicionar produto | Add product |
| `catalog.action.import` | Importar de CSV | Import from CSV |
| `catalog.action.pause` | Pausar | Pause |
| `catalog.action.publish` | Publicar | Publish |
| `catalog.action.saveDraft` | Salvar como rascunho | Save as draft |
| `catalog.action.moveToDraft` | Voltar para rascunho | Move to draft |
| `catalog.action.saveChanges` | Salvar alterações | Save changes |
| `catalog.action.archive` | Arquivar produto | Archive product |
| `catalog.link.fulfilment` | Zonas de entrega e retirada | Delivery zones and pickup |
| `catalog.tab.all` | Todos | All |
| `catalog.tab.live` | Publicados | Live |
| `catalog.tab.draft` | Rascunhos | Draft |
| `catalog.tab.archived` | Arquivados | Archived |
| `catalog.status.draft` | Rascunho | Draft |
| `catalog.status.live` | Publicado | Live |
| `catalog.status.archived` | Arquivado | Archived |
| `catalog.stock.count` | {n} em estoque | {n} in stock |
| `catalog.stock.unlimited` | Ilimitado | Unlimited |
| `catalog.stock.soldOut` | Esgotado | Sold out |
| `catalog.stock.soldOutToggle` | Marcar {title} como esgotado | Mark {title} as sold out |
| `catalog.review.pending` | Em análise | Under review |
| `catalog.review.rejected` | Recusado: {note} | Rejected: {note} |
| `catalog.empty.title` | Nenhum produto ainda | No products yet |
| `catalog.empty.body` | Adicione seu primeiro produto ou importe vários de uma vez a partir de um arquivo CSV. | Add your first product, or import many at once from a CSV file. |
| `catalog.empty.noMatch` | Nenhum produto encontrado. | No products match. |
| `catalog.toast.savedDraft` | Salvo como rascunho | Saved as draft |
| `catalog.toast.published` | Publicado | Published |
| `catalog.toast.paused` | Pausado | Paused |
| `catalog.toast.archived` | Produto arquivado | Product archived |
| `catalog.toast.soldOutOn` | Marcado como esgotado | Marked as sold out |
| `catalog.toast.soldOutOff` | De volta ao estoque | Back in stock |
| `catalog.toast.fulfilmentSaved` | Entrega e retirada salvas | Fulfilment saved |
| `catalog.form.moderationHint` | Alterações em textos e fotos entram no ar na hora. A Ciuna as revisa depois e pode pedir que você as corrija. | Changes to text and photos go live straight away. Ciuna reviews them afterwards and may ask you to fix them. |
| `catalog.form.publishLater` | Você poderá publicar quando a Ciuna aprovar seu negócio. | You can publish once Ciuna approves your business. |
| `catalog.form.unsaved` | Você tem alterações não salvas. | You have unsaved changes. |
| `catalog.form.fixErrors` | Confira os campos destacados. | Check the highlighted fields. |
| `catalog.section.basics` | Informações básicas | Basics |
| `catalog.section.photos` | Fotos | Photos |
| `catalog.section.price` | Preço | Price |
| `catalog.section.stock` | Estoque | Stock |
| `catalog.section.fulfilment` | Entrega do pedido | Fulfilment |
| `catalog.lang.defaultHint` | Idioma padrão. É exibido quando o idioma do cliente não está preenchido. | Default language. This is shown when a customer's language isn't filled in. |
| `catalog.lang.otherHint` | Opcional. Deixe em branco para mostrar o idioma padrão. | Optional. Leave blank to show your default language. |
| `catalog.field.title` | Nome | Name |
| `catalog.field.short` | Descrição curta | Short description |
| `catalog.field.shortHint` | Aparece nas listas. Até 300 caracteres. | Shown in lists. Up to 300 characters. |
| `catalog.field.long` | Descrição completa | Full description |
| `catalog.field.category` | Categoria | Category |
| `catalog.field.listPrice` | Preço | Price |
| `catalog.field.salePrice` | Preço promocional | Sale price |
| `catalog.field.salePriceHint` | Opcional. Precisa ser menor que o preço. | Optional. Must be lower than the price. |
| `catalog.field.currency` | Moeda | Currency |
| `catalog.field.unlimited` | Estoque ilimitado | Unlimited stock |
| `catalog.field.stock` | Quantidade em estoque | Quantity in stock |
| `catalog.field.soldOut` | Esgotado | Sold out |
| `catalog.field.soldOutHint` | Os clientes não conseguem pedir enquanto você não desativar esta opção. | Customers can't order it until you switch this off. |
| `catalog.cat.Meals` | Refeições | Meals |
| `catalog.cat.Snacks` | Lanches | Snacks |
| `catalog.cat.Drinks` | Bebidas | Drinks |
| `catalog.cat.Other` | Outros | Other |
| `catalog.cat.Groceries` | Mercearia | Groceries |
| `catalog.cat.Household` | Casa | Household |
| `catalog.cat.Electronics` | Eletrônicos | Electronics |
| `catalog.photos.hint` | A primeira foto é a principal. Adicione até mais 8. | The first photo is the main one. Add up to 8 more. |
| `catalog.photos.main` | Foto principal | Main photo |
| `catalog.photos.addMain` | Adicionar foto principal | Add main photo |
| `catalog.photos.add` | Adicionar foto | Add photo |
| `catalog.photos.gallery` | Mais fotos ({n} de 8) | More photos ({n} of 8) |
| `catalog.mode.delivery` | Entrega | Delivery |
| `catalog.mode.pickup` | Retirada | Pickup |
| `catalog.mode.digital` | Digital | Digital |
| `catalog.mode.deliveryHint` | Você entrega este produto ao cliente. | You deliver this to the customer. |
| `catalog.mode.pickupHint` | O cliente retira no seu ponto de retirada. | The customer collects it from your pickup location. |
| `catalog.mode.digitalHint` | Entregue on-line, não há nada para enviar. | Delivered online, nothing to ship. |
| `catalog.archive.title` | Arquivar este produto? | Archive this product? |
| `catalog.archive.body` | Ele sairá da loja. Pedidos anteriores mantêm seus dados e você ainda o encontra em Arquivados. | It will disappear from the store. Past orders keep their details, and you can still find it under Archived. |
| `catalog.fulfilment.title` | Entrega e retirada | Delivery and pickup |
| `catalog.fulfilment.intro` | Informe onde os clientes retiram os pedidos e quais áreas você atende. Você precisa de zonas de entrega para publicar produtos com entrega e dos dados de retirada para publicar produtos com retirada. | Set where customers collect orders and which areas you deliver to. You need delivery zones to publish delivery products, and pickup details to publish pickup products. |
| `catalog.fulfilment.pickup` | Retirada | Pickup |
| `catalog.fulfilment.pickupHint` | Os clientes veem isto ao escolher retirada. | Customers see this when they choose pickup. |
| `catalog.fulfilment.location` | Endereço de retirada | Pickup address |
| `catalog.fulfilment.hours` | Horário de funcionamento | Opening hours |
| `catalog.fulfilment.hoursHint` | Por exemplo: seg. a sáb., das 9h às 20h | For example: Mon to Sat, 9:00 to 20:00 |
| `catalog.fulfilment.notes` | Observações para os clientes | Notes for customers |
| `catalog.fulfilment.zones` | Zonas de entrega | Delivery zones |
| `catalog.fulfilment.zonesHint` | Os clientes só podem pedir entrega nas zonas que você listar. | Customers can order delivery only in the zones you list. |
| `catalog.fulfilment.noZones` | Nenhuma zona de entrega ainda. | No delivery zones yet. |
| `catalog.fulfilment.city` | Cidade | City |
| `catalog.fulfilment.district` | Bairro | District |
| `catalog.fulfilment.fee` | Taxa de entrega | Delivery fee |
| `catalog.fulfilment.active` | Ativa | Active |
| `catalog.fulfilment.inactive` | Inativa | Inactive |
| `catalog.fulfilment.addZone` | Adicionar zona | Add zone |
| `catalog.fulfilment.pickupMissing` | Adicione o endereço de retirada para publicar produtos com retirada. | Add your pickup address to publish pickup products. |
| `catalog.fulfilment.zonesMissing` | Adicione pelo menos uma zona de entrega ativa para publicar produtos com entrega. | Add at least one active delivery zone to publish delivery products. |
| `catalog.fulfilment.setup` | Configurar | Set up |
| `catalog.import.title` | Importar produtos | Import products |
| `catalog.import.intro` | Adicione até 200 produtos a partir de um arquivo CSV. Eles são criados como rascunhos para você conferir. | Add up to 200 products from a CSV file. They are created as drafts so you can check them first. |
| `catalog.import.step1` | 1. Baixe o modelo | 1. Get the template |
| `catalog.import.step1Hint` | Um produto por linha. Até {max} linhas. Use ponto ou vírgula nos decimais. | Fill in one product per row. Up to {max} rows. Use a period or comma for decimals. |
| `catalog.import.template` | Baixar modelo | Download template |
| `catalog.import.choose` | Escolher arquivo CSV | Choose CSV file |
| `catalog.import.badFile` | Não foi possível ler o arquivo. Use o modelo e confira as colunas title e list_price. | We couldn't read that file. Use the template and check the title and list_price columns. |
| `catalog.import.step2` | 2. Confira seus produtos | 2. Check your products |
| `catalog.import.summary` | {file}: {valid} prontos, {invalid} com problemas. Apenas as linhas prontas são importadas. | {file}: {valid} ready, {invalid} with problems. Only ready rows are imported. |
| `catalog.import.tooMany` | Apenas as primeiras {max} de {total} linhas são usadas. | Only the first {max} of {total} rows are used. |
| `catalog.import.lineUnknown` | As categorias são verificadas na criação de cada produto. | Categories are checked when each product is created. |
| `catalog.import.col.row` | Linha | Row |
| `catalog.import.col.status` | Status | Status |
| `catalog.import.ready` | Pronto | Ready |
| `catalog.import.progress` | {done} de {total} importados | {done} of {total} imported |
| `catalog.import.step3` | 3. Importar | 3. Import |
| `catalog.import.result` | {created} criados, {failed} com falha. | {created} created, {failed} failed. |
| `catalog.import.draftNote` | Os produtos criados são rascunhos. Abra cada um para adicionar fotos e publique. | Created products are drafts. Open each one to add photos, then publish. |
| `catalog.import.failedRow` | Linha {line} ({title}): {reason} | Row {line} ({title}): {reason} |
| `catalog.import.another` | Importar outro arquivo | Import another file |
| `catalog.import.viewCatalog` | Ver catálogo | View catalog |
| `catalog.import.start` | Importar {n} produtos | Import {n} products |
| `catalog.import.finished` | Importação concluída | Import finished |
| `errors.PRODUCT_NOT_FOUND` | Não encontramos esse produto. | We couldn't find that product. |
| `errors.STORE_ONLY` | Somente lojas podem gerenciar produtos. | Only stores can manage products. |
| `errors.TITLE_REQUIRED` | Informe um nome com pelo menos 2 caracteres. | Enter a name with at least 2 characters. |
| `errors.PRICE_REQUIRED` | Informe um preço maior que 0. | Enter a price above 0. |
| `errors.SALE_PRICE_TOO_HIGH` | O preço promocional precisa ser menor que o preço. | The sale price must be lower than the price. |
| `errors.INVALID_STOCK` | Informe um número inteiro igual ou maior que 0. | Enter a whole number of 0 or more. |
| `errors.CATEGORY_OUTSIDE_LINE` | Essa categoria não está disponível para a sua loja. | That category isn't available for your store. |
| `errors.FULFILLMENT_REQUIRED` | Escolha entrega, retirada ou digital. | Choose delivery, pickup or digital. |
| `errors.GALLERY_INVALID` | Use até 8 fotos com links https. | Use up to 8 photos with https links. |
| `errors.LISTING_REJECTED` | Este anúncio foi recusado. Edite o texto ou as fotos para enviá-lo de novo. | This listing was rejected. Edit the text or photos to submit it again. |
| `errors.VENDOR_UNAVAILABLE` | Sua loja não está disponível para os clientes no momento. | Your store isn't available to customers right now. |
| `errors.PICKUP_CONFIGURATION_REQUIRED` | Adicione o endereço de retirada antes de publicar produtos com retirada. | Add your pickup address before publishing pickup products. |
| `errors.DELIVERY_ZONE_REQUIRED` | Adicione uma zona de entrega antes de publicar produtos com entrega. | Add a delivery zone before publishing delivery products. |
| `errors.PAYMENT_METHOD_REQUIRED` | Adicione uma forma de pagamento antes de publicar. | Add a payment method before publishing. |
| `errors.VENDOR_REQUIRED` | Configure sua loja antes de adicionar produtos. | Set up your store before adding products. |
| `errors.TRANSLATIONS_INVALID` | Algumas traduções não são válidas. | Some translations aren't valid. |
| `errors.STATUS_INVALID` | Escolha rascunho, publicado ou arquivado. | Choose draft, live or archived. |
| `errors.TOO_MANY_ZONES` | Você pode adicionar até 200 zonas. | You can add up to 200 zones. |
| `errors.ZONE_INVALID` | Informe uma cidade e um bairro para cada zona. | Enter a city and a district for every zone. |
| `errors.ZONE_FEE_INVALID` | Informe uma taxa de entrega igual ou maior que 0. | Enter a delivery fee of 0 or more. |
| `errors.ZONE_CURRENCY_INVALID` | Escolha uma moeda compatível para a zona. | Choose a supported currency for the zone. |
| `errors.ZONE_DUPLICATE` | Cada cidade e bairro só pode aparecer uma vez. | Each city and district can be listed only once. |

### `seller/locales/pt/common.json` (151 strings)

| Key | Text | English source |
| --- | --- | --- |
| `app.name` | Ciuna Seller | Ciuna Seller |
| `nav.home` | Início | Home |
| `nav.orders` | Pedidos | Orders |
| `nav.bookings` | Reservas | Bookings |
| `nav.catalog` | Catálogo | Catalog |
| `nav.services` | Serviços | Services |
| `nav.messages` | Mensagens | Messages |
| `nav.earnings` | Ganhos | Earnings |
| `nav.profile` | Perfil | Profile |
| `nav.store` | Loja | Store |
| `nav.availability` | Disponibilidade | Availability |
| `nav.settings` | Configurações | Settings |
| `nav.more` | Mais | More |
| `action.save` | Salvar alterações | Save changes |
| `action.cancel` | Cancelar | Cancel |
| `action.continue` | Continuar | Continue |
| `action.back` | Voltar | Back |
| `action.retry` | Tentar novamente | Try again |
| `action.signOut` | Sair | Sign out |
| `action.add` | Adicionar | Add |
| `action.remove` | Remover | Remove |
| `action.edit` | Editar | Edit |
| `action.close` | Fechar | Close |
| `state.loading` | Carregando | Loading |
| `state.saved` | Salvo | Saved |
| `state.required` | Obrigatório | Required |
| `status.draft` | Rascunho | Draft |
| `status.in_review` | Em análise | In review |
| `status.live` | Ativo | Live |
| `status.paused` | Pausado | Paused |
| `status.rejected` | Rejeitado | Rejected |
| `status.suspended` | Suspenso | Suspended |
| `type.store` | Loja | Store |
| `type.expert` | Especialista | Expert |
| `role.owner` | Proprietário | Owner |
| `role.manager` | Gerente | Manager |
| `role.staff` | Equipe | Staff |
| `role.finance` | Financeiro | Finance |
| `language.label` | Idioma | Language |
| `merchant.switch` | Trocar de negócio | Switch business |
| `banner.review.title` | Sua solicitação está em análise | Your application is in review |
| `banner.review.body` | A Ciuna está conferindo seus dados. Você pode continuar preparando seus anúncios. | Ciuna is checking your details. You can keep preparing your listings. |
| `banner.rejected.title` | Sua solicitação precisa de ajustes | Your application needs changes |
| `banner.suspended.title` | Seu negócio está suspenso | Your business is suspended |
| `banner.paused.title` | Você não está aceitando novos pedidos | You are not accepting new orders |
| `banner.paused.action` | Retomar vendas | Resume selling |
| `banner.draft.title` | Conclua a configuração para começar a vender | Finish setup to start selling |
| `banner.draft.action` | Continuar configuração | Continue setup |
| `errors.generic` | Algo deu errado. Tente novamente. | Something went wrong. Try again. |
| `errors.UNAUTHENTICATED` | Entre para continuar. | Sign in to continue. |
| `errors.FORBIDDEN` | Você não tem acesso a esta área. | You don't have access to this. |
| `errors.NO_MERCHANT` | Crie um negócio ou entre em um para continuar. | Create or join a business to continue. |
| `errors.MERCHANT_NOT_LIVE` | Você poderá publicar depois que a Ciuna aprovar seu negócio. | You can publish once Ciuna approves your business. |
| `errors.MERCHANT_SUSPENDED` | Seu negócio está suspenso. Fale com o suporte. | Your business is suspended. Contact support. |
| `errors.MERCHANT_STATUS_NOT_ALLOWED` | Isso não está disponível no seu status atual. | This isn't available in your current status. |
| `errors.DISPLAY_NAME_INVALID` | Informe um nome com 2 a 80 caracteres. | Enter a name between 2 and 80 characters. |
| `errors.COUNTRY_INVALID` | Escolha um país. | Choose a country. |
| `errors.LANGUAGE_INVALID` | Escolha pelo menos um idioma compatível. | Choose at least one supported language. |
| `errors.EMAIL_INVALID` | Informe um e-mail válido. | Enter a valid email address. |
| `errors.URL_INVALID` | Use um link que comece com https://. | Use a link that starts with https://. |
| `errors.CURRENCY_INVALID` | Escolha uma moeda compatível. | Choose a supported currency. |
| `errors.MERCHANT_LIMIT_REACHED` | Você pode ter até 5 negócios. | You can own up to 5 businesses. |
| `errors.UNSUPPORTED_FILE_TYPE` | Use uma imagem JPG, PNG ou WebP, ou um PDF para documentos. | Use a JPG, PNG or WebP image, or a PDF for documents. |
| `errors.FILE_TOO_LARGE` | O arquivo é grande demais. Escolha um arquivo menor. | That file is too large. |
| `errors.UPLOAD_FAILED` | Falha no envio. Tente novamente. | Upload failed. Try again. |
| `image.replace` | Substituir imagem | Replace image |
| `action.upload` | Enviar arquivo | Upload |
| `action.submit` | Enviar | Submit |
| `action.done` | Concluído | Done |
| `state.default` | padrão | default |
| `noAccess.title` | Você não tem acesso a esta página | You don't have access to this page |
| `noAccess.body` | Peça ao proprietário do negócio para lhe dar acesso. | Ask the business owner to give you access. |
| `noAccess.back` | Voltar ao início | Back to Home |
| `home.setup.progress` | Progresso da configuração | Setup progress |
| `home.setup.count` | {done} de {total} concluídos | {done} of {total} done |
| `home.overdue` | Em atraso | Overdue |
| `home.inProgress.help` | Aceitos ou em preparo | Accepted or preparing |
| `home.needs.title` | Precisa de você | Needs you |
| `home.needs.count.one` | {count} item | {count} item |
| `home.needs.count.other` | {count} itens | {count} items |
| `home.needs.empty.title` | Tudo em dia | You are all caught up |
| `home.needs.empty.body` | Nada precisa de você agora. | Nothing needs you right now. |
| `home.needs.accept.one` | Aceitar 1 novo pedido | Accept 1 new order |
| `home.needs.accept.other` | Aceitar {count} novos pedidos | Accept {count} new orders |
| `home.needs.acceptBooking.one` | Aceitar 1 pedido de reserva | Accept 1 booking request |
| `home.needs.acceptBooking.other` | Aceitar {count} pedidos de reserva | Accept {count} booking requests |
| `home.needs.acceptSub.due` | O mais antigo vence em {time} | The oldest is due in {time} |
| `home.needs.acceptSub.overdue` | O mais antigo está atrasado {time} | The oldest is overdue by {time} |
| `home.needs.acceptSub.none` | Aguardando sua aceitação | Waiting for you to accept |
| `home.needs.reply` | Responder a {name} | Reply to {name} |
| `home.needs.replySub` | Nova mensagem sobre o pedido {id} | New message about order {id} |
| `home.needs.lowStock` | {title}: restam {count} | {title}: {count} left |
| `home.needs.lowStockSub` | Atualize o estoque ou marque como esgotado | Update stock or mark it sold out |
| `home.needs.doc` | {label} expira em {date} | {label} expires {date} |
| `home.needs.docSub` | Envie o documento renovado | Upload the renewed document |
| `home.today.title` | Ganhos de hoje | Today's earnings |
| `home.today.orders.one` | {count} pedido | {count} order |
| `home.today.orders.other` | {count} pedidos | {count} orders |
| `home.today.gross` | Vendas brutas | Gross sales |
| `home.today.fee` | Taxa da Ciuna | Ciuna fee |
| `home.today.net` | Líquido | Net |
| `home.today.view` | Ver ganhos | View earnings |
| `home.today.empty` | Nenhum pedido concluído hoje. | No completed orders yet today. |
| `orders.action.acceptBooking` | Aceitar reserva | Accept booking |
| `orders.tab.board` | Quadro | Board |
| `orders.board.empty` | Nada aqui | Nothing here |
| `orders.rejectedReason` | Motivo: | Reason: |
| `orders.reject.bodyRefund` | O cliente será reembolsado em {amount}. Ele verá o seu motivo. | The customer will be refunded {amount}. They will see your reason. |
| `earnings.item.keep` | Você recebe | You keep |
| `earnings.item.reversedNote` | Estornado: este pedido não conta mais no seu saldo. | Reversed, so this order no longer counts toward your balance. |
| `earnings.methods.sendRow` | Sacar via Ciuna Send | Withdraw via Ciuna Send |
| `earnings.methods.sendRow.help` | Ainda não disponível. | Not available yet. |
| `earnings.methods.defaultBadge` | Padrão | Default |
| `home.delta.more` | {count} pedidos a mais que ontem | {count} more orders than yesterday |
| `home.delta.fewer` | {count} pedidos a menos que ontem | {count} fewer orders than yesterday |
| `earnings.rule.food` | Comida | Food |
| `earnings.rule.mart` | Mercado | Mart |
| `earnings.rule.experts` | Serviços de especialistas | Expert services |
| `earnings.rule.generic` | Comissão | Commission |
| `earnings.rule.percent` | {line} {percent}% | {line} {percent}% |
| `earnings.rule.fixed` | {line}: taxa fixa | {line} fixed fee |
| `catalog.section.visibility` | Visibilidade | Visibility |
| `catalog.field.visible` | Visível na sua loja | Visible in your store |
| `catalog.field.visibleOn` | Os clientes poderão encontrar e pedir este produto depois de salvar. | Customers can find and order this product after you save. |
| `catalog.field.visibleOff` | Oculto dos clientes. Você pode ativar quando quiser. | Hidden from customers. You can turn it on any time. |
| `catalog.import.fileHint` | Arquivo CSV, até 2 MB. | CSV file, up to 2 MB. |
| `catalog.import.problem` | Com problema | Has a problem |
| `catalog.fulfilment.unlocks` | O que isso libera | What this unlocks |
| `catalog.fulfilment.unlock.pickup` | Endereço de retirada | Pickup address |
| `catalog.fulfilment.unlock.pickupHelp` | Os clientes podem escolher retirada. | Lets customers choose Pickup. |
| `catalog.fulfilment.unlock.delivery` | Uma zona de entrega ativa | An active delivery zone |
| `catalog.fulfilment.unlock.deliveryHelp` | Clientes dessa área podem pedir entrega. | Lets customers in that area order delivery. |
| `catalog.fulfilment.unlock.digital` | Produtos digitais | Digital products |
| `catalog.fulfilment.unlock.digitalHelp` | Não precisam de retirada nem de entrega. | Need neither pickup nor delivery. |
| `messages.pick.title` | Escolha uma conversa | Choose a conversation |
| `messages.pick.body` | Escolha um cliente à esquerda para ler e responder. | Pick a customer on the left to read and reply. |
| `reviews.editLeft` | Você pode editar esta resposta por mais {hours} h. | You can edit this reply for {hours} more hours. |
| `reviews.locked` | Esta resposta não pode mais ser editada. | This reply can no longer be edited. |
| `merchant.add` | Adicionar um negócio | Add a business |
| `merchant.current` | Negócio atual | Current business |
| `shell.account` | Menu da conta | Account menu |
| `shell.notifications` | Notificações | Notifications |
| `shell.notifications.count` | Notificações: {count} aguardando você | Notifications: {count} waiting for you |
| `more.group.business` | Negócio | Business |
| `more.group.settings` | Configurações | Settings |
| `more.verification.action` | Ação necessária | Action needed |
| `more.verification.review` | Em análise | In review |
| `more.verification.rejected` | Rejeitado | Rejected |
| `more.verification.verified` | Verificado | Verified |
| `more.team.count` | {count} pessoas | {count} people |
| `more.team.count.one` | 1 pessoa | 1 person |

### `seller/locales/pt/earnings.json` (152 strings)

| Key | Text | English source |
| --- | --- | --- |
| `earnings.title` | Ganhos | Earnings |
| `earnings.subtitle` | O que você ganhou, o que está pendente e o que já foi pago. | What you have earned, what is waiting, and what has been paid out. |
| `earnings.nav.overview` | Ganhos | Earnings |
| `earnings.nav.payouts` | Repasses | Payouts |
| `earnings.nav.methods` | Métodos de recebimento | Payout methods |
| `earnings.available` | Disponível | Available |
| `earnings.available.help` | Pronto para sacar | Ready to withdraw |
| `earnings.pending` | Pendente | Pending |
| `earnings.pending.help` | Disponível em {days} dias, depois que o pedido for cumprido | Available after {days} days, once the order is fulfilled |
| `earnings.inPayout` | Em repasse | In payout |
| `earnings.inPayout.help` | Solicitado, aguardando envio | Requested and waiting to be sent |
| `earnings.paidOut` | Pago | Paid out |
| `earnings.paidOut.help` | Já enviado para sua conta | Already sent to your account |
| `earnings.withdraw` | Sacar | Withdraw |
| `earnings.withdraw.cta` | Solicitar repasse | Request payout |
| `earnings.withdraw.timing` | A Ciuna analisa os repasses e envia para sua conta. Você verá o status aqui. | Ciuna reviews payouts and sends them to your account. You'll see the status here. |
| `earnings.withdraw.currency` | Moeda | Currency |
| `earnings.withdraw.method` | Repassar para | Pay out to |
| `earnings.withdraw.noMethod` | Nenhum método verificado | No verified method |
| `earnings.withdraw.unverified.title` | Aguardando verificação | Waiting for verification |
| `earnings.withdraw.unverified.body` | A Ciuna ainda está verificando: {names}. Você poderá sacar quando for verificado. | Ciuna is still verifying: {names}. You can withdraw once it is verified. |
| `earnings.withdraw.unverified.note` | Ainda indisponível, em verificação: {names}. | Not available yet, still being verified: {names}. |
| `earnings.withdraw.none.title` | Sem método de recebimento em {currency} | No payout method for {currency} |
| `earnings.withdraw.none.body` | Adicione uma conta bancária em {currency}. A Ciuna verifica antes do seu primeiro repasse. | Add a bank account in {currency}. Ciuna verifies it before your first payout. |
| `earnings.methods.manage` | Gerenciar métodos | Manage methods |
| `earnings.withdraw.amount` | Valor | Amount |
| `earnings.withdraw.all` | Sacar tudo | Withdraw all |
| `earnings.withdraw.available` | Disponível: | Available: |
| `earnings.withdraw.min` | Mínimo | Minimum |
| `earnings.withdraw.requested` | Você saca | You withdraw |
| `earnings.withdraw.fee` | Taxa de repasse | Payout fee |
| `earnings.withdraw.receive` | Você recebe | You receive |
| `earnings.withdraw.success` | Repasse solicitado. A Ciuna vai analisar e enviar para sua conta. | Payout requested. Ciuna will review it and send it to your account. |
| `earnings.withdraw.nothing` | Ainda não há nada para sacar. Os ganhos ficam disponíveis após o período de retenção. | Nothing available to withdraw yet. Earnings become available after the hold period. |
| `earnings.noAccess.title` | Ganhos privados | Earnings are private |
| `earnings.noAccess.body` | Peça ao proprietário, a um gerente ou ao financeiro para ver os ganhos. | Ask the owner, a manager or finance to view earnings. |
| `earnings.empty.title` | Ainda sem ganhos | No earnings yet |
| `earnings.empty.body` | Quando você cumprir um pedido, os ganhos aparecem aqui e ficam disponíveis em {days} dias. | When you fulfil an order, its earnings show here and become available after {days} days. |
| `earnings.statement` | Extrato | Statement |
| `earnings.statement.help` | Cada pedido com itens, entrega, taxa da Ciuna e o que fica para você. | Every order with items, delivery, Ciuna fee and what you keep. |
| `earnings.tab.all` | Todos | All |
| `earnings.tab.pending` | Pendentes | Pending |
| `earnings.tab.available` | Disponíveis | Available |
| `earnings.tab.reversed` | Estornados | Reversed |
| `earnings.item.pending` | Pendente | Pending |
| `earnings.item.available` | Disponível | Available |
| `earnings.item.reversed` | Estornado | Reversed |
| `earnings.item.availableOn` | Disponível em {date} | Available on {date} |
| `earnings.item.availableSince` | Disponível desde {date} | Available since {date} |
| `earnings.empty.all.title` | Ainda sem ganhos | No earnings yet |
| `earnings.empty.all.body` | Os pedidos cumpridos vão aparecer aqui. | Fulfilled orders will appear here. |
| `earnings.empty.pending.title` | Nada pendente | Nothing pending |
| `earnings.empty.pending.body` | Pedidos cumpridos recentemente aguardam aqui o fim do período de retenção. | Orders you have fulfilled recently wait here until the hold period ends. |
| `earnings.empty.available.title` | Nada disponível | Nothing available |
| `earnings.empty.available.body` | Os ganhos que passaram do período de retenção aparecem aqui. | Earnings that passed the hold period appear here. |
| `earnings.empty.reversed.title` | Nada estornado | Nothing reversed |
| `earnings.empty.reversed.body` | Pedidos reembolsados após o cumprimento aparecem aqui. | Orders refunded after fulfilment appear here. |
| `earnings.col.order` | Pedido | Order |
| `earnings.col.date` | Data | Date |
| `earnings.col.items` | Itens | Items |
| `earnings.col.delivery` | Entrega | Delivery |
| `earnings.col.fee` | Taxa da Ciuna | Ciuna fee |
| `earnings.col.net` | Você ganha | You earn |
| `earnings.col.status` | Status | Status |
| `earnings.loadMore` | Ver mais | Load more |
| `earnings.download.title` | Baixar extrato | Download statement |
| `earnings.download.help` | Todos os pedidos de um período em um arquivo CSV. | Get every order in a date range as a CSV file. |
| `earnings.download.from` | De | From |
| `earnings.download.to` | Até | To |
| `earnings.download.cta` | Baixar CSV | Download CSV |
| `earnings.payouts.title` | Repasses | Payouts |
| `earnings.payouts.subtitle` | Todos os repasses que você solicitou e em que etapa estão. | Every payout you requested, and where it stands. |
| `earnings.payouts.noAccess.title` | Repasses privados | Payouts are private |
| `earnings.payouts.noAccess.body` | Peça ao proprietário ou ao financeiro para ver os repasses. | Ask the owner or finance to view payouts. |
| `earnings.payouts.empty.title` | Ainda sem repasses | No payouts yet |
| `earnings.payouts.empty.body` | Quando você sacar, a solicitação e o status aparecem aqui. | When you withdraw, the request and its status appear here. |
| `earnings.payouts.empty.cta` | Ir para ganhos | Go to earnings |
| `earnings.payout.status.requested` | Solicitado | Requested |
| `earnings.payout.status.approved` | Aprovado | Approved |
| `earnings.payout.status.paid` | Pago | Paid |
| `earnings.payout.status.rejected` | Recusado | Rejected |
| `earnings.payout.status.cancelled` | Cancelado | Cancelled |
| `earnings.payout.requestedOn` | Solicitado em {date} | Requested {date} |
| `earnings.payout.fee` | Taxa de repasse | Payout fee |
| `earnings.payout.received` | Você recebeu | You received |
| `earnings.payout.method` | Pago para | Paid to |
| `earnings.payout.paidOn` | Pago em | Paid on |
| `earnings.payout.reference` | Referência | Reference |
| `earnings.payout.reason` | Motivo | Reason |
| `earnings.payout.note.requested` | Aguardando análise da Ciuna. Você pode cancelar até a aprovação. | Waiting for Ciuna to review. You can cancel until it is approved. |
| `earnings.payout.note.approved` | Aprovado. A Ciuna vai enviar o dinheiro para sua conta. | Approved. Ciuna will send the money to your account. |
| `earnings.payout.note.paid` | Enviado para sua conta. | Sent to your account. |
| `earnings.payout.note.rejected` | Não pago. O dinheiro voltou para seu saldo disponível. | Not paid. The money is back in your available balance. |
| `earnings.payout.note.cancelled` | Cancelado. O dinheiro voltou para seu saldo disponível. | Cancelled. The money is back in your available balance. |
| `earnings.payout.cancel` | Cancelar solicitação | Cancel request |
| `earnings.payout.cancel.q` | Cancelar esta solicitação de repasse? | Cancel this payout request? |
| `earnings.payout.cancel.body` | O dinheiro volta na hora para seu saldo disponível. | The money returns to your available balance right away. |
| `earnings.payout.cancel.confirm` | Cancelar solicitação | Cancel request |
| `earnings.payout.cancel.keep` | Manter solicitação | Keep request |
| `earnings.payout.cancelled` | Solicitação de repasse cancelada. | Payout request cancelled. |
| `earnings.kind.bank` | Conta bancária | Bank account |
| `earnings.kind.sbp` | SBP (Rússia) | SBP (Russia) |
| `earnings.kind.ciuna_send` | Ciuna Send | Ciuna Send |
| `earnings.comingSoon` | Em breve | Coming soon |
| `earnings.methods.title` | Métodos de recebimento | Payout methods |
| `earnings.methods.subtitle` | Para onde a Ciuna envia seu dinheiro. | Where Ciuna sends your money. |
| `earnings.methods.add` | Adicionar método | Add method |
| `earnings.methods.add.cta` | Adicionar método | Add method |
| `earnings.methods.default` | padrão | default |
| `earnings.methods.verified` | Verificado | Verified |
| `earnings.methods.waiting` | Aguardando verificação | Waiting for verification |
| `earnings.methods.makeDefault` | Tornar padrão | Make default |
| `earnings.methods.defaultSet` | Método padrão atualizado. | Default method updated. |
| `earnings.methods.removed` | Método removido. | Method removed. |
| `earnings.methods.added` | Método adicionado. A Ciuna vai verificá-lo antes do seu primeiro repasse. | Method added. Ciuna will verify it before your first payout. |
| `earnings.methods.remove.q` | Remover este método? | Remove this method? |
| `earnings.methods.remove.body` | Você pode adicioná-lo de novo depois. Solicitações em aberto mantêm o método original. | You can add it again later. Open payout requests keep their original method. |
| `earnings.methods.verify.title` | A Ciuna verifica métodos novos | Ciuna verifies new methods |
| `earnings.methods.verify.body` | Um método novo não recebe dinheiro até a Ciuna verificá-lo. Você verá «Verificado» aqui quando estiver pronto. | A new method can't receive money until Ciuna has verified it. You'll see "Verified" here when it is ready. |
| `earnings.methods.empty.title` | Sem métodos de recebimento | No payout methods |
| `earnings.methods.empty.body` | Adicione uma conta bancária para sacar seus ganhos. | Add a bank account so you can withdraw your earnings. |
| `earnings.methods.kind` | Tipo | Type |
| `earnings.methods.currency` | Moeda | Currency |
| `earnings.methods.sbp.rubOnly` | O SBP repassa apenas em RUB. | SBP pays out in RUB only. |
| `earnings.methods.label` | Nome deste método | Name for this method |
| `earnings.methods.label.hint` | Opcional, por ex. «Conta principal». Só você vê. | Optional, e.g. "Main account". Only you see it. |
| `earnings.methods.privacy` | Guardamos esses dados criptografados e não os mostramos de novo. Só os últimos 4 dígitos aparecem. | We keep these details encrypted and never show them again. Only the last 4 digits are shown. |
| `earnings.field.phone` | Número de telefone | Phone number |
| `earnings.field.bank_name` | Nome do banco | Bank name |
| `earnings.field.recipient_name` | Nome do destinatário | Recipient name |
| `earnings.field.account_number` | Número da conta | Account number |
| `earnings.field.bik` | BIK (opcional) | BIK (optional) |
| `earnings.field.swift` | SWIFT (opcional) | SWIFT (optional) |
| `earnings.field.iban` | IBAN (opcional) | IBAN (optional) |
| `earnings.field.country` | País (opcional) | Country (optional) |
| `errors.INSUFFICIENT_BALANCE` | Seu saldo disponível é menor que este valor. | Your available balance is lower than this amount. |
| `errors.BELOW_MINIMUM_PAYOUT` | Este valor está abaixo do repasse mínimo. | This is below the minimum payout. |
| `errors.PAYOUT_METHOD_NOT_FOUND` | Esse método de recebimento não foi encontrado. | That payout method wasn't found. |
| `errors.PAYOUT_METHOD_NOT_VERIFIED` | Esse método ainda não foi verificado. | That method hasn't been verified yet. |
| `errors.PAYOUT_CURRENCY_MISMATCH` | A moeda do método não corresponde a este repasse. | The method's currency doesn't match this payout. |
| `errors.AMOUNT_INVALID` | Informe um valor maior que zero, com até 2 casas decimais. | Enter an amount greater than zero, with up to 2 decimals. |
| `errors.TOO_MANY_OPEN_PAYOUTS` | Você já tem 3 solicitações de repasse em aberto. Aguarde uma terminar ou cancele uma. | You already have 3 open payout requests. Wait for one to finish or cancel one. |
| `errors.PAYOUT_FEE_INVALID` | A taxa de repasse é maior que o valor. Tente um valor maior. | The payout fee is higher than the amount. Try a larger amount. |
| `errors.METHOD_IN_USE` | Este método tem um repasse em aberto. Tente de novo quando terminar. | This method has an open payout. Try again after it finishes. |
| `errors.TOO_MANY_METHODS` | Você pode ter até 10 métodos de recebimento. | You can keep up to 10 payout methods. |
| `errors.KIND_INVALID` | Escolha um tipo de método. | Choose a method type. |
| `errors.CURRENCY_NOT_SUPPORTED` | Este tipo de método não aceita essa moeda. | This method type doesn't support that currency. |
| `errors.PHONE_INVALID` | Informe um telefone com 10 a 15 dígitos. | Enter a phone number with 10 to 15 digits. |
| `errors.FIELD_REQUIRED` | Obrigatório | Required |
| `errors.PAYOUT_NOT_FOUND` | Esse repasse não foi encontrado. | That payout wasn't found. |
| `errors.DATE_INVALID` | Escolha um período válido. | Choose a valid date range. |
| `errors.METHOD_HAS_HISTORY` | Este método já foi usado em um repasse, por isso não pode ser removido. Defina outro como padrão. | This method was used for a past payout, so it can't be removed. Make another method the default instead. |

### `seller/locales/pt/expert.json` (219 strings)

| Key | Text | English source |
| --- | --- | --- |
| `expert.only.title` | Somente para especialistas | Experts only |
| `expert.only.body` | Esta seção é para contas de especialista. Mude para o seu negócio de especialista para usá-la. | This section is for expert accounts. Switch to your expert business to use it. |
| `expert.only.home` | Ir para o início | Go to home |
| `expert.unit.label` | Unidade | Unit |
| `expert.unit.minutes` | minutos | minutes |
| `expert.unit.hours` | horas | hours |
| `expert.unit.min` | min | min |
| `expert.unit.h` | h | h |
| `expert.services.title` | Serviços | Services |
| `expert.services.subtitle` | O que os clientes podem reservar com você. | What customers can book with you. |
| `expert.services.add` | Adicionar serviço | Add service |
| `expert.services.empty.title` | Ainda não há serviços | No services yet |
| `expert.services.empty.body` | Adicione seu primeiro serviço e defina sua disponibilidade para que os clientes possam reservar. | Add your first service, then set your availability so customers can book. |
| `expert.services.per_hour` | por hora | per hour |
| `expert.services.slots` | {count} horários livres nos próximos 14 dias | {count} open slots in the next 14 days |
| `expert.services.slots.none` | Nenhum horário livre em 14 dias | No open slots in the next 14 days |
| `expert.services.slots.set` | Definir disponibilidade | Set availability |
| `expert.services.publish` | Publicar este serviço | Publish this service |
| `expert.services.published` | Visível para os clientes | Visible to customers |
| `expert.services.publish_toggle` | Publicar {title} | Publish {title} |
| `expert.services.needs_instructions` | Adicione as instruções da reunião antes de publicar. | Add meeting instructions before publishing. |
| `expert.pricing.hourly` | Valor por hora | Hourly rate |
| `expert.pricing.fixed` | Preço fixo por sessão | Fixed price per session |
| `expert.pricing.quote` | Orçamento sob consulta | Quote on request |
| `expert.delivery.online` | Online | Online |
| `expert.delivery.in_person` | Presencial | In person |
| `expert.delivery.both` | Online ou presencial | Online or in person |
| `expert.form.new` | Novo serviço | New service |
| `expert.form.edit` | Editar serviço | Edit service |
| `expert.form.notlive.title` | Você poderá publicar quando a Ciuna aprovar seu negócio | You can publish once Ciuna approves your business |
| `expert.form.rejected` | Este serviço foi rejeitado. Edite o título, a descrição ou as instruções e salve para enviá-lo novamente para análise. | This service was rejected. Edit the title, description or instructions and save to send it for review again. |
| `expert.form.review` | A Ciuna analisa as alterações de título, descrição ou instruções antes que os clientes as vejam. | Changes to the title, description or instructions are reviewed by Ciuna before customers see them. |
| `expert.form.basics` | Informações básicas | Basics |
| `expert.form.basics.hint` | Escreva no idioma em que você atende. Os outros idiomas são opcionais. | Write in the language you serve. Other languages are optional. |
| `expert.form.title` | Título do serviço | Service title |
| `expert.form.title.ph` | Por exemplo, sessão de coaching de carreira | For example, Career coaching session |
| `expert.form.short` | Descrição curta | Short description |
| `expert.form.lang.hint` | Se deixar em branco, os clientes verão o idioma padrão. | If you leave this empty, customers see the default language. |
| `expert.form.err.title` | Informe um título. | Enter a title. |
| `expert.form.pricing` | Preço | Pricing |
| `expert.form.pricing.type` | Tipo de preço | Pricing type |
| `expert.form.rate` | Valor por hora | Rate per hour |
| `expert.form.price` | Preço por sessão | Price per session |
| `expert.form.currency` | Moeda | Currency |
| `expert.form.quote.note` | Serviços sob consulta não podem ser reservados online, por isso não são oferecidos aqui. | Services priced on request can't be booked online, so they aren't offered here. |
| `expert.form.err.amount` | Informe um valor maior que zero. | Enter an amount greater than zero. |
| `expert.form.duration` | Duração | Duration |
| `expert.form.duration.default` | Duração da sessão | Session length |
| `expert.form.duration.min` | Sessão mais curta | Shortest session |
| `expert.form.duration.max` | Sessão mais longa | Longest session |
| `expert.form.optional` | Opcional | Optional |
| `expert.form.err.duration` | Informe uma duração maior que zero. | Enter a session length greater than zero. |
| `expert.form.err.range` | A sessão mais curta não pode ser maior que a mais longa. | The shortest session can't be longer than the longest. |
| `expert.form.delivery` | Modalidade | Delivery |
| `expert.form.delivery.mode` | Onde as sessões acontecem | Where sessions happen |
| `expert.form.instructions` | Instruções da reunião | Meeting instructions |
| `expert.form.instructions.hint` | Como entrar ou onde se encontrar. Obrigatório para publicar. | How customers join or where to meet. Required to publish. |
| `expert.form.err.instructions` | Adicione as instruções da reunião para publicar. | Add meeting instructions to publish. |
| `expert.form.rules` | Regras de reserva | Booking rules |
| `expert.form.lead` | Antecedência mínima antes de uma sessão | Minimum notice before a session |
| `expert.form.lead.hint` | Os clientes não poderão reservar horários que comecem antes disso. | Customers can't book slots that start sooner than this. |
| `expert.form.cutoff` | Prazo de pagamento antes de uma sessão | Payment deadline before a session |
| `expert.form.cutoff.hint` | Uma reserva deve ser paga com pelo menos essa antecedência. | A booking must be paid at least this long before it starts. |
| `expert.form.err.number` | Informe zero ou mais. | Enter zero or more. |
| `expert.form.timezone` | Fuso horário do serviço | Service time zone |
| `expert.form.timezone.hint` | Os clientes veem os horários das sessões neste fuso. | Customers see session times with this zone. |
| `expert.form.save_draft` | Salvar rascunho | Save draft |
| `expert.form.publish` | Publicar | Publish |
| `expert.form.unsaved` | Alterações não salvas | Unsaved changes |
| `expert.form.toast.saved` | Serviço salvo | Service saved |
| `expert.form.toast.published` | Serviço publicado | Service published |
| `expert.form.toast.unpublished` | Serviço despublicado | Service unpublished |
| `expert.form.unpublish.title` | Parar de aceitar reservas | Stop accepting bookings |
| `expert.form.unpublish.body` | O serviço fica oculto para os clientes e seus horários livres são removidos. | The service is hidden from customers and its open slots are removed. |
| `expert.form.unpublish.action` | Despublicar | Unpublish |
| `expert.form.unpublish.confirm` | Despublicar este serviço? | Unpublish this service? |
| `expert.form.unpublish.confirm.body` | Os clientes deixarão de vê-lo e os horários livres serão removidos. As reservas existentes permanecem. Para oferecê-lo de novo, publique e salve sua disponibilidade. | Customers will no longer see it and its open slots will be removed. Existing bookings stay. To offer it again, publish it and save your availability. |
| `expert.avail.title` | Disponibilidade | Availability |
| `expert.avail.subtitle` | Defina quando os clientes podem reservar. Ao salvar, seus horários livres são recriados. | Set when customers can book you. Saving rebuilds your open slots. |
| `expert.avail.service` | Serviço | Service |
| `expert.avail.noservice.title` | Adicione um serviço primeiro | Add a service first |
| `expert.avail.noservice.body` | A disponibilidade é definida por serviço. | Availability is set per service. |
| `expert.avail.settings` | Configurações da agenda | Schedule settings |
| `expert.avail.timezone` | Fuso horário | Time zone |
| `expert.avail.timezone.hint` | Seus horários semanais usam este fuso horário. | Your weekly hours are in this time zone. |
| `expert.avail.slot` | Duração do horário | Slot length |
| `expert.avail.slot.hint` | Cada intervalo aberto é dividido em horários dessa duração. | Each open range is cut into slots of this length. |
| `expert.avail.window.start` | Reservável a partir de | Bookable from |
| `expert.avail.window.end` | Reservável até | Bookable until |
| `expert.avail.window.days` | Os clientes podem reservar com {count} dias de antecedência (máximo {max}). | Customers can book {count} days ahead (up to {max}). |
| `expert.avail.window.max` | O período pode ter no máximo {max} dias. | The window can be at most {max} days. |
| `expert.avail.window.reset` | Próximos 60 dias | Next 60 days |
| `expert.avail.window.order` | A data final não pode ser anterior à data inicial. | The end date must be on or after the start date. |
| `expert.avail.window.long` | Escolha um período de até {max} dias. | Choose a window of {max} days or fewer. |
| `expert.avail.weekly` | Horário semanal | Weekly hours |
| `expert.avail.weekly.hint` | Os horários estão em {zone}. Adicione vários intervalos no dia para pausas. | Times are in {zone}. Add several ranges to a day for breaks. |
| `expert.avail.closed` | Indisponível | Not available |
| `expert.avail.add` | Adicionar horário | Add hours |
| `expert.avail.copy` | Copiar para outros dias | Copy to other days |
| `expert.avail.copy.title` | Copiar {day} para outros dias | Copy {day} to other days |
| `expert.avail.copy.hint` | Os horários dos dias escolhidos serão substituídos. | Hours on the days you choose will be replaced. |
| `expert.avail.copy.apply` | Copiar horários | Copy hours |
| `expert.avail.from` | Hora de início | Start time |
| `expert.avail.to` | Hora de término | End time |
| `expert.avail.issue.order` | O término deve ser depois do início. | End time must be after start time. |
| `expert.avail.issue.overlap` | Este intervalo se sobrepõe a outro no mesmo dia. | This range overlaps another range on the same day. |
| `expert.avail.issue.empty` | Informe o início e o término. | Enter both a start and an end time. |
| `expert.avail.norules` | Ainda não há horários semanais. Salvar agora removerá seus horários livres. | No weekly hours yet. Saving now will remove your open slots. |
| `expert.avail.save` | Salvar e atualizar horários | Save and update slots |
| `expert.avail.saves_note` | Sessões reservadas nunca são alteradas. | Booked sessions are never changed. |
| `expert.avail.fix` | Corrija os campos destacados para salvar. | Fix the highlighted fields to save. |
| `expert.avail.saved` | Disponibilidade salva | Availability saved |
| `expert.avail.preview` | Próximos 14 dias | Next 14 days |
| `expert.avail.preview.hint` | Horários que os clientes podem reservar, em {zone}. {count} horários criados. | Slots customers can book, in {zone}. {count} slots created. |
| `expert.avail.preview.empty` | Nenhum horário nos próximos 14 dias. Verifique seus horários semanais e o período de reserva. | No slots in the next 14 days. Check your weekly hours and booking window. |
| `expert.slots.title` | Próximos horários | Upcoming slots |
| `expert.slots.hint` | Bloqueie um horário que você não pode atender ou remova-o. Horários em {zone}. | Block a slot you can't take, or remove it. Times in {zone}. |
| `expert.slots.range` | Período | Time range |
| `expert.slots.next` | Próximos {count} dias | Next {count} days |
| `expert.slots.empty` | Nenhum horário neste período | No slots in this period |
| `expert.slots.empty.body` | Salve seus horários semanais para criar horários. | Save your weekly hours to create slots. |
| `expert.slots.status.available` | Livre | Open |
| `expert.slots.status.booked` | Reservado | Booked |
| `expert.slots.status.blocked` | Bloqueado | Blocked |
| `expert.slots.block` | Bloquear | Block |
| `expert.slots.unblock` | Desbloquear | Unblock |
| `expert.slots.view_booking` | Ver reserva | View booking |
| `expert.slots.delete.title` | Excluir este horário? | Delete this slot? |
| `expert.slots.delete.action` | Excluir horário | Delete slot |
| `expert.slots.deleted` | Horário excluído | Slot deleted |
| `expert.timeoff.title` | Folga | Time off |
| `expert.timeoff.hint` | Bloqueie todos os horários livres em um intervalo de datas. Sessões já reservadas permanecem como estão. | Block all open slots in a date range. Sessions already booked stay as they are. |
| `expert.timeoff.from` | Primeiro dia de folga | First day off |
| `expert.timeoff.to` | Último dia de folga | Last day off |
| `expert.timeoff.service` | Serviço | Service |
| `expert.timeoff.all` | Todos os serviços | All services |
| `expert.timeoff.zone` | Dias inteiros em {zone}. | Whole days in {zone}. |
| `expert.timeoff.action` | Bloquear estas datas | Block these dates |
| `expert.timeoff.confirm` | Bloquear de {from} a {to}? | Block {from} to {to}? |
| `expert.timeoff.confirm.body` | Todos os horários livres ({scope}) neste intervalo serão bloqueados (fuso {zone}). Você pode desbloqueá-los um a um. | All open slots for {scope} in this range will be blocked (time zone {zone}). You can unblock them one by one. |
| `expert.timeoff.done` | {count} horários bloqueados. | {count} slots blocked. |
| `expert.bookings.title` | Reservas | Bookings |
| `expert.bookings.subtitle` | Sessões que os clientes reservaram e pagaram. | Sessions customers have booked and paid for. |
| `expert.bookings.tab.requests` | Solicitações | Requests |
| `expert.bookings.tab.upcoming` | Próximas | Upcoming |
| `expert.bookings.tab.past` | Passadas | Past |
| `expert.bookings.empty.requests.title` | Nenhuma solicitação pendente | No requests to answer |
| `expert.bookings.empty.requests.body` | Novas reservas pagas aparecem aqui para você aceitar. | New paid bookings appear here for you to accept. |
| `expert.bookings.empty.upcoming.title` | Nenhuma sessão próxima | No upcoming sessions |
| `expert.bookings.empty.upcoming.body` | Sessões aceitas aparecem aqui até terminarem. | Accepted sessions show up here until they end. |
| `expert.bookings.empty.past.title` | Nenhuma sessão passada | No past sessions |
| `expert.bookings.empty.past.body` | Sessões concluídas e canceladas são listadas aqui. | Completed and cancelled sessions are listed here. |
| `expert.bookings.status.new` | Nova solicitação | New request |
| `expert.bookings.status.accepted` | Aceita | Accepted |
| `expert.bookings.status.preparing` | Em andamento | In progress |
| `expert.bookings.status.completed` | Concluída | Completed |
| `expert.bookings.status.cancelled` | Cancelada | Cancelled |
| `expert.bookings.session` | Sessão | Session |
| `expert.bookings.customer` | Cliente | Customer |
| `expert.bookings.no_slot` | Sem horário definido | No time set |
| `expert.bookings.yours` | Seu horário | Your time |
| `expert.bookings.session_time` | Horário da sessão ({zone}) | Session time ({zone}) |
| `expert.bookings.your_time` | Horário do seu dispositivo ({zone}) | Your device time ({zone}) |
| `expert.bookings.accept` | Aceitar | Accept |
| `expert.bookings.accepted` | Reserva aceita | Booking accepted |
| `expert.bookings.complete` | Marcar como concluída | Mark as completed |
| `expert.bookings.view` | Ver detalhes | View details |
| `expert.bookings.overdue` | Responda agora, esta solicitação está atrasada | Answer now, this request is overdue |
| `expert.bookings.respond_by` | Responda até {time} | Respond by {time} |
| `expert.bookings.exception` | Requer atenção | Needs attention |
| `expert.detail.title` | Reserva | Booking |
| `expert.detail.session` | Sessão | Session |
| `expert.detail.price` | Preço | Price |
| `expert.detail.customer` | Cliente | Customer |
| `expert.detail.note` | Observação do cliente | Note from the customer |
| `expert.detail.exception` | Esta reserva precisa da atenção da Ciuna | This booking needs attention from Ciuna |
| `expert.detail.meeting` | Link da reunião | Meeting link |
| `expert.detail.meeting.hint` | O cliente verá isso assim que você salvar. | The customer sees this once you save it. |
| `expert.detail.meeting.url` | Link da reunião (https) | Meeting link (https) |
| `expert.detail.meeting.url.err` | Informe um link que comece com https:// | Enter a link that starts with https:// |
| `expert.detail.meeting.instructions` | Instruções para o cliente | Instructions for the customer |
| `expert.detail.meeting.save` | Salvar dados da reunião | Save meeting details |
| `expert.detail.meeting.saved` | Dados da reunião salvos | Meeting details saved |
| `expert.detail.meeting.open` | Abrir link atual | Open current link |
| `expert.detail.reject` | Recusar | Decline |
| `expert.detail.reject.title` | Recusar esta reserva? | Decline this booking? |
| `expert.detail.reject.body` | O cliente é reembolsado integralmente e recebe o motivo. Isso não pode ser desfeito. | The customer is refunded in full and told why. This can't be undone. |
| `expert.detail.reject.reason` | Motivo da recusa | Reason for declining |
| `expert.detail.reject.confirm` | Recusar reserva | Decline booking |
| `expert.detail.fulfill` | Marcar como concluída | Mark as completed |
| `expert.detail.fulfill.wait` | Você poderá concluir esta sessão depois que ela terminar, em {time}. | You can complete this session after it ends at {time}. |
| `expert.detail.fulfill.title` | Marcar esta sessão como concluída? | Mark this session as completed? |
| `expert.detail.fulfill.body` | Isso confirma que a sessão aconteceu e inicia o seu pagamento. | This confirms the session took place and starts your payout. |
| `expert.detail.fulfill.note` | Observação sobre a sessão | Note about the session |
| `expert.detail.done.accept` | Reserva aceita | Booking accepted |
| `expert.detail.done.reject` | Reserva recusada e reembolsada | Booking declined and refunded |
| `expert.detail.done.fulfill` | Sessão marcada como concluída | Session marked as completed |
| `errors.SERVICE_INVALID` | Verifique os dados do serviço e tente novamente. | Check the service details and try again. |
| `errors.HAS_FUTURE_BOOKINGS` | Este serviço tem {count} sessões reservadas futuras. Conclua ou recuse-as primeiro e depois despublique. | This service has {count} upcoming booked sessions. Complete or decline them first, then unpublish. |
| `errors.SLOT_BOOKED` | Este horário já está reservado e não pode ser alterado. | This slot is already booked, so it can't be changed. |
| `errors.SLOT_NOT_EDITABLE` | Este horário não pode ser alterado. | This slot can't be changed. |
| `errors.SLOT_NOT_FOUND` | Este horário não existe mais. Atualize a lista. | This slot no longer exists. Refresh the list. |
| `errors.SLOT_OVERLAP` | Este horário se sobrepõe a um existente. | This time overlaps an existing slot. |
| `errors.SLOT_IN_PAST` | Escolha um horário no futuro. | Choose a time in the future. |
| `errors.WINDOW_TOO_LONG` | O período de reserva pode ter no máximo {maxDays} dias. | The booking window can be at most {maxDays} days. |
| `errors.WINDOW_INVALID` | Informe datas de início e término válidas. | Enter a valid start and end date. |
| `errors.WINDOW_ORDER` | A data final não pode ser anterior à data inicial. | The end date must be on or after the start date. |
| `errors.RULE_TIME_ORDER` | Cada intervalo deve terminar depois de começar. | Each range must end after it starts. |
| `errors.TIMEZONE_INVALID` | Escolha um fuso horário válido. | Choose a valid time zone. |
| `errors.RANGE_ORDER` | A data final deve ser depois da data inicial. | The end date must be after the start date. |
| `errors.RANGE_TOO_LONG` | Escolha um intervalo de até {maxDays} dias. | Choose a range of {maxDays} days or fewer. |
| `errors.SCHEDULE_REQUIRED` | Salve primeiro seus horários semanais. | Save your weekly hours first. |
| `errors.EXPERT_ONLY` | Isso está disponível apenas para contas de especialista. | This is only available to expert accounts. |
| `errors.EXPERT_PROFILE_NOT_FOUND` | Seu perfil de especialista ainda não foi configurado. Conclua a configuração primeiro. | Your expert profile isn't set up yet. Finish setup first. |
| `errors.SERVICE_NOT_FOUND` | Este serviço não existe mais. | This service no longer exists. |
| `errors.MEETING_URL_INVALID` | Informe um link que comece com https:// | Enter a link that starts with https:// |
| `errors.MEETING_EMPTY` | Adicione um link da reunião ou instruções. | Add a meeting link or instructions. |
| `errors.BOOKING_CLOSED` | Esta reserva está encerrada e os dados da reunião não podem ser alterados. | This booking is closed, so meeting details can't be changed. |
| `errors.BOOKING_NOT_PAID` | Esta reserva ainda não foi paga. | This booking isn't paid yet. |

### `seller/locales/pt/home.json` (13 strings)

| Key | Text | English source |
| --- | --- | --- |
| `home.welcome` | Boas-vindas, {name} | Welcome, {name} |
| `home.setup.body` | Conclua estas etapas e a Ciuna analisará seu negócio. | Finish these steps and Ciuna will review your business. |
| `home.live.body` | O que precisa da sua atenção hoje. | What needs your attention today. |
| `home.setup.title` | Prepare-se para vender | Get ready to sell |
| `home.newOrders` | Novos pedidos | New orders |
| `home.newBookings` | Novas solicitações de reserva | New booking requests |
| `home.needsAction` | Aguardando sua aceitação | Waiting for you to accept |
| `home.inProgress` | Em andamento | In progress |
| `more.storeProfile` | Perfil da loja | Store profile |
| `more.expertProfile` | Perfil de especialista | Expert profile |
| `more.verification` | Verificação e documentos | Verification and documents |
| `more.fulfillment` | Retirada e entrega | Pickup and delivery |
| `more.team` | Equipe | Team |

### `seller/locales/pt/messages.json` (33 strings)

| Key | Text | English source |
| --- | --- | --- |
| `messages.title` | Mensagens | Messages |
| `messages.subtitle` | Converse com os clientes sobre os pedidos. Responda rápido para tudo andar. | Chat with customers about their orders. Reply quickly to keep orders moving. |
| `messages.noAccess.title` | Você não tem acesso às mensagens | You don't have access to messages |
| `messages.noAccess.body` | Peça ao proprietário do negócio para liberar a permissão de mensagens. | Ask the business owner to give you the messages permission. |
| `messages.empty.title` | Nenhuma mensagem ainda | No messages yet |
| `messages.empty.body` | Quando um cliente escrever sobre um pedido, a conversa aparece aqui. | When a customer writes about an order, the conversation appears here. |
| `messages.customer` | Cliente | Customer |
| `messages.you` | Você | You |
| `messages.unread` | {count} não lidas | {count} unread |
| `messages.closed.chip` | Chat encerrado | Chat closed |
| `messages.back` | Todas as mensagens | All messages |
| `messages.viewOrder` | Ver pedido | View order |
| `messages.history` | Conversa | Conversation |
| `messages.thread.empty` | Ainda não há mensagens neste chat. Diga olá abaixo. | No messages in this chat yet. Say hello below. |
| `messages.closed.title` | Este chat está encerrado | This chat is closed |
| `messages.closed.body` | Os chats encerram 14 dias depois que o pedido é concluído ou cancelado. Você ainda pode ver o histórico. | Chats close 14 days after an order is completed or cancelled. You can still see the history. |
| `messages.unavailable.title` | Chat indisponível | Chat isn't available |
| `messages.unavailable.body` | O chat abre depois que o cliente paga o pedido. | Chat opens once the customer has paid for the order. |
| `messages.composer.label` | Mensagem | Message |
| `messages.composer.placeholder` | Escreva uma mensagem | Write a message |
| `messages.composer.closed` | Chat encerrado | Chat is closed |
| `messages.send` | Enviar | Send |
| `messages.seen` | Visto | Seen |
| `messages.quick.label` | Respostas rápidas | Quick replies |
| `messages.quick.preparing` | Seu pedido está sendo preparado. | Your order is being prepared. |
| `messages.quick.delivery` | Entregaremos em até uma hora. | We will deliver within the hour. |
| `messages.quick.thanks` | Obrigado pelo seu pedido! | Thank you for your order! |
| `messages.quick.question` | Pode confirmar o seu endereço, por favor? | Could you confirm your address, please? |
| `errors.CHAT_CLOSED` | Este chat está encerrado, a mensagem não foi enviada. | This chat is closed, so the message was not sent. |
| `errors.RATE_LIMITED` | Você está enviando mensagens rápido demais. Aguarde um pouco e tente de novo. | You're sending messages too fast. Wait a little and try again. |
| `errors.MESSAGE_EMPTY` | Escreva uma mensagem antes de enviar. | Write a message before sending. |
| `errors.MESSAGE_TOO_LONG` | A mensagem é longa demais. Use no máximo 2000 caracteres. | That message is too long. Keep it under 2000 characters. |
| `errors.CHAT_UNAVAILABLE` | O chat não está disponível para este pedido. | Chat isn't available for this order. |

### `seller/locales/pt/orders.json` (89 strings)

| Key | Text | English source |
| --- | --- | --- |
| `orders.title` | Pedidos | Orders |
| `orders.subtitle` | Os novos pedidos aparecem aqui. Aceite rápido para os clientes esperarem menos. | New orders appear here. Accept quickly to keep customers waiting less. |
| `orders.tab.new` | Novos | New |
| `orders.tab.active` | Em andamento | In progress |
| `orders.tab.done` | Concluídos | Completed |
| `orders.tab.cancelled` | Cancelados | Cancelled |
| `orders.empty.new.title` | Nenhum pedido novo | No new orders |
| `orders.empty.new.body` | Os novos pedidos aparecem aqui assim que os clientes pagam. | New orders show up here as soon as customers pay. |
| `orders.empty.active.title` | Nada em andamento | Nothing in progress |
| `orders.empty.active.body` | Os pedidos que você aceitar aparecem aqui até serem marcados como concluídos. | Orders you accept appear here until you mark them fulfilled. |
| `orders.empty.done.title` | Nenhum pedido concluído ainda | No completed orders yet |
| `orders.empty.done.body` | Os pedidos concluídos serão listados aqui. | Fulfilled orders will be listed here. |
| `orders.empty.cancelled.title` | Nenhum pedido cancelado | No cancelled orders |
| `orders.empty.cancelled.body` | Os pedidos recusados e cancelados serão listados aqui. | Rejected and cancelled orders will be listed here. |
| `orders.noAccess.title` | Você não tem acesso aos pedidos | You don't have access to orders |
| `orders.noAccess.body` | Peça ao proprietário do negócio para liberar a permissão de pedidos. | Ask the business owner to give you the orders permission. |
| `orders.number` | Pedido {id} | Order {id} |
| `orders.moreItems` | +{count} mais | +{count} more |
| `orders.mode.delivery` | Entrega | Delivery |
| `orders.mode.pickup` | Retirada | Pickup |
| `orders.mode.digital` | Digital | Digital |
| `orders.mode.booking` | Reserva | Booking |
| `orders.due.in` | Vence em {time} | Due in {time} |
| `orders.due.overdue` | Atrasado {time} | Overdue by {time} |
| `orders.duration.hm` | {h} h {m} min | {h} h {m} min |
| `orders.duration.m` | {m} min | {m} min |
| `orders.status.new` | Novo | New |
| `orders.status.accepted` | Aceito | Accepted |
| `orders.status.preparing` | Em preparo | Preparing |
| `orders.status.completed` | Concluído | Completed |
| `orders.status.cancelled` | Cancelado | Cancelled |
| `orders.action.accept` | Aceitar | Accept |
| `orders.action.start` | Começar a preparar | Start preparing |
| `orders.action.fulfill` | Marcar como concluído | Mark as fulfilled |
| `orders.action.reject` | Recusar | Reject |
| `orders.view` | Ver pedido | View order |
| `orders.back` | Voltar aos pedidos | Back to orders |
| `orders.toast.newOrder` | Novo pedido | New order |
| `orders.toast.accept` | Pedido {id} aceito | Order {id} accepted |
| `orders.toast.start` | Pedido {id} em preparo | Order {id} is being prepared |
| `orders.toast.fulfill` | Pedido {id} marcado como concluído | Order {id} marked as fulfilled |
| `orders.toast.reject` | Pedido {id} recusado | Order {id} rejected |
| `orders.items` | Itens | Items |
| `orders.col.item` | Item | Item |
| `orders.col.qty` | Qtd. | Qty |
| `orders.col.unit` | Preço unitário | Unit price |
| `orders.col.total` | Total | Total |
| `orders.subtotal` | Subtotal | Subtotal |
| `orders.deliveryFee` | Taxa de entrega | Delivery fee |
| `orders.total` | Total | Total |
| `orders.note` | Observação do cliente | Customer note |
| `orders.slot` | Horário da reserva | Booking time |
| `orders.slot.timezone` | Horários exibidos em {tz} | Times shown in {tz} |
| `orders.digital` | Conteúdo digital | Digital content |
| `orders.digital.hint` | Isto é o que você enviou ao cliente. | This is what you sent to the customer. |
| `orders.customer` | Cliente | Customer |
| `orders.customer.unknown` | Nome não informado | Name not provided |
| `orders.pickup` | Retirada | Pickup |
| `orders.pickup.hours` | Horário de retirada: {hours} | Pickup hours: {hours} |
| `orders.deliveryTo` | Entregar em | Deliver to |
| `orders.location` | Local | Location |
| `orders.noAddress` | Endereço não informado | No address provided |
| `orders.timeline` | Linha do tempo | Timeline |
| `orders.timeline.empty` | Ainda sem atividade. | No activity yet. |
| `orders.exception.title` | Este pedido precisa de atenção | This order needs attention |
| `orders.reject.title` | Recusar este pedido? | Reject this order? |
| `orders.reject.body` | O cliente será reembolsado integralmente. Ele verá o seu motivo. | The customer will be refunded in full. They will see your reason. |
| `orders.reject.reason` | Motivo | Reason |
| `orders.reject.placeholder` | Explique ao cliente o motivo, por exemplo: sem estoque | Tell the customer why, for example: out of stock |
| `orders.reject.confirm` | Recusar pedido | Reject order |
| `orders.fulfill.title` | Marcar este pedido como concluído? | Mark this order as fulfilled? |
| `orders.fulfill.body` | Adicione uma observação para o cliente, por exemplo o que foi entregue. | Add a note for the customer, such as what was delivered. |
| `orders.fulfill.bodyDigital` | Adicione o conteúdo que o cliente recebe e uma observação. | Add the content the customer receives, and a note. |
| `orders.fulfill.note` | Observação para o cliente | Note for the customer |
| `orders.fulfill.noteHint` | Obrigatório. Pelo menos uma frase. | Required. At least one sentence. |
| `orders.fulfill.content` | Conteúdo digital | Digital content |
| `orders.fulfill.contentHint` | Códigos, links ou instruções. O cliente vê isto. | Codes, links or instructions. The customer sees this. |
| `orders.fulfill.confirm` | Marcar como concluído | Mark as fulfilled |
| `errors.INVALID_TRANSITION` | Este pedido mudou. Atualize e tente novamente. | Something about this order changed. Refresh and try again. |
| `errors.REJECT_NOT_ALLOWED` | Este pedido não pode mais ser recusado. Fale com o suporte. | This order can't be rejected now. Contact support. |
| `errors.REASON_REQUIRED` | Informe um motivo com pelo menos 3 caracteres. | Enter a reason of at least 3 characters. |
| `errors.CONTACT_SUPPORT` | Este pedido precisa do suporte da Ciuna. Fale com o suporte para continuar. | This order needs Ciuna support. Contact support to continue. |
| `errors.DELIVERY_CONTENT_REQUIRED` | Adicione o conteúdo digital antes de marcar o pedido como concluído. | Add the digital content before marking this order fulfilled. |
| `errors.NOTE_REQUIRED` | Adicione uma observação para o cliente. | Add a note for the customer. |
| `errors.SESSION_NOT_ENDED` | Você pode marcar uma reserva como concluída depois que a sessão terminar. | You can mark a booking fulfilled after the session has ended. |
| `errors.ORDER_NOT_FOUND` | Não encontramos este pedido. | We couldn't find this order. |
| `errors.INVALID_ACTION` | Essa ação não está disponível. | That action isn't available. |
| `errors.UNAVAILABLE` | Não foi possível conectar à Ciuna. Verifique sua conexão e tente novamente. | We couldn't reach Ciuna. Check your connection and try again. |
| `orders.messageCustomer` | Enviar mensagem ao cliente | Message the customer |

### `seller/locales/pt/reviews.json` (32 strings)

| Key | Text | English source |
| --- | --- | --- |
| `reviews.title` | Avaliações | Reviews |
| `reviews.subtitle` | O que os clientes dizem sobre os seus pedidos. | What customers say about your orders. |
| `reviews.nav` | Avaliações | Reviews |
| `reviews.stars` | {n} de 5 | {n} out of 5 |
| `reviews.starsShort` | {n} estrelas | {n} stars |
| `reviews.count` | {count} avaliações | {count} reviews |
| `reviews.count.one` | 1 avaliação | 1 review |
| `reviews.distribution` | Avaliações por nota | Reviews by star rating |
| `reviews.customer` | Cliente | Customer |
| `reviews.noText` | Sem comentário escrito. | No written review. |
| `reviews.yourReply` | Sua resposta | Your reply |
| `reviews.reply` | Responder | Reply |
| `reviews.editReply` | Editar resposta | Edit reply |
| `reviews.reply.public` | Sua resposta é pública. | Your reply is public. |
| `reviews.reply.label` | Resposta | Reply |
| `reviews.reply.editWindow` | Você pode editar esta resposta por 24 horas após publicá-la. | You can edit this reply for 24 hours after posting. |
| `reviews.reply.counter` | {used} / {max} | {used} / {max} |
| `reviews.reply.send` | Publicar resposta | Post reply |
| `reviews.reply.sent` | Resposta publicada. | Reply posted. |
| `reviews.tab.all` | Todas | All |
| `reviews.tab.needsReply` | Aguardando resposta | Needs reply |
| `reviews.empty.title` | Ainda não há avaliações | No reviews yet |
| `reviews.empty.body` | Os clientes podem avaliar um pedido depois que ele for concluído. As avaliações aparecem aqui. | Customers can review an order after it is fulfilled. Reviews show up here. |
| `reviews.empty.caughtUp.title` | Tudo em dia | You're all caught up |
| `reviews.empty.caughtUp.body` | Todas as avaliações têm resposta. | Every review has a reply. |
| `reviews.more` | Mostrar mais | Show more |
| `reviews.noAccess.title` | Você não tem acesso às avaliações | You don't have access to reviews |
| `reviews.noAccess.body` | Peça ao proprietário do negócio para lhe dar a permissão de pedidos. | Ask the business owner to give you the orders permission. |
| `errors.REPLY_REQUIRED` | Escreva uma resposta. | Write a reply. |
| `errors.REPLY_TOO_LONG` | A resposta deve ter no máximo 600 caracteres. | Keep the reply to 600 characters. |
| `errors.REPLY_LOCKED` | Esta resposta não pode mais ser editada. | This reply can no longer be edited. |
| `errors.REVIEW_NOT_FOUND` | Não encontramos essa avaliação. | We couldn't find that review. |

### `seller/locales/pt/settings.json` (49 strings)

| Key | Text | English source |
| --- | --- | --- |
| `profile.subtitle` | O que os clientes veem na sua página. | What customers see on your page. |
| `profile.basics` | Informações básicas | Basics |
| `profile.description` | Descrição | Description |
| `profile.description.hint` | Conte aos clientes quem você é e o que oferece. Obrigatória no seu idioma padrão. | Tell customers who you are and what you offer. Required in your default language. |
| `profile.images` | Imagens | Images |
| `profile.cover.upload` | Enviar imagem de capa | Upload cover image |
| `profile.contact` | Contato e região | Contact and region |
| `profile.phone` | Telefone | Phone |
| `profile.website` | Site | Website |
| `profile.currency` | Moeda padrão | Default currency |
| `team.title` | Equipe | Team |
| `team.subtitle` | Pessoas que podem entrar neste negócio. | People who can sign in to this business. |
| `team.invite` | Convidar uma pessoa | Invite a person |
| `team.invite.cta` | Enviar convite | Send invite |
| `team.invite.link` | Link de convite | Invite link |
| `team.invite.copied` | Link copiado | Link copied |
| `team.pending` | Convites pendentes | Pending invites |
| `team.remove.q` | Remover esta pessoa? | Remove this person? |
| `team.remove` | Remover | Remove |
| `team.you` | Você | You |
| `team.role.hint` | Gerentes cuidam do trabalho diário. A equipe cuida de pedidos e anúncios. O financeiro vê ganhos e repasses. | Managers run daily work. Staff handle orders and listings. Finance sees earnings and payouts. |
| `errors.TOO_MANY_INVITES` | Há convites abertos demais. Cancele alguns primeiro. | Too many open invites. Cancel some first. |
| `errors.ROLE_INVALID` | Escolha uma função. | Choose a role. |
| `errors.OWNER_IMMUTABLE` | O proprietário não pode ser alterado nem removido. | The owner can't be changed or removed. |
| `errors.CANNOT_CHANGE_SELF` | Você não pode alterar sua própria função. | You can't change your own role. |
| `errors.INVITE_INVALID` | Este convite é inválido ou expirou. | This invite is invalid or has expired. |
| `errors.INVITE_EMAIL_MISMATCH` | Entre com o e-mail que recebeu o convite. | Sign in with the email address that was invited. |
| `team.role` | Função | Role |
| `notif.title` | Alertas | Alerts |
| `notif.subtitle` | Saiba na hora quando um pedido ou reserva precisar de você. | Get told the moment an order or booking needs you. |
| `notif.channels` | Onde enviar os alertas | Where to send alerts |
| `notif.email` | E-mail | Email |
| `notif.email.body` | Uma mensagem curta para o e-mail da sua conta. | A short message to your account email. |
| `notif.telegram.body` | Mensagens instantâneas no Telegram. Vincule sua conta para ativar. | Instant messages in Telegram. Link your account to turn this on. |
| `notif.telegram.linked` | Conectado {name} | Connected {name} |
| `notif.telegram.connect` | Conectar Telegram | Connect Telegram |
| `notif.telegram.disconnect` | Desconectar | Disconnect |
| `notif.telegram.open` | Conclua no Telegram | Finish in Telegram |
| `notif.telegram.openLink` | Abra o Telegram e toque em Start | Open Telegram and press Start |
| `notif.telegram.unavailable` | Os alertas do Telegram ainda não estão disponíveis. O e-mail funciona. | Telegram alerts are not available yet. Email alerts still work. |
| `notif.kinds` | O que avisar | What to alert |
| `notif.kinds.body` | Desative os alertas de que não precisa. | Turn off alerts you don't need. |
| `notif.kind.order_new` | Novos pedidos | New orders |
| `notif.kind.booking_new` | Novas solicitações de reserva | New booking requests |
| `notif.kind.payout_update` | Atualizações de repasse | Payout updates |
| `notif.kind.merchant_status` | Mudanças na sua solicitação | Changes to your application |
| `more.alerts` | Alertas | Alerts |
| `more.payoutMethods` | Métodos de repasse | Payout methods |
| `notif.kind.message_new` | Novas mensagens de clientes | New customer messages |

### `seller/locales/pt/setup.json` (61 strings)

| Key | Text | English source |
| --- | --- | --- |
| `onb.title` | Configure seu negócio | Set up your business |
| `onb.subtitle` | Conte o que você vende. Você poderá alterar a maior parte depois. | Tell us what you sell. You can change most of this later. |
| `onb.type` | O que você quer fazer na Ciuna? | What do you want to do on Ciuna? |
| `onb.type.store` | Vender produtos | Sell products |
| `onb.type.store.body` | Comida, mercado e outros itens, com entrega ou retirada. | Food, groceries and goods, delivered or picked up. |
| `onb.type.expert` | Oferecer minha especialidade | Offer my expertise |
| `onb.type.expert.body` | Tradução, ajuda jurídica, aulas particulares e outros serviços, reservados por horário. | Translation, legal help, tutoring and other services, booked by time. |
| `onb.name.store` | Nome da loja | Store name |
| `onb.name.expert` | Seu nome ou o nome do seu consultório | Your name or practice name |
| `onb.line` | Seção do marketplace | Marketplace section |
| `onb.line.hint` | É aqui que os clientes vão encontrar você. | Where customers will find you. |
| `onb.line.food` | Comida | Food |
| `onb.line.mart` | Mercado (alimentos e outros itens) | Mart (groceries and goods) |
| `onb.country` | Em que país seu negócio está sediado? | Where is your business based? |
| `onb.country.hint` | Isso define quais documentos de verificação pedimos. | This decides which verification documents we ask for. |
| `onb.operating` | Onde você vende ou entrega? | Where do you sell or deliver? |
| `onb.operating.hint` | Os clientes dessas regiões verão seus anúncios. | Customers there will see your listings. |
| `onb.languages` | Idiomas em que você atende clientes | Languages you serve customers in |
| `onb.languages.hint` | Escolha pelo menos um. Você escreve seus anúncios nesses idiomas. | Choose at least one. You write your listings in these languages. |
| `onb.invite` | Você foi convidado para participar de {name} | You are invited to join {name} |
| `onb.invite.accept` | Participar | Join |
| `setup.title` | Configuração e verificação | Set up and verify |
| `setup.subtitle` | Conclua estas etapas. A Ciuna analisa seu negócio antes de ele entrar no ar. | Complete these steps. Ciuna reviews your business before you go live. |
| `setup.done` | Concluído | Done |
| `setup.todo` | A fazer | To do |
| `setup.optional` | Opcional | Optional |
| `setup.approved` | Seu negócio foi aprovado | Your business is approved |
| `setup.item.profile` | Perfil do negócio | Business profile |
| `setup.item.logo` | Logotipo | Logo |
| `setup.item.tier` | Escolher tipo de verificação | Choose verification type |
| `setup.item.kyb_fields` | Dados de verificação | Verification details |
| `setup.item.kyb_documents` | Documentos de verificação | Verification documents |
| `setup.item.first_listing` | Primeiro anúncio | First listing |
| `setup.profile.body` | Adicione a descrição no seu idioma principal e os dados de contato. | Add your description in your main language and contact details. |
| `setup.profile.cta` | Editar perfil | Edit profile |
| `setup.logo.upload` | Enviar logotipo | Upload logo |
| `setup.verify.title` | Verificação | Verification |
| `setup.verify.body` | Pedimos documentos diferentes conforme o país onde seu negócio está sediado. | We ask for different documents depending on where your business is based. |
| `setup.verify.tier` | Tipo de verificação | Verification type |
| `setup.tier1.body` | Para pessoas físicas e vendedores autônomos. Limites menores. | For individuals and self-employed sellers. Lower limits. |
| `setup.tier2.body` | Para empresas registradas. Limites completos. | For registered companies. Full limits. |
| `setup.docs.title` | Documentos | Documents |
| `doc.pending` | Em análise | In review |
| `doc.approved` | Aprovado | Approved |
| `doc.rejected` | Rejeitado | Rejected |
| `doc.expired` | Vencido | Expired |
| `setup.listing.store` | Adicione seu primeiro produto | Add your first product |
| `setup.listing.expert` | Adicione seu primeiro serviço | Add your first service |
| `setup.listing.body` | Salve agora como rascunho. Você poderá publicar depois que a Ciuna aprovar seu negócio. | Save it as a draft now. You can publish once Ciuna approves your business. |
| `setup.listing.addProduct` | Adicionar produto | Add product |
| `setup.listing.addService` | Adicionar serviço | Add service |
| `setup.submit.title` | Enviar para análise | Submit for review |
| `setup.submit.ready` | Tudo pronto. A Ciuna costuma analisar em até um dia útil. | Everything is ready. Ciuna usually reviews within one business day. |
| `setup.submit.notReady` | Ainda há etapas em aberto. Você poderá enviar quando concluí-las. | Some steps are still open. You can submit once they are done. |
| `setup.submit.cta` | Enviar para análise | Submit for review |
| `setup.submitted` | Enviado para análise | Submitted for review |
| `errors.APPLICATION_INCOMPLETE` | Ainda há etapas em aberto. Conclua-as e depois envie. | Some steps are still open. Complete them, then submit. |
| `errors.TIER_INVALID` | Escolha um tipo de verificação. | Choose a verification type. |
| `errors.DOCUMENT_LOCKED` | Documentos aprovados não podem ser removidos. | Approved documents can't be removed. |
| `errors.PATH_INVALID` | Este envio não é válido. Tente novamente. | That upload isn't valid. Try again. |
| `errors.EXPIRY_INVALID` | Use uma data de validade futura. | Use a future expiry date. |

## Customer app (web and Expo)

### `packages/shared/src/locales/zh/app.json` (1126 strings)

| Key | Text | English source |
| --- | --- | --- |
| `layout.back` | 返回 | Back |
| `layout.accessDenied` | 访问被拒绝 | Access Denied |
| `layout.adminCannotAccessUser` | 管理员用户无法访问用户页面。 | Admin users cannot access user pages. |
| `layout.goToAdminDashboard` | 前往管理后台 | Go to Admin Dashboard |
| `dashboard.profileAria` | 个人资料 | Profile |
| `dashboard.referEarn` | 推荐赚奖励 | Refer & Earn |
| `dashboard.supportAria` | 客服 | Support |
| `dashboard.totalVolume` | 累计支出 | Total Spent |
| `dashboard.transactions` | 交易 | Transactions |
| `dashboard.send` | 汇款 | Send |
| `dashboard.hub` | Hub | Hub |
| `dashboard.recipient` | 收款人 | Recipient |
| `dashboard.recentTransactions` | 最近交易 | Recent Transactions |
| `dashboard.seeAll` | 查看全部 | See All |
| `dashboard.noRecentTransactions` | 暂无最近交易 | No recent transactions |
| `dashboard.sendFirstTransfer` | 发起第一笔汇款 | Send Your First Transfer |
| `dashboard.referralPayout` | 推荐奖励提现 | Referral payout |
| `dashboard.withdrawalTo` | 提现至 | Withdrawal to |
| `dashboard.recipientReceives` | 收款人收到 | Recipient receives |
| `dashboard.recipientFallback` | 收款人 | Recipient |
| `dashboard.to` | 收款方 | To |
| `dashboard.unknownRecipient` | 未知 | Unknown |
| `dashboard.sendAmount` | 汇出金额 | Send Amount |
| `dashboard.receiveAmount` | 到账金额 | Receive Amount |
| `dashboard.fullAmountAria` | 完整金额：{{label}} | Full amount: {{label}} |
| `dashboard.fullAmountCaption` | 完整金额 | Full amount |
| `hub.hub` | Hub | Hub |
| `hub.heroTitle` | 汇款、购物、预约。 | Send, Shop & Book. |
| `hub.heroBody` | 美食杂货、汇款和各类服务，在 Ciuna 一站办理。 | Everything you need: groceries, transfers, and services in one place on Ciuna. |
| `hub.serviceLineTiles.food.title` | 美食 | Food |
| `hub.serviceLineTiles.food.shortDescription` | 想吃的，这里都有 | Have all your cravings |
| `hub.serviceLineTiles.mart.title` | 超市 | Mart |
| `hub.serviceLineTiles.mart.shortDescription` | 食品杂货及更多商品 | Find foodstuffs and more |
| `hub.serviceLineTiles.assistant.title` | 助手 | Assistant |
| `hub.serviceLineTiles.assistant.shortDescription` | 寄送包裹和文件 | Send packages and docs |
| `hub.serviceLineTiles.send.title` | 转账 | Transfer |
| `hub.serviceLineTiles.send.shortDescription` | 跨境汇款 | Cross-border money transfer |
| `hub.serviceLineTiles.experts.title` | 专家 | Experts |
| `hub.serviceLineTiles.experts.shortDescription` | 聘请值得信赖的专家 | Hire trusted experts |
| `hub.serviceLineTiles.insurance.title` | 保险 | Insurance |
| `hub.serviceLineTiles.insurance.shortDescription` | 日常保障 | Get everyday protection |
| `hub.serviceLineTiles.experiences.title` | 体验 | Experiences |
| `hub.serviceLineTiles.experiences.shortDescription` | 发现下一段精彩经历 | Find your next adventure |
| `hub.serviceLineTiles.gift-packs.title` | 礼包 | Gift Packs |
| `hub.serviceLineTiles.gift-packs.shortDescription` | 向他人赠送礼物 | Send gifts to someone |
| `hub.referEarn` | 推荐赚奖励 | Refer & earn |
| `hub.referEarnShort` | 赚奖励 | Earn |
| `hub.chatSupport` | 客服 | Support |
| `hub.logoAria` | Ciuna Hub 首页 | Ciuna Hub home |
| `hub.servicesTitle` | 服务 | Services |
| `hub.serviceUnavailable` | 该服务暂时不可用。 | This service is currently unavailable. |
| `hub.unavailableTitle` | 暂不可用 | Unavailable |
| `hub.redirecting` | 正在跳转… | Redirecting… |
| `hub.openingExternal` | 正在打开链接… | Opening link… |
| `hub.catalogSubtitle` | 用本地货币付款，即可订购所需服务和商品的市场 | A marketplace to order services and products you need by paying with your local currency |
| `hub.productsSectionTitle` | 商品 | Products |
| `hub.marketplaceProductsHeading` | 商品 | Products |
| `hub.marketplaceStoresHeading` | 店铺 | Stores |
| `hub.storesDirectorySubtitle` | 选择一家店铺查看其商品。 | Choose a store to see its products. |
| `hub.marketplaceSeeAllStores` | 查看全部 | See all |
| `hub.marketplaceNoVendors` | 暂无店铺，请稍后再来。 | No stores yet — check back soon. |
| `hub.verifiedVendor` | 已认证商家 | Verified vendor |
| `hub.backToLine` | 返回上一级 | Back to line |
| `hub.vendorStoreNotFound` | 未找到店铺 | Store not found |
| `hub.vendorStoreNotFoundBody` | 该店铺不可用，或链接可能有误。 | This store is unavailable or the link may be incorrect. |
| `hub.categoryFilterAria` | 按类别筛选 | Filter by category |
| `hub.noProductsInCategory` | 该类别下暂无商品。 | No products in this category. |
| `hub.showingCategory` | 当前类别： | Showing category: |
| `hub.allCategories` | 全部类别 | All categories |
| `hub.all` | 全部 | All |
| `hub.noProducts` | 暂无可用商品。 | No products available yet. |
| `hub.noImage` | 无图片 | No image |
| `hub.setAmount` | 设置金额 | Set amount |
| `hub.buy` | 购买 | Buy |
| `hub.order` | 下单 | Order |
| `hub.productNotFound` | 未找到商品。 | Product not found. |
| `hub.backToHub` | 返回 Hub | Back to Hub |
| `hub.expertsTitle` | 专家 | Experts |
| `hub.expertsSubtitle` | 为您的家居和美容需求提供值得信赖的专业人士。 | Trusted professionals for all your home and beauty needs. |
| `hub.expertsFeaturedHeading` | 精选 | Featured |
| `hub.expertsSeeAll` | 查看全部 | See all |
| `hub.expertsServicesHeading` | 服务 | Services |
| `hub.expertsFeaturedEmpty` | 暂无专家，请稍后再来。 | No experts yet — check back soon. |
| `hub.expertsDirectoryTitle` | 全部专家 | All experts |
| `hub.expertsDirectorySubtitle` | 浏览 Ciuna 上的所有专家。 | Browse every expert on Ciuna. |
| `hub.backToExperts` | 返回专家列表 | Back to experts |
| `hub.expertVerified` | 已认证专家 | Verified expert |
| `hub.expertsServicesEmpty` | 暂无服务。 | No services listed yet. |
| `hub.expertsServicesNoneInCategory` | 该类别下暂无服务。 | No services in this category. |
| `hub.expertsAll` | 全部专家 | All experts |
| `hub.expertNotFound` | 未找到专家 | Expert not found |
| `hub.noProductImage` | 无商品图片 | No product image |
| `hub.userInputPricingHint` | 您可自行选择要支付的金额（{{currency}}），并需支付服务手续费。 | You choose the amount to cover ({{currency}}). A service fee applies. |
| `hub.buyNow` | 立即购买 | Buy now |
| `hub.orderNow` | 立即下单 | Order now |
| `hub.checkout.title` | 结算 | Checkout |
| `hub.checkout.hubCheckoutTitle` | Ciuna Hub 结算 | Ciuna Hub Checkout |
| `hub.checkout.order` | 订单 | Order |
| `hub.checkout.steps.amount` | 金额 | Amount |
| `hub.checkout.steps.details` | 详情 | Details |
| `hub.checkout.steps.pay` | 付款 | Pay |
| `hub.checkout.amountCurrency` | 金额和币种 | Amount & currency |
| `hub.checkout.amountToCover` | 请输入付款金额 | Enter amount to pay |
| `hub.checkout.payWith` | 您的付款币种 | Currency you'll pay with |
| `hub.checkout.currency` | 币种 | Currency |
| `hub.checkout.youPayReadonly` | 您支付（不可修改） | You pay (read-only) |
| `hub.checkout.orderSummary` | 订单摘要 | Order summary |
| `hub.checkout.productLabel` | 商品 | Product |
| `hub.checkout.productPrice` | 商品价格 | Product price |
| `hub.checkout.servicePrice` | 服务价格 | Service price |
| `hub.checkout.subtotal` | 小计 | Subtotal |
| `hub.checkout.transferFee` | 兑换手续费 | Exchange fee |
| `hub.checkout.hubFee` | Hub 手续费 | Hub fee |
| `hub.checkout.orderTotal` | 订单总额 | Order Total |
| `hub.checkout.exchangeRate` | 汇率 | Exchange Rate |
| `hub.checkout.totalToPay` | 应付总额 | Total to Pay |
| `hub.checkout.fulfillmentSummary` | 履约 | Fulfillment |
| `hub.checkout.fulfilledWithin` | 完成时间 | Fulfilled within |
| `hub.checkout.selectCurrencyAmountHint` | 请选择币种并输入金额以查看合计。 | Select currencies and amount to see totals. |
| `hub.checkout.continue` | 继续 | Continue |
| `hub.checkout.contactDetails` | 履约信息 | Fulfillment details |
| `hub.checkout.fullName` | 姓名 | Full name |
| `hub.checkout.phone` | 电话 | Phone |
| `hub.checkout.comment` | 备注 | Comment |
| `hub.checkout.commentPlaceholder` | 请填写此订单的重要说明。 | Add any important notes for this order. |
| `hub.checkout.inPersonAddressHint` | 请为此次线下服务选择一个已保存的地址。 | Choose a saved address for this in-person fulfillment. |
| `hub.checkout.savedAddressOptional` | 已保存的地址（选填） | Saved address (optional) |
| `hub.checkout.select` | 请选择 | Select |
| `hub.checkout.none` | 无 | None |
| `hub.checkout.deliveryNotesAddressOptional` | 配送/备注地址（选填） | Delivery / notes address (optional) |
| `hub.checkout.addressLine` | 详细地址 | Address line |
| `hub.checkout.back` | 返回 | Back |
| `hub.checkout.continueToPayment` | 继续付款 | Continue to payment |
| `hub.checkout.makePayment` | 付款 | Make payment |
| `hub.checkout.youWillPay` | 您将支付 | You will pay |
| `hub.checkout.for` | 用于 | for |
| `hub.checkout.serverRecalculated` | 确认时，系统将在服务器端重新计算合计金额。 | Totals are recalculated on the server when you confirm. |
| `hub.checkout.paymentMethodFor` | 付款方式（{{currency}}） | Payment method ({{currency}}) |
| `hub.checkout.selectPaymentMethod` | 选择付款方式 | Select payment method |
| `hub.checkout.noActivePaymentMethod` | 未找到可用于 {{currency}} 的付款方式。请先在 Office 的汇率/设置中添加，再进行结算。 | No active payment method found for {{currency}}. Add one in Office rates/settings before checkout. |
| `hub.checkout.creating` | 正在创建… | Creating… |
| `hub.checkout.errors.verifyEmail` | 请先验证您的邮箱，再继续。 | Please verify your email before continuing. |
| `hub.checkout.errors.checkAmount` | 请检查金额和币种。 | Check amount and currencies. |
| `hub.checkout.errors.namePhoneRequired` | 请填写姓名和电话。 | Name and phone are required. |
| `hub.checkout.errors.deliveryAddressRequired` | 请选择配送地址。 | Select a delivery address. |
| `hub.checkout.errors.fillField` | 请填写：{{field}} | Please fill: {{field}} |
| `hub.checkout.errors.noPaymentMethodForCurrency` | 尚未为 {{currency}} 配置付款方式。 | No payment method is configured for {{currency}}. |
| `hub.checkout.errors.paymentSetupFailed` | 付款设置失败 | Payment setup failed |
| `hub.checkout.errors.missingTransaction` | 缺少交易 | Missing transaction |
| `hub.checkout.errors.failed` | 失败 | Failed |
| `hub.checkout.forProduct` | {{product}} 的结算 | Checkout for {{product}} |
| `hub.payFrom` | 起付金额 | Pay from |
| `hub.payUpTo` | 最高付款 | Pay up to |
| `hub.toRange` | 至 | to |
| `hub.sellPrice` | 售价 | Sell price |
| `assistant.title` | 助手 | Assistant |
| `assistant.intro` | 告诉我们您的需求，Ciuna 助手将为您安排取件、代购和跑腿。 | Tell us what you need — Ciuna Assistant coordinates pickup, shopping, and errands. |
| `assistant.help` | 帮助 | Help |
| `assistant.section.serviceType` | 服务类型 | Service type |
| `assistant.section.details` | 地址和说明 | Addresses & instructions |
| `assistant.kind.pickupTitle` | 取件 | Pick up an order |
| `assistant.kind.pickupDesc` | 我们代您取回已下单或等待自提的物品。 | We collect something you already ordered or that is waiting for pickup. |
| `assistant.kind.buyTitle` | 代购 | Buy something |
| `assistant.kind.buyDesc` | 我们代您从店铺或商家购买商品。 | We purchase items on your behalf from a store or vendor. |
| `assistant.kind.errandTitle` | 跑腿 | Run errands |
| `assistant.kind.errandDesc` | 在市内递送文件、包裹和处理小事务。 | Documents, packages, and quick tasks around the city. |
| `assistant.field.whatToBuy` | 需要我们购买什么？ | What should we buy? |
| `assistant.field.pickupInstructions` | 取件地点和说明 | Pickup & instructions |
| `assistant.field.courier` | 配送员偏好 | Courier preference |
| `assistant.field.vehicle` | 交通工具 | Vehicle |
| `assistant.field.dropoff` | 送达地点 | Drop-off |
| `assistant.placeholder.pickup` | 取件地点、取件码、现场联系人… | Where to pick up, codes, contact on site… |
| `assistant.placeholder.buy` | 店铺名称、商品清单、尺码、可替代选项… | Store name, product list, sizes, alternatives… |
| `assistant.placeholder.vehicle` | 自行车、汽车、厢式货车，或留空表示不限 | Bike, car, van — or leave blank for any |
| `assistant.placeholder.dropoff` | 完整的送达地址和进入说明 | Full drop-off address and access notes |
| `assistant.cta.pickKind` | 选择服务类型 | Choose a service type |
| `assistant.cta.pickupDetails` | 填写取件信息 | Add pickup details |
| `assistant.cta.buyDetails` | 填写代购信息 | Add shopping details |
| `assistant.cta.dropoff` | 填写送达地点 | Add drop-off |
| `assistant.cta.vehicle` | 填写交通工具偏好 | Add vehicle preference |
| `assistant.cta.submit` | 提交申请 | Submit request |
| `assistant.pill.howItWorks` | 使用流程 | How it works |
| `assistant.pill.restrictions` | 限制说明 | Restrictions |
| `assistant.footer.total` | 合计 | Total |
| `assistant.footer.fromQuote` | 以报价为准（审核后） | From quote (after review) |
| `assistant.footer.payment` | 报价后付款 | Payment after quote |
| `assistant.submitting` | 正在提交… | Submitting… |
| `assistant.submitFailed` | 无法提交，请重试。 | Could not submit. Try again. |
| `experts.profile.bookSession` | 预约咨询 | Book a session |
| `experts.profile.notBookableOnline` | 暂不支持在线预约 | Not bookable online |
| `experts.profile.servicesHeading` | 服务 | Services |
| `experts.profile.noServices` | 暂无可预约的服务。 | No bookable services yet. |
| `experts.profile.typicalSession` | 常规时长：{{minutes}} 分钟 | Typical session: {{minutes}} min |
| `experts.profile.serviceArea` | 服务区域：{{area}} | Area: {{area}} |
| `experts.profile.fulfillmentOnline` | 线上 | Online |
| `experts.profile.fulfillmentInPerson` | 线下 | In person |
| `experts.profile.fulfillmentBoth` | 线上或线下 | Online or in person |
| `experts.profile.fulfillmentHero` | 服务方式：{{value}} | Fulfillment: {{value}} |
| `experts.profile.priceFrom` | 起价 | From |
| `experts.booking.title` | 预约专家 | Book an expert |
| `experts.booking.intro` | 请选择一位已上线的专家并提出时间。Ciuna 将与您确认详情。 | Pick a published expert and suggest a time. Ciuna will confirm details with you. |
| `experts.booking.loading` | 正在加载专家… | Loading experts… |
| `experts.booking.noExperts` | 暂无已上线的专家，请稍后再来。 | No published experts yet. Check back soon. |
| `experts.booking.expert` | 专家 | Expert |
| `experts.booking.slotStart` | 期望开始时间 | Preferred start |
| `experts.booking.slotEnd` | 期望结束时间 | Preferred end |
| `experts.booking.message` | 备注 | Notes |
| `experts.booking.saving` | 正在保存… | Saving… |
| `experts.booking.submit` | 提交预约申请 | Request booking |
| `experts.booking.backCatalog` | 返回专家目录 | Back to Experts catalog |
| `experts.booking.success` | 预约申请已发送。 | Booking request sent. |
| `experts.booking.failed` | 无法发送预约，请重试。 | Could not send booking. Try again. |
| `experts.bookingWizard.pageTitle` | 预约 {{name}} | Book with {{name}} |
| `experts.bookingWizard.heroBookService` | 预约{{title}}服务 | Book {{title}} Service |
| `experts.bookingWizard.providedBy` | 服务提供方 | Provided by |
| `experts.bookingWizard.checkoutServiceLabel` | 服务 | Service |
| `experts.bookingWizard.sessionTime` | 预约时间 | Session time |
| `experts.bookingWizard.stepSession` | 服务 | Session |
| `experts.bookingWizard.stepTime` | 日期和时间 | Date & time |
| `experts.bookingWizard.stepCheckout` | 结算 | Checkout |
| `experts.bookingWizard.stepConfirm` | 确认 | Confirm |
| `experts.bookingWizard.chooseService` | 选择服务类型 | Choose a session type |
| `experts.bookingWizard.noServices` | 暂无可预约的服务。 | No bookable services yet. |
| `experts.bookingWizard.continue` | 继续 | Continue |
| `experts.bookingWizard.back` | 返回 | Back |
| `experts.bookingWizard.chooseTime` | 选择日期和时间 | Pick a date and time |
| `experts.bookingWizard.pickDay` | 请选择有空位的日期 | Pick a day with availability |
| `experts.bookingWizard.loadingSlots` | 正在加载时间… | Loading times… |
| `experts.bookingWizard.selectDayHint` | 在日历上选择日期，即可查看可约时间。 | Select a day on the calendar to see open times. |
| `experts.bookingWizard.noSlotsDay` | 当天暂无可约时间。 | No times on this day. |
| `experts.bookingWizard.loadingConfirm` | 正在加载确认信息… | Loading confirmation… |
| `experts.bookingWizard.confirmTitle` | 核对并确认 | Review and confirm |
| `experts.bookingWizard.yourName` | 您的姓名 | Your name |
| `experts.bookingWizard.email` | 邮箱 | Email |
| `experts.bookingWizard.termsPrefix` | 我同意 | I agree to the |
| `experts.bookingWizard.terms` | 服务条款 | Terms |
| `experts.bookingWizard.and` | 和 | and |
| `experts.bookingWizard.privacy` | 隐私政策 | Privacy Policy |
| `experts.bookingWizard.paymentStubNote` | 当前版本不会扣款。我们将通过邮件确认您的预约。 | Payment is not charged in this version. We will confirm your booking by email. |
| `experts.bookingWizard.payAmount` | 支付 {{amount}} | Pay {{amount}} |
| `experts.bookingWizard.confirmBooking` | 确认预约 | Confirm booking |
| `experts.bookingWizard.acceptTerms` | 请先接受条款，再继续。 | Please accept the terms to continue. |
| `experts.bookingWizard.nameRequired` | 请输入您的姓名。 | Please enter your name. |
| `experts.bookingWizard.slotTaken` | 该时间刚刚被预约。请选择其他时间，或返回重新选择时段。 | That time was just taken. Pick another time or go back to choose a different slot. |
| `experts.bookingWizard.slotUnavailable` | 该时段已不可预约。 | This time slot is no longer available. |
| `experts.bookingWizard.tryAgain` | 重新预约 | Try booking again |
| `experts.bookingWizard.successTitle` | 预约成功 | You’re booked |
| `experts.bookingWizard.successBody` | 谢谢，您与 {{name}} 的预约已保留。 | Thanks — your session with {{name}} is reserved. |
| `experts.bookingWizard.confirmationEmail` | 我们已向 {{email}} 发送确认邮件。 | We sent a confirmation to {{email}}. |
| `experts.bookingWizard.bookAnother` | 再预约一次 | Book another session |
| `experts.bookingWizard.quoteNote` | 最终价格可能在服务前后另行商定。 | Final price may be agreed separately before or after the session. |
| `experts.bookingWizard.priceQuote` | 价格稍后商定 | We’ll agree price later |
| `experts.bookingWizard.priceHourly` | {{rate}} {{currency}} / 小时 | {{rate}} {{currency}} / hr |
| `experts.bookingWizard.priceFixed` | {{amount}} {{currency}} | {{amount}} {{currency}} |
| `experts.bookingWizard.priceFixedWithLabel` | {{amount}} {{currency}} — {{label}} | {{amount}} {{currency}} — {{label}} |
| `experts.bookingWizard.priceDash` | — | — |
| `transactions.title` | 动态 | Activities |
| `transactions.searchPlaceholder` | 搜索交易… | Search transactions... |
| `transactions.empty` | 未找到交易 | No transactions found |
| `transactions.emptyHint` | 从发起第一笔汇款开始吧 | Start by sending your first transfer |
| `transactions.noSearchResults` | 没有符合搜索条件的交易 | No transactions match your search |
| `transactions.adjustSearch` | 请尝试更换搜索词 | Try adjusting your search terms |
| `transactions.referralPayout` | 推荐奖励提现 | Referral payout |
| `transactions.withdrawalTo` | 提现至 | Withdrawal to |
| `transactions.recipientReceives` | 收款人收到 | Recipient receives |
| `transactions.recipientFallback` | 收款人 | Recipient |
| `transactions.to` | 收款方 | To |
| `transactions.unknownRecipient` | 未知 | Unknown |
| `transactions.sendAmount` | 汇出金额 | Send Amount |
| `transactions.receiveAmount` | 到账金额 | Receive Amount |
| `transactions.orderLabel` | 订单 | ORDER |
| `transactions.sendBadge` | 汇款 | SEND |
| `transactions.amountPaid` | 已付金额 | Amount Paid |
| `transactions.orderAmount` | 订单金额 | Order Amount |
| `orders.title` | 转账 | Transfer |
| `orders.totalVolume` | 累计支出 | Total Spent |
| `orders.totalTransactions` | 交易 | Transactions |
| `orders.rowSentTo` | 汇款给 {{name}} | Sent to {{name}} |
| `orders.rowHubOrder` | Hub 订单 | Hub order |
| `orders.statusPending` | 待处理 | Pending |
| `orders.statusFailed` | 失败 | Failed |
| `orders.statusCancelled` | 已取消 | Cancelled |
| `orders.searchPlaceholder` | 搜索交易… | Search transactions... |
| `orders.chipAll` | 全部 | All |
| `orders.chipSend` | 汇款 | Send |
| `orders.chipHub` | Hub | Hub |
| `orders.chipPayout` | 提现 | Payout |
| `orders.badgeFood` | 美食 | Food |
| `orders.badgeMart` | 超市 | Mart |
| `orders.badgeReferral` | 推荐 | Referral |
| `orders.groupToday` | 今天 | Today |
| `orders.groupYesterday` | 昨天 | Yesterday |
| `txDetail.errorNotFound` | 未找到交易或无权访问 | Transaction not found or access denied |
| `txDetail.errorLoadFailed` | 无法加载交易详情 | Failed to load transaction details |
| `txDetail.notFound` | 未找到交易 | Transaction not found |
| `txDetail.backToDashboard` | 返回首页 | Back to Dashboard |
| `txDetail.login` | 登录 | Login |
| `txDetail.referralPayout` | 推荐奖励提现 | Referral payout |
| `txDetail.transaction` | 交易 | Transaction |
| `txDetail.transfer` | 转账 | Transfer |
| `txDetail.payoutStatus` | 提现状态 | Payout status |
| `txDetail.transactionStatus` | 交易状态 | Transaction Status |
| `txDetail.copyTxnId` | 复制交易编号 | Copy Transaction ID |
| `txDetail.transactionId` | 交易编号 | Transaction ID |
| `txDetail.createdLabel` | 创建时间： | Created: |
| `txDetail.failedLabel` | 失败时间： | Failed: |
| `txDetail.statusLabel` | 状态： | Status: |
| `txDetail.receiptUploaded` | 付款凭证已上传 | Payment Receipt Uploaded |
| `txDetail.receiptFile` | 凭证文件 | Receipt file |
| `txDetail.sendAgain` | 再次汇款 | Send Again |
| `txDetail.backToReferrals` | 返回推荐 | Back to referrals |
| `txDetail.contactSupport` | 联系客服 | Contact Support |
| `txDetail.dashboard` | 首页 | Dashboard |
| `txDetail.payoutSummary` | 提现摘要 | Payout summary |
| `txDetail.transactionSummary` | 交易摘要 | Transaction Summary |
| `txDetail.withdrawalAmount` | 提现金额 | Withdrawal amount |
| `txDetail.youSent` | 您已汇出 | You Sent |
| `txDetail.hubAmountPaid` | 已付金额 | Amount Paid |
| `txDetail.hubOrderAmount` | 订单金额 | Order Amount |
| `txDetail.hubProductAmount` | 商品金额 | Product Amount |
| `txDetail.hubOrderTitle` | 订单摘要 | Order summary |
| `txDetail.hubOrderSummary` | 订单摘要 | Order summary |
| `txDetail.hubTotalToPaid` | 应付总额 | Total to paid |
| `txDetail.hubFee` | Hub 手续费 | Hub fee |
| `txDetail.fulfillmentSummary` | 履约 | Fulfillment |
| `txDetail.fulfillmentContact` | 联系人 | Contact |
| `txDetail.fulfillmentAddress` | 地址 | Address |
| `txDetail.fulfillmentComment` | 备注 | Comment |
| `txDetail.fullName` | 姓名 | Full name |
| `txDetail.phone` | 电话 | Phone |
| `txDetail.fee` | 兑换手续费 | Exchange fee |
| `txDetail.free` | 免费 | Free |
| `txDetail.totalPaid` | 已付总额 | Total Paid |
| `txDetail.recipientGets` | 收款人收到 | Recipient Gets |
| `txDetail.exchangeRate` | 汇率 | Exchange Rate |
| `txDetail.logisticsFee` | 物流费 | Logistics fee |
| `txDetail.cashDelivery` | 现金配送 | Cash delivery |
| `txDetail.recipient` | 收款人 | Recipient |
| `txDetail.timerTookDelayed` | 用时 {{elapsed}} • 延迟 {{delay}} | Took {{elapsed}} • Delayed {{delay}} |
| `txDetail.timerTook` | 用时 {{elapsed}} | Took {{elapsed}} |
| `txDetail.timerDelayed` | 延迟 {{delay}} | Delayed {{delay}} |
| `txDetail.timerTimeLeft` | 剩余时间 {{time}} | Time left {{time}} |
| `txDetail.stepTxnInitiated` | 交易已发起 | Transaction Initiated |
| `txDetail.stepPaymentReceived` | 已收到付款 | Payment Received |
| `txDetail.stepTransferInitiated` | 转账已发起 | Transfer Initiated |
| `txDetail.stepTransferFailed` | 转账失败 | Transfer Failed |
| `txDetail.stepTransferCancelled` | 转账已取消 | Transfer Cancelled |
| `txDetail.stepTxnCreated` | 交易已创建 | Transaction Created |
| `txDetail.stepTransferComplete` | 转账已完成 | Transfer Complete |
| `txDetail.hubStepFulfillmentStarted` | 开始履约 | Fulfillment Started |
| `txDetail.hubStepTransactionFailed` | 交易失败 | Transaction Failed |
| `txDetail.hubStepTransactionCancelled` | 交易已取消 | Transaction Cancelled |
| `txDetail.hubStepOrderCompleted` | 订单已完成 | Order Completed |
| `txDetail.payoutRequestSubmitted` | 申请已提交 | Request submitted |
| `txDetail.payoutRequestSubmittedDesc` | 您的推荐奖励提现已进入处理队列。 | Your referral withdrawal is queued for processing. |
| `txDetail.payoutProcessing` | 提现处理中 | Processing payout |
| `txDetail.payoutProcessingDesc` | 我们正在将资金汇至您已保存的收款人。 | We're sending funds to your saved recipient. |
| `txDetail.payoutComplete` | 提现已完成 | Payout complete |
| `txDetail.payoutCompleteDesc` | 您的推荐奖励已汇至收款人。 | Your referral reward has been sent to your recipient. |
| `txDetail.payoutFailed` | 提现失败 | Payout failed |
| `txDetail.payoutFailedDesc` | 处理此次提现时出现问题，请联系客服。 | There was an issue processing this withdrawal. Please contact support. |
| `txDetail.payoutCancelled` | 申请已取消 | Request cancelled |
| `txDetail.payoutCancelledDesc` | 此次提现申请已取消，您的推荐余额未被扣减。 | This payout request was cancelled. Your referral balance was not reduced. |
| `txDetail.payoutProcessingGeneric` | 处理中 | Processing |
| `txDetail.payoutProcessingGenericDesc` | 您的提现正在处理。 | Your withdrawal is being processed. |
| `txDetail.statusTxnCreated` | 交易已创建 | Transaction Created |
| `txDetail.statusTxnCreatedDesc` | 您的转账已创建，正在处理中 | Your transfer has been created and is being processed |
| `txDetail.statusPaymentReceived` | 已收到付款 | Payment Received |
| `txDetail.statusPaymentReceivedDesc` | 我们已收到您的付款，正在处理中 | Your payment has been received and is being processed |
| `txDetail.statusTransferComplete` | 转账已完成 | Transfer Complete! |
| `txDetail.statusTransferCompleteDesc` | 您的款项已成功转出 | Your money has been successfully transferred |
| `txDetail.hubStatusOrderCreated` | 订单已创建 | Order created |
| `txDetail.hubStatusOrderCreatedDesc` | 您的 Hub 订单已创建，等待履约。 | Your Hub order has been created and is awaiting fulfillment. |
| `txDetail.hubStatusFulfillmentStarted` | 已开始履约 | Fulfillment started |
| `txDetail.hubStatusFulfillmentStartedDesc` | 您的 Hub 订单正在履约中。 | Your Hub order is being fulfilled. |
| `txDetail.hubStatusOrderCompleted` | 订单已完成 | Order completed |
| `txDetail.hubStatusOrderCompletedDesc` | 您的 Hub 订单已成功履约。 | Your Hub order was fulfilled successfully. |
| `txDetail.statusTxnFailed` | 交易失败 | Transaction Failed |
| `txDetail.statusTxnFailedDesc` | 您的交易出现问题，请联系客服。 | There was an issue with your transaction. Please contact support. |
| `txDetail.statusTxnCancelled` | 交易已取消 | Transaction Cancelled |
| `txDetail.statusTxnCancelledDesc` | 此交易已取消。如已付款，将为您退款。 | This transaction has been cancelled. You will receive a refund if payment was made. |
| `txDetail.statusProcessing` | 交易处理中 | Transaction Processing |
| `txDetail.statusProcessingDesc` | 您的交易正在处理中 | Your transaction is being processed |
| `txTimeline.payoutSubmitted` | 申请已提交 | Request submitted |
| `txTimeline.payoutSubmittedDesc` | 我们已收到您的推荐奖励提现申请。 | Your referral withdrawal request was received. |
| `txTimeline.processing` | 处理中 | Processing |
| `txTimeline.processingDesc` | 我们正在审核并将提现款项汇至您的收款人。 | We're reviewing and sending your payout to your recipient. |
| `txTimeline.payoutSent` | 提现已汇出 | Payout sent |
| `txTimeline.payoutSentDescBank` | 资金正在汇往 {{bank}}。 | Funds are on the way to {{bank}}. |
| `txTimeline.payoutSentDesc` | 您的推荐奖励提现已处理完成。 | Your referral payout has been processed. |
| `txTimeline.initiated` | 已发起 | Initiated |
| `txTimeline.initiatedDesc` | 等待付款确认 | Pending payment confirmation |
| `txTimeline.processingSend` | 处理中 | Processing |
| `txTimeline.processingSendDesc` | 您的款项正在汇出途中。 | Your money is on its way. |
| `txTimeline.hubProcessingSend` | 正在处理您的订单 | Processing your order |
| `txTimeline.hubProcessingSendDesc` | 我们正在履行您的 Ciuna Hub 订单。 | We're fulfilling your Ciuna Hub order. |
| `txTimeline.completed` | 已完成 | Completed |
| `txTimeline.completedDescBank` | {{bank}} 已收到您的交易。 | {{bank}} received your transaction. |
| `txTimeline.completedDesc` | 交易已成功完成。 | Transaction completed successfully. |
| `txTimeline.hubOrderCompletedDesc` | 您的订单已成功履约。 | Your order was fulfilled successfully. |
| `support.title` | 客服 | Support |
| `support.getInTouch` | 联系我们 | Get in Touch |
| `support.emailSupport` | 邮件客服 | Email Support |
| `support.telegramChat` | Telegram 在线咨询 | Telegram Chat |
| `support.telegramSubtitle` | 通过 Telegram 与我们聊天 | Chat with us on Telegram |
| `support.faqTitle` | 常见问题 | Frequently Asked Questions |
| `support.hoursTitle` | 客服时间 | Support Hours |
| `support.hoursBody` | 每天 8:00 至 23:00（GMT+3） | All week from 8 am to 11pm GMT+3 |
| `support.faq1q` | 如何汇款？ | How do I send money? |
| `support.faq1a` | 汇款时，请点击首页上的“汇款”按钮，输入金额并选择币种，选择收款人，使用显示的付款方式完成付款，然后确认您的交易。 | To send money, click the "Send Money" button on your dashboard, enter the amount and select currencies, choose a recipient, make payment using the displayed method, and confirm your transaction. |
| `support.faq2q` | 手续费是多少？ | What are the fees? |
| `support.faq2a` | 我们对所有交易均不收取任何手续费。通过 Ciuna 向全球汇款，完全免费。 | We charge absolutely no fees on any transaction. Send money worldwide completely free with Ciuna. |
| `support.faq3q` | 需要多长时间？ | How long does it take? |
| `support.faq3a` | 所有交易均在几分钟内完成，确保您的款项快速、高效地到达目的地。 | All transactions are completed within minutes, ensuring your money reaches its destination quickly and efficiently. |
| `send.retry` | 重试 | Retry |
| `send.noCurrencies` | 暂无可用币种，请联系客服。 | No currencies available. Please contact support. |
| `send.youSend` | 您汇出 | You Send |
| `send.receiverGets` | 收款人收到 | Receiver Gets |
| `send.sendMoneyHeroTitle` | 汇款 | Send Money |
| `send.sendMoneyHeroSubtitle` | 选择金额和币种开始 | Choose amount and currencies to begin |
| `send.steps.amount` | 金额 | Amount |
| `send.steps.recipient` | 收款人 | Recipient |
| `send.steps.review` | 核对 | Review |
| `send.rateUnavailable` | 该币种组合暂无汇率。 | Exchange rate not available for this pair. |
| `send.mobile.amountHeadline` | 您要汇多少？ | How much are you sending? |
| `send.mobile.recipientHeadline` | 汇给谁？ | Who receives it? |
| `send.mobile.reviewHeadline` | 核对并付款 | Review & pay |
| `send.mobile.manageRecipients` | 管理收款人 | Manage recipients |
| `send.mobile.saveRecipient` | 保存收款人 | Save recipient |
| `send.mobile.paymentSbp` | 付款方式：SBP | Payment: SBP |
| `send.mobile.createSbpPayment` | 创建 SBP 付款 | Create SBP payment |
| `send.mobile.verifyBannerTitle` | 完成身份验证后即可汇款 | Verify identity to send money |
| `send.mobile.verifyBannerAction` | 开始 | Begin |
| `send.mobile.swapCurrencies` | 交换币种 | Swap currencies |
| `send.mobile.verifyRequired` | 请先完成身份验证，再进行汇款。 | Complete identity verification to send money. |
| `send.mobile.quoteFeesUnavailable` | 无法确认手续费，请重试。 | Couldn't confirm the fee. Try again. |
| `send.mobile.quoteBelowMinRub` | 汇款金额不得低于 1,000 RUB。 | Send at least 1,000 RUB. |
| `send.mobile.quoteMinContribution` | 请提高汇款金额后继续。 | Send a higher amount to continue. |
| `send.quoteDeskRateNotConfigured` | 该汇款通道尚未就绪。请在 Office 中设置 USD → 收款币种的汇率（用作 USDT 出款汇率）。 | This corridor isn't ready yet. Set the USD → receive currency rate in Office (used as USDT payout desk). |
| `send.quoteReceiveCappedByUsdt` | 收款金额为扣除手续费后此笔付款可兑付的金额。 | Recipient amount reflects what this payment can fund after fees. |
| `send.quoteMinContribution` | 请提高汇款金额后继续。 | Send a higher amount to continue. |
| `send.fee` | 兑换手续费 | Exchange fee |
| `send.processingFee` | 处理手续费 | Processing Fee |
| `send.rate` | 汇率 | Exchange Rate |
| `send.free` | 免费 | Free |
| `send.min` | 最低：{{amount}} | Min: {{amount}} |
| `send.max` | 最高：{{amount}} | Max: {{amount}} |
| `send.continue` | 继续 | Continue |
| `send.addRecipient` | 添加收款人 | Add Recipient |
| `send.searchRecipients` | 搜索收款人 | Search recipients |
| `send.addNewRecipient` | 添加新收款人 | Add new recipient |
| `send.addNewRecipientTitle` | 添加新收款人 | Add New Recipient |
| `send.currency` | 币种 | Currency |
| `send.autoSelected` | 自动选择 | Auto-selected |
| `send.accountName` | 账户名称 * | Account Name * |
| `send.enterAccountName` | 请输入账户名称 | Enter account name |
| `send.selectCurrencyFirst` | 请先选择币种，以查看所需填写的字段 | Please select a currency first to see the required fields |
| `send.transferType` | 转账类型 * | Transfer Type * |
| `send.addRecipientBtn` | 添加收款人 | Add Recipient |
| `send.noRecipientsSearch` | 未找到与“{{term}}”匹配的收款人 | No recipients found matching "{{term}}" |
| `send.noRecipientsCurrency` | 未找到 {{currency}} 的收款人 | No recipients found for {{currency}} |
| `send.addRecipientHint` | 添加新收款人即可开始 | Add a new recipient to get started |
| `send.back` | 返回 | Back |
| `send.makePayment` | 付款 | Make Payment |
| `send.transferLine` | 转账 {{amount}} | Transfer {{amount}} |
| `send.transferLineWithLogistics` | 转账 {{amount}}（另加物流费） | Transfer {{amount}} (+ logistics fee) |
| `send.sendAmountPlusFee` | 汇出金额：{{send}} + 兑换手续费：{{fee}} | Send amount: {{send}} + Exchange fee: {{fee}} |
| `send.noPaymentMethods` | 尚未为 {{currency}} 配置付款方式 | No payment methods configured for {{currency}} |
| `send.contactSupport` | 请联系客服 | Please contact support |
| `send.importantInstructions` | 重要说明 | Important Instructions |
| `send.transferExactly` | 请准确转账 | Transfer exactly |
| `send.amountFeeBreakdown` | （金额：{{send}} + 兑换手续费：{{fee}}） | (Amount: {{send}} + Exchange fee: {{fee}}) |
| `send.noteTransactionId` | 请记下交易编号 | Note Transaction ID |
| `send.completeWithin` | 请在以下时间内完成 | Complete within |
| `send.aFewMinutes` | 几分钟 | a few minutes |
| `send.uploadReceiptVerify` | 上传凭证可加快核验 | Upload receipt for quick verification |
| `send.scanQrBanking` | 请使用手机银行应用扫描二维码 | Scan QR code with your mobile banking app |
| `send.cryptoAsset` | 资产 | Asset |
| `send.cryptoNetwork` | 网络 | Network |
| `send.walletAddress` | 钱包地址 | Wallet address |
| `send.stablecoinMissingAddress` | 缺少钱包地址，请联系客服。 | Wallet address is missing. Contact support. |
| `send.scanWalletQr` | 请使用加密钱包扫描二维码，并在转账前确认网络一致。 | Scan the QR code with your crypto wallet and confirm the network matches before sending. |
| `send.mobileMoneyNameLabel` | 姓名 | Name |
| `send.mobileMoneyPhoneLabel` | 手机号码 | Phone number |
| `send.payMobileMoney` | 请通过移动支付向上方显示的姓名和号码付款。 | Send the payment via mobile money to the name and number shown above. |
| `send.viewQrPdf` | 查看二维码 PDF | View QR Code PDF |
| `send.qrCodeAlt` | 二维码 | QR Code |
| `send.uploadError` | 上传错误 | Upload Error |
| `send.uploadFailed` | 上传失败 | Upload Failed |
| `send.uploadReceipt` | 上传付款凭证 | Upload Payment Receipt |
| `send.clickTryAgain` | 点击重试 | Click to try again |
| `send.fileTypesHint` | JPG、PNG 或 PDF（最大 5MB） | JPG, PNG or PDF (Max 5MB) |
| `send.uploading` | 正在上传… | Uploading... |
| `send.sending` | 正在提交… | Sending... |
| `send.ivePaid` | 我已付款 | I've Paid |
| `send.transactionSummary` | 交易摘要 | Transaction Summary |
| `send.youSendLabel` | 您汇出 | You Send |
| `send.totalToPay` | 应付总额 | Total to Pay |
| `send.recipientGetsLabel` | 收款人收到 | Recipient Gets |
| `send.arrivesIn` | 预计到账时间 | Arrives within |
| `send.arrivalDurationHours_one` | {{count}} 小时 | {{count}} hour |
| `send.arrivalDurationHours_other` | {{count}} 小时 | {{count}} hours |
| `send.arrivalDurationMinutes_one` | {{count}} 分钟 | {{count}} minute |
| `send.arrivalDurationMinutes_other` | {{count}} 分钟 | {{count}} minutes |
| `send.arrivalDurationHoursMinutes` | {{hours}} 小时 {{minutes}} 分钟 | {{hours}} h {{minutes}} min |
| `send.exchangeRateLabel` | 汇率 | Exchange Rate |
| `send.recipientLabel` | 收款人 | Recipient |
| `send.transactionId` | 交易编号 | Transaction ID |
| `send.failedAddRecipient` | 添加收款人失败，请重试。 | Failed to add recipient. Please try again. |
| `send.fileTooLarge` | 文件大小不得超过 5MB | File size must be less than 5MB |
| `send.fileTypeInvalid` | 仅支持 JPG、PNG 和 PDF 文件 | Only JPG, PNG, and PDF files are allowed |
| `send.failedCreateTxn` | 创建交易失败，请重试。 | Failed to create transaction. Please try again. |
| `send.emailVerificationTitle` | 需要验证邮箱 | Email Verification Required |
| `send.emailVerificationBody` | 请先验证您的邮箱地址，然后才能汇款。我们已向 {{email}} 发送了验证链接。 | Please verify your email address before you can send money. We've sent a verification link to {{email}}. |
| `send.emailVerificationCheck` | 请查收邮件并点击验证链接以继续。 | Check your email and click the verification link to continue. |
| `send.cancel` | 取消 | Cancel |
| `send.resendEmail` | 重新发送邮件 | Resend Email |
| `send.resending` | 正在发送… | Sending... |
| `send.resendVerificationSuccess` | 验证邮件已发送，请查收您的收件箱。 | Verification email sent! Please check your inbox. |
| `send.resendVerificationFailed` | 发送验证邮件失败，请重试。 | Failed to send verification email. Please try again. |
| `send.optionalSuffix` | （选填） |  (Optional) |
| `send.fulfillmentErrorOutsideBank` | 该到账金额超出此汇款通道银行转账允许的范围。请调整金额，或在管理后台添加现金区间/联系客服。 | This receive amount is outside the range allowed for bank transfer on this corridor. Adjust the amount or add a cash window in admin / contact support. |
| `send.fulfillmentErrorOverlap` | 该到账金额同时符合银行和现金规则。通道设置应使用互不重叠的区间，请联系客服。 | This receive amount matches both bank and cash rules. Corridor settings should use disjoint ranges — contact support. |
| `send.fulfillmentErrorGap` | 该到账金额不适用于此汇款通道，请调整金额。 | This receive amount is not eligible for this corridor. Adjust the amount. |
| `send.cashHandBanner` | 该金额将以现金形式送达您选择的地址（不通过银行转账）。 | For this amount, funds will be delivered as cash to the address you select (not by bank transfer). |
| `send.logisticsFeeLabel` | 物流费 | Logistics fee |
| `send.logisticsFeeHintPercent` | 收款人所得金额的 {{pct}}%（计入您的汇款总额） | {{pct}}% of what the recipient receives (added to your send total) |
| `send.cashStep2Title` | 现金配送 | Cash delivery |
| `send.searchDeliveryAddresses` | 按地址或电话搜索 | Search by address or phone |
| `send.noDeliverySearch` | 没有与“{{term}}”匹配的已保存地址 | No saved addresses match "{{term}}" |
| `send.noDeliveryAddressesYet` | 尚未保存配送地址 | No delivery addresses saved yet |
| `send.addDeliveryHint` | 请先在上方添加地址后继续 | Add an address above to continue |
| `send.deliveryAddressSection` | 配送地址 | Delivery address |
| `send.addDeliveryAddress` | 添加配送地址 | Add delivery address |
| `send.addDeliveryAddressTitle` | 添加配送地址 | Add delivery address |
| `send.deliveryAddressLine` | 地址 | Address |
| `send.deliveryAddressLinePlaceholder` | 街道、区域、地标… | Street, area, landmark… |
| `send.deliveryPhone` | 电话 | Phone |
| `send.deliveryPhonePlaceholder` | 配送联系电话 | Phone number for delivery contact |
| `send.saveDeliveryAddress` | 保存地址 | Save address |
| `send.failedAddDelivery` | 无法保存配送地址，请重试。 | Could not save delivery address. Try again. |
| `send.cashDeliverySummary` | 现金配送 | Cash delivery |
| `recipients.title` | 收款人 | Recipients |
| `recipients.transferType` | 转账类型 * | Transfer Type * |
| `recipients.addRecipient` | 添加收款人 | Add Recipient |
| `recipients.addNewTitle` | 添加新收款人 | Add New Recipient |
| `recipients.editRecipientTitle` | 编辑收款人 | Edit Recipient |
| `recipients.confirmDeleteTitle` | 删除收款人？ | Delete recipient? |
| `recipients.confirmDeleteBody` | 此操作无法撤销。 | This can't be undone. |
| `recipients.deleteAction` | 删除 | Delete |
| `recipients.searchPlaceholder` | 搜索收款人… | Search recipients... |
| `recipients.saving` | 正在保存… | Saving... |
| `recipients.updateRecipient` | 更新收款人 | Update Recipient |
| `recipients.failedAdd` | 添加收款人失败 | Failed to add recipient |
| `recipients.failedUpdate` | 更新收款人失败 | Failed to update recipient |
| `recipients.failedDeleteLinked` | 删除失败，该收款人已关联交易 | Failed to delete — linked to a transaction |
| `recipients.noMatchSearch` | 没有符合搜索条件的收款人 | No recipients match your search |
| `recipients.noneFound` | 未找到收款人 | No recipients found |
| `recipients.emptyAddHint` | 添加第一位收款人即可开始 | Add your first recipient to get started |
| `recipients.checking` | 活期 | Checking |
| `recipients.savings` | 储蓄 | Savings |
| `recipients.currency` | 币种 | Currency |
| `recipients.accountName` | 账户名称 * | Account Name * |
| `recipients.enterAccountName` | 请输入账户名称 | Enter account name |
| `recipients.selectCurrencyFirst` | 请先选择币种，以查看所需填写的字段 | Please select a currency first to see the required fields |
| `recipients.optionalSuffix` | （选填） |  (Optional) |
| `recipients.fieldLabels.routing_number` | 路由号码 | Routing Number |
| `recipients.fieldLabels.account_number` | 账号 | Account Number |
| `recipients.fieldLabels.account_name` | 账户名称 | Account Name |
| `recipients.fieldLabels.bank_name` | 银行名称 | Bank Name |
| `recipients.fieldLabels.address_line1` | 地址第 1 行 | Address Line 1 |
| `recipients.fieldLabels.address_line2` | 地址第 2 行 | Address Line 2 |
| `recipients.fieldLabels.city` | 城市 | City |
| `recipients.fieldLabels.state` | 州/省 | State |
| `recipients.fieldLabels.postal_code` | 邮政编码 | ZIP Code |
| `recipients.fieldLabels.checking_or_savings` | 账户类型 | Account Type |
| `recipients.fieldLabels.sort_code` | 分行代码（Sort Code） | Sort Code |
| `recipients.fieldLabels.iban` | IBAN | IBAN |
| `recipients.fieldLabels.swift_bic` | SWIFT/BIC | SWIFT/BIC |
| `recipients.fieldPlaceholders.routing_number` | 例如：123456789 | e.g., 123456789 |
| `recipients.fieldPlaceholders.account_number` | 例如：1234567890 | e.g., 1234567890 |
| `recipients.fieldPlaceholders.account_name` | 例如：Company Name LLC | e.g., Company Name LLC |
| `recipients.fieldPlaceholders.bank_name` | 例如：Bank of America | e.g., Bank of America |
| `recipients.fieldPlaceholders.address_line1` | 例如：123 Main Street | e.g., 123 Main Street |
| `recipients.fieldPlaceholders.address_line2` | 例如：Apt 4B（选填） | e.g., Apt 4B (optional) |
| `recipients.fieldPlaceholders.city` | 例如：New York | e.g., New York |
| `recipients.fieldPlaceholders.state` | 例如：NY | e.g., NY |
| `recipients.fieldPlaceholders.postal_code` | 例如：10001 | e.g., 10001 |
| `recipients.fieldPlaceholders.checking_or_savings` | 选择账户类型 | Select account type |
| `recipients.fieldPlaceholders.sort_code` | 例如：123456 | e.g., 123456 |
| `recipients.fieldPlaceholders.iban` | 例如：GB82 WEST 1234 5698 7654 32 | e.g., GB82 WEST 1234 5698 7654 32 |
| `recipients.fieldPlaceholders.swift_bic` | 例如：NWBKGB2L | e.g., NWBKGB2L |
| `referrals.pageTitle` | 合作伙伴与推荐 | Affiliates & Referrals |
| `referrals.subtitle` | 分享您的链接，好友汇款后即可查看您的奖励。 | Share your link and track rewards when friends send money. |
| `referrals.referFriend` | 推荐好友 | Refer a friend |
| `referrals.referralLink` | 推荐链接 | Referral link |
| `referrals.copyLink` | 复制链接 | Copy link |
| `referrals.copied` | 已复制 | Copied |
| `referrals.commissionRules` | 佣金比例规则 | Commission rate rules |
| `referrals.commissionRulesHint` | 推荐的好友越多、完成的交易越多，您的佣金比例就越高。 | The more friends you refer and they complete transactions, the higher your commission rate! |
| `referrals.commissionRulesExample` | 示例：一笔已完成的 100 美元交易，按 0.5% 计算，您可获得 0.50 美元。 | Example: a completed $100 transaction at 0.5% earns you $0.50. |
| `referrals.tierLine_one` | 本季度有 <bold>{{count}}</bold> 位合格被推荐人 | <bold>{{count}}</bold> qualified referee this quarter |
| `referrals.tierLine_few` | 本季度有 <bold>{{count}}</bold> 位合格被推荐人 | <bold>{{count}}</bold> qualified referees this quarter |
| `referrals.tierLine_many` | 本季度有 <bold>{{count}}</bold> 位合格被推荐人 | <bold>{{count}}</bold> qualified referees this quarter |
| `referrals.tierLine_other` | 本季度有 <bold>{{count}}</bold> 位合格被推荐人 | <bold>{{count}}</bold> qualified referees this quarter |
| `referrals.availableWithdraw` | 可提现金额 | Available to withdraw |
| `referrals.lifetimeEarned` | 累计所得（含已提现）：{{amount}} | Lifetime earned (incl. paid out): {{amount}} |
| `referrals.myReferrals` | 我的推荐 | My referrals |
| `referrals.noReferrals` | 您还没有推荐的用户 | You have no referrals yet |
| `referrals.completedTxCount_one` | {{count}} 笔已完成交易 | {{count}} completed transaction |
| `referrals.completedTxCount_few` | {{count}} 笔已完成交易 | {{count}} completed transactions |
| `referrals.completedTxCount_many` | {{count}} 笔已完成交易 | {{count}} completed transactions |
| `referrals.completedTxCount_other` | {{count}} 笔已完成交易 | {{count}} completed transactions |
| `referrals.rewardWindowEnds` | 奖励期截止 {{date}} | Reward window ends {{date}} |
| `referrals.shareLink` | 分享 | Share |
| `referrals.withdraw` | 提现 | Withdraw |
| `referrals.requestPayout` | 申请提现 | Request payout |
| `referrals.payoutInstructions` | 请选择已保存的收款人并填写金额，我们的团队将处理转账。可提现：{{available}} | Choose a saved recipient and amount. Our team will process the transfer. Available: {{available}} |
| `referrals.recipient` | 收款人 | Recipient |
| `referrals.selectRecipient` | 选择收款人 | Select recipient |
| `referrals.amount` | 金额（{{symbol}}） | Amount ({{symbol}}) |
| `referrals.cancel` | 取消 | Cancel |
| `referrals.submitRequest` | 提交申请 | Submit request |
| `referrals.errRecipientAmount` | 请选择收款人并输入金额。 | Choose a recipient and enter an amount. |
| `referrals.errAmountPositive` | 请输入大于零的金额。 | Enter an amount greater than zero. |
| `referrals.errAmountExceeds` | 该金额超过您的可用余额（{{balance}}），请输入较小的金额。 | That amount is more than your available balance ({{balance}}). Enter a lower amount. |
| `referrals.failedLoad` | 加载失败 | Failed to load |
| `referrals.withdrawFailed` | 提现失败 | Withdraw failed |
| `referrals.requestFailed` | 申请失败 | Request failed |
| `referrals.programPaused` | 推荐计划已暂停，请稍后再来。 | The referral program is paused. Check back later. |
| `referrals.programPercent` | 自每位被推荐用户在 Ciuna 的首笔交易起 {{months}} 个月内，您可获得其每笔已完成交易 {{pct}}% 的奖励。 | Earn {{pct}}% on each referred user's completed transactions for {{months}} months from their first transaction on Ciuna. |
| `referrals.programTier` | 自每位被推荐用户在 Ciuna 的首笔交易起 {{months}} 个月内，您可按阶梯比例获得其每笔已完成交易的佣金。 | Earn tiered commission on each referred user's completed transactions for {{months}} months from their first transaction on Ciuna. |
| `referrals.programThreshold` | 每位被推荐用户在 Ciuna 的已完成交易累计达到 {{threshold}} 或以上时，您可获得 {{reward}}。 | Earn {{reward}} when each referral sends a combined {{threshold}} or more in completed transactions on Ciuna. |
| `referrals.shareTitle` | 用 Ciuna 汇款 | Send Money with Ciuna |
| `referrals.shareMessagePrefix` | 使用我的链接注册，即可在 Ciuna 免费汇款，覆盖 10 多个非洲国家与俄罗斯之间的汇款： | Use my link to sign up and send money between 10+ African countries and Russia for free on Ciuna: |
| `referrals.unnamedReferee` | 用户 | User |
| `profile.title` | 个人资料 | Your profile |
| `profile.changePhoto` | 更换照片 | Change photo |
| `profile.removePhoto` | 删除照片 | Remove photo |
| `profile.removePhotoConfirm` | 要删除您的头像吗？ | Remove your profile photo? |
| `profile.takePhoto` | 拍照 | Take Photo |
| `profile.chooseFromLibrary` | 从相册选择 | Choose from Library |
| `profile.profileInfo` | 个人信息 | Profile Information |
| `profile.edit` | 编辑 | Edit |
| `profile.discard` | 放弃 | Discard |
| `profile.save` | 保存 | Save |
| `profile.saving` | 正在保存… | Saving... |
| `profile.firstName` | 名 | First Name |
| `profile.lastName` | 姓 | Last Name |
| `profile.email` | 邮箱地址 | Email Address |
| `profile.emailLocked` | 邮箱地址无法修改 | Email cannot be changed |
| `profile.phone` | 手机号码 | Phone Number |
| `profile.baseCurrency` | 基础币种 | Base Currency |
| `profile.selectBaseCurrency` | 选择基础币种 | Select base currency |
| `profile.baseCurrencyHint` | 用于统计您的累计汇款金额 | Used for reporting your total sent amount |
| `profile.notSet` | 未设置 | Not set |
| `profile.deleteNotImplemented` | 暂未开放账户删除功能 | Account deletion is not yet implemented |
| `profile.deleteFailed` | 删除账户失败，请重试。 | Failed to delete account. Please try again. |
| `profile.deleteAccount` | 删除账户 | Delete Account |
| `profile.deleteTitle` | 删除账户 | Delete Account |
| `profile.deleteDescription` | 您确定要删除账户吗？此操作无法撤销。您的所有数据、交易和账户信息将被永久删除。 | Are you sure you want to delete your account? This action cannot be undone. All your data, transactions, and account information will be permanently deleted. |
| `profile.cancel` | 取消 | Cancel |
| `profile.deleting` | 正在删除… | Deleting... |
| `verification.hubTitle` | 身份验证 | Verification |
| `verification.hubSubtitle` | 为满足合规要求，请完成身份和地址验证。 | Complete identity and address verification for compliance. |
| `verification.infoKyc` | 为满足合规要求，请完成 KYC 身份和地址信息。 | Please complete KYC Identity and Address information for compliance. |
| `verification.identityTitle` | 身份验证 | Identity verification |
| `verification.addressTitle` | 地址验证 | Address verification |
| `verification.identityCardDesc` | 您的证件验证信息。 | Your ID verification information. |
| `verification.addressInformation` | 地址信息 | Address information |
| `verification.addressCardDesc` | 您的居住地址和证明文件。 | Your home address and document. |
| `verification.notStarted` | 未开始 | Not started |
| `verification.badgeDone` | 已完成 | Done |
| `verification.badgeInReview` | 审核中 | In review |
| `verification.badgeRejected` | 未通过 | Rejected |
| `verification.badgePending` | 待处理 | Pending |
| `verification.identityPageTitle` | 身份验证 | Identity Verification |
| `verification.addressPageTitle` | 地址信息 | Address Information |
| `verification.labelFullName` | 姓名 | Full Name |
| `verification.labelDateOfBirth` | 出生日期 | Date of Birth |
| `verification.labelCountry` | 国家/地区 | Country |
| `verification.labelIdType` | 证件类型 | ID Type |
| `verification.labelIdDocument` | 证件文件 | ID Document |
| `verification.labelDocument` | 文件 | Document |
| `verification.labelStatus` | 状态 | Status |
| `verification.labelAddress` | 地址 | Address |
| `verification.labelDocumentType` | 文件类型 | Document Type |
| `verification.labelAddressDocument` | 地址证明文件 | Address Document |
| `verification.placeholderFullName` | 请输入与证件一致的姓名 | Enter your full name as it appears on your ID |
| `verification.placeholderSelectCountry` | 选择您的国家/地区 | Select your country |
| `verification.searchCountries` | 搜索国家/地区… | Search countries... |
| `verification.placeholderSelectIdType` | 选择证件类型 | Select ID type |
| `verification.placeholderAddress` | 请输入完整地址 | Enter your full address |
| `verification.placeholderSelectDocType` | 选择文件类型 | Select document type |
| `verification.registration` | 登记证明 | Registration |
| `verification.utilityBill` | 水电费账单 | Utility Bill |
| `verification.bankStatement` | 银行对账单 | Bank Statement |
| `verification.uploadErrorTitle` | 上传错误 | Upload Error |
| `verification.uploadIdTitle` | 上传证件文件 | Upload ID Document |
| `verification.uploadAddressTitle` | 上传地址证明文件 | Upload Address Document |
| `verification.uploadFailed` | 上传失败 | Upload Failed |
| `verification.clickToTryAgain` | 点击重试 | Click to try again |
| `verification.fileHint` | JPG、PNG 或 PDF（最大 10 MB） | JPG, PNG or PDF (max 10 MB) |
| `verification.chooseDocument` | 选择文件（PDF 或图片） | Choose file (PDF or image) |
| `verification.fileTooLarge` | 文件大小不得超过 10MB | File size must be less than 10MB |
| `verification.fileTypeInvalid` | 仅支持 JPG、PNG 和 PDF 文件 | Only JPG, PNG, and PDF files are allowed |
| `verification.fillAllFields` | 请填写所有字段并上传文件 | Please fill in all fields and upload a file |
| `verification.identityLocked` | 您的身份验证正在审核中或已通过，无法再上传新文件。 | Your identity verification is already under review or approved. You cannot upload a new document. |
| `verification.addressLocked` | 您的地址验证正在审核中或已通过，无法再上传新文件。 | Your address verification is already under review or approved. You cannot upload a new document. |
| `verification.failedUploadDocument` | 上传文件失败 | Failed to upload document |
| `verification.identityInReview` | 您的 KYC 身份信息正在审核中，我们会尽快通知您结果，请留意邮件。 | Your KYC identity information is in review. We will provide an update account soonest. Please check your email for updates. |
| `verification.identityPendingNote` | 您的提交正在等待审核，可在下方更新。 | Your submission is pending review. You can update it below. |
| `verification.updateSubmissionHeading` | 更新提交内容 | Update Submission |
| `verification.updating` | 正在更新… | Updating... |
| `verification.updateSubmission` | 更新提交内容 | Update Submission |
| `verification.uploading` | 正在上传… | Uploading... |
| `verification.submit` | 提交 | Submit |
| `verification.addressInReview` | 您的 KYC 地址信息正在审核中，我们会尽快通知您结果，请留意邮件。 | Your KYC address information is in review. We will provide an update account soonest. Please check your email for updates. |
| `verification.hubStatusVerifiedTitle` | 您已可以汇款 | You're ready to send |
| `verification.hubStatusVerifiedBody` | 您的身份已验证。打开“汇款”即可转账。 | Your identity is verified. Open Send to transfer money. |
| `verification.hubStatusPendingTitle` | 验证进行中 | Verification in progress |
| `verification.hubStatusPendingBody` | 我们正在核对您的护照信息。大多数审核在几分钟内完成，本页面会自动更新。 | We're checking your passport details. Most reviews finish in a few minutes — this page updates automatically. |
| `verification.hubStatusNeededTitle` | 确认您的身份 | Confirm your identity |
| `verification.hubStatusNeededBody` | 汇款需通过我们支付合作伙伴进行一次性身份核验（支持俄罗斯护照和外国护照）。 | Sending money requires a one-time identity check with our payment partner (Russian and foreign passports supported). |
| `verification.hubContinueCta` | 验证身份 | Verify identity |
| `verification.optionalSection` | 上传文件 | Upload documents |
| `verification.sbpFormTitle` | 身份验证 | Identity verification |
| `verification.formLead` | 请填写与证件完全一致的姓名和护照信息，信息有误可能导致无法汇款。 | Use the exact name and passport details on your document — errors can block sending. |
| `verification.sbpSuccessTitle` | 您已可以汇款 | You're ready to send |
| `verification.sbpSuccessBody` | 身份已验证。请前往“汇款”进行转账。 | Identity verified. Go to Send to make a transfer. |
| `verification.sbpChecking` | 我们正在审核您提交的信息。大多数核验在几分钟内完成，您可以先离开，稍后再回来。 | We're reviewing your submission. Most checks finish in a few minutes — you can leave and come back. |
| `verification.passportSegmentRu` | 俄罗斯护照 | Russian passport |
| `verification.passportSegmentForeign` | 其他护照 | Other passport |
| `verification.passportCountryShort` | 护照签发国 | Passport country |
| `verification.formSectionName` | 姓名 | Name |
| `verification.formSectionPassport` | 护照 | Passport |
| `verification.formSectionContact` | 联系方式 | Contact |
| `verification.formSectionAddress` | 俄罗斯境内地址 | Address in Russia |
| `verification.formFirstName` | 名 | First name |
| `verification.formLastName` | 姓 | Last name |
| `verification.formPatronymic` | 父称 | Patronymic |
| `verification.formPassportNumber` | 护照号码 | Passport number |
| `verification.formBirthDate` | 出生日期 | Date of birth |
| `verification.formPassportIssueDate` | 签发日期 | Issue date |
| `verification.formDatePlaceholder` | 日.月.年（DD.MM.YYYY） | DD.MM.YYYY |
| `verification.formConsentShort` | 我同意为支付目的进行身份验证。 | I agree to identity verification for payments. |
| `verification.sbpCardTitle` | SBP 身份验证（汇款） | SBP identity (Send) |
| `verification.sbpCardDesc` | 在合作伙伴的安全页面完成验证。Ciuna 不会在应用内收集护照数据。 | Verification on a secure partner page. Ciuna does not collect passport data in the app. |
| `verification.sbpBadgeVerified` | 已验证 | Verified |
| `verification.sbpBadgeRequired` | 汇款需要验证 | Required for Send |
| `verification.sbpBadgeChecking` | 核验中 | Checking |
| `verification.kycBridge.screenTitle` | 验证身份 | Verify identity |
| `verification.kycBridge.subtitle` | 托管验证 | Hosted verification |
| `verification.kycBridge.verifyCta` | 验证身份 | Verify identity |
| `verification.kycBridge.continueCta` | 继续验证 | Continue verification |
| `verification.kycBridge.lead` | 通过我们的验证合作伙伴进行验证。支持俄罗斯护照和外国护照；验证在其安全页面上完成，而非在 Ciuna 内。 | Verify with our verification partner. Russian and foreign passports are supported; the check happens on their secure page, not in Ciuna. |
| `verification.kycBridge.linkExpires` | 验证链接将于 {{time}} 失效（约一小时）。 | Verification link expires at {{time}} (about one hour). |
| `verification.kycBridge.reviewPending` | 验证进行中或正在审核。确认后，我们将为您开通汇款。 | Verification in progress or under review. We will unlock Send when it is confirmed. |
| `verification.kycBridge.successBody` | 您现在可以通过 SBP 汇款。请返回转账页面继续。 | You can send money with SBP. Return to your transfer to continue. |
| `verification.bitbanker.pageTitle` | 验证身份 | Verify identity |
| `verification.bitbanker.intro` | 请打开我们验证合作伙伴的安全页面完成汇款验证。支持俄罗斯护照和外国护照。 | Open our verification partner's secure page to verify for Send. Russian and foreign passports are supported. |
| `verification.bitbanker.verifiedTitle` | 您已通过汇款验证 | You are verified for send |
| `verification.bitbanker.refreshStatus` | 刷新状态 | Refresh status |
| `verification.bitbanker.checkAgain` | 重新检查 | Check again |
| `verification.bitbanker.goToSend` | 前往汇款 | Go to Send |
| `verification.bitbanker.statusLabel` | 状态 | Status |
| `verification.bitbanker.submitting` | 正在提交… | Submitting… |
| `verification.bitbanker.submit` | 提交验证 | Submit verification |
| `verification.bitbanker.consent` | 我同意为 SBP 支付进行身份验证，并同意 Ciuna 将上述信息提供给支付合作伙伴。 | I consent to identity verification for SBP payments and to Ciuna sharing the data above with the payment partner. |
| `verification.bitbanker.passportCountry` | 护照签发国 | Passport issuing country |
| `verification.bitbanker.passportCountryHint` | ISO 代码，例如俄罗斯联邦护照填 RU | ISO code, e.g. RU for Russian Federation passport |
| `verification.bitbanker.firstNameCyrillic` | 名（西里尔字母） | First name (Cyrillic) |
| `verification.bitbanker.lastNameCyrillic` | 姓（西里尔字母） | Last name (Cyrillic) |
| `verification.bitbanker.patronymic` | 父称（西里尔字母） | Patronymic (Cyrillic) |
| `verification.bitbanker.firstNameNative` | 名（与护照一致） | First name (as in passport) |
| `verification.bitbanker.lastNameNative` | 姓（与护照一致） | Last name (as in passport) |
| `verification.bitbanker.email` | 邮箱 | Email |
| `verification.bitbanker.phone` | 手机号码 | Mobile phone |
| `verification.bitbanker.phoneHint` | 格式：+71234567890 | Format +71234567890 |
| `verification.bitbanker.birthDate` | 出生日期 | Date of birth |
| `verification.bitbanker.passportIssueDate` | 护照签发日期 | Passport issue date |
| `verification.bitbanker.dateHint` | 可使用日期选择器或输入 DD.MM.YYYY | Use the date picker or DD.MM.YYYY |
| `verification.bitbanker.passportNumber` | 护照系列和号码 | Passport series and number |
| `verification.bitbanker.passportNumberHint` | 不含空格（例如 4010123456） | No spaces (e.g. 4010123456) |
| `verification.bitbanker.registrationSection` | 俄罗斯境内登记地址 | Registration address in Russia |
| `verification.bitbanker.registrationCountry` | 国家（ISO 3 位字母代码） | Country (ISO 3 letters) |
| `verification.bitbanker.registrationCity` | 城市 | City |
| `verification.bitbanker.registrationStreet` | 街道 | Street |
| `verification.bitbanker.registrationHouse` | 门牌号/楼栋 | House / building |
| `verification.bitbanker.registrationIndex` | 邮政编码（选填） | Postal code (optional) |
| `verification.bitbanker.foreignBranchNote` | 非俄罗斯护照：请按证件填写姓名，并填写您在俄罗斯的登记地址。 | Non-Russian passport: enter names as in the document and your registration address in Russia. |
| `verification.bitbanker.errors.consent_required` | 需要您的同意。 | Consent is required. |
| `verification.bitbanker.errors.email_required` | 请填写邮箱。 | Email is required. |
| `verification.bitbanker.errors.email_invalid` | 请输入有效的邮箱地址。 | Enter a valid email address. |
| `verification.bitbanker.errors.phone_required` | 请填写手机号码。 | Phone number is required. |
| `verification.bitbanker.errors.phone_invalid` | 请使用格式 +71234567890。 | Use format +71234567890. |
| `verification.bitbanker.errors.passport_country_required` | 请填写护照签发国。 | Passport country is required. |
| `verification.bitbanker.errors.passport_country_invalid` | 请使用有效的国家代码（例如 RU）。 | Use a valid country code (e.g. RU). |
| `verification.bitbanker.errors.first_name_required` | 请填写名。 | First name is required. |
| `verification.bitbanker.errors.last_name_required` | 请填写姓。 | Last name is required. |
| `verification.bitbanker.errors.patronymic_required` | 俄罗斯护照必须填写父称。 | Patronymic is required for Russian passports. |
| `verification.bitbanker.errors.first_name_native_required` | 请填写名（与护照一致）。 | First name (as in passport) is required. |
| `verification.bitbanker.errors.last_name_native_required` | 请填写姓（与护照一致）。 | Last name (as in passport) is required. |
| `verification.bitbanker.errors.birth_date_required` | 请填写出生日期。 | Date of birth is required. |
| `verification.bitbanker.errors.birth_date_invalid` | 请使用 DD.MM.YYYY 格式或日期选择器。 | Use DD.MM.YYYY or the date picker. |
| `verification.bitbanker.errors.birth_date_future` | 出生日期不能晚于今天。 | Date of birth cannot be in the future. |
| `verification.bitbanker.errors.passport_issue_date_required` | 请填写护照签发日期。 | Passport issue date is required. |
| `verification.bitbanker.errors.passport_issue_date_invalid` | 请使用 DD.MM.YYYY 格式或日期选择器。 | Use DD.MM.YYYY or the date picker. |
| `verification.bitbanker.errors.passport_issue_date_future` | 签发日期不能晚于今天。 | Issue date cannot be in the future. |
| `verification.bitbanker.errors.passport_issue_before_birth` | 签发日期必须晚于出生日期。 | Issue date must be after date of birth. |
| `verification.bitbanker.errors.passport_number_required` | 请填写护照号码。 | Passport number is required. |
| `verification.bitbanker.errors.passport_number_invalid` | 请输入不含空格的系列和号码（6–20 个字符）。 | Enter series and number without spaces (6–20 characters). |
| `verification.bitbanker.errors.registration_country_required` | 请填写登记国家。 | Registration country is required. |
| `verification.bitbanker.errors.registration_country_invalid` | 请使用 3 位字母国家代码（例如 RUS）。 | Use a 3-letter country code (e.g. RUS). |
| `verification.bitbanker.errors.registration_city_required` | 请填写登记城市。 | Registration city is required. |
| `verification.bitbanker.errors.registration_street_required` | 请填写登记街道。 | Registration street is required. |
| `verification.bitbanker.errors.registration_house_required` | 请填写门牌号/楼栋。 | House / building is required. |
| `verification.bitbanker.errors.cyrillic_required` | 俄罗斯护照的姓名请使用西里尔字母。 | Use Cyrillic letters for Russian passport names. |
| `verification.bitbanker.errors.validation_failed` | 请修正标红的字段。 | Please fix the highlighted fields. |
| `verification.bitbanker.errors.submit_failed` | 无法提交验证，请稍后再试。 | Verification could not be submitted. Try again later. |
| `auth.welcomeBack` | 欢迎回来 | Welcome back |
| `auth.signInGoogle` | 使用 Google 登录 | Sign in with Google |
| `auth.signInApple` | 使用 Apple 登录 | Sign in with Apple |
| `auth.signUpApple` | 使用 Apple 注册 | Sign up with Apple |
| `auth.or` | 或 | Or |
| `auth.email` | 邮箱 | Email |
| `auth.emailPlaceholder` | you@example.com | you@example.com |
| `auth.password` | 密码 | Password |
| `auth.passwordPlaceholder` | 请输入密码 | Enter your password |
| `auth.rememberMe` | 记住我 | Remember me |
| `auth.forgotPassword` | 忘记密码？ | Forgot password? |
| `auth.signingIn` | 正在登录… | Signing In... |
| `auth.signIn` | 登录 | Sign in |
| `auth.noAccount` | 还没有账户？ | Don't have an account? |
| `auth.signUp` | 注册 | Sign up |
| `auth.loginError` | 登录时出现错误 | An error occurred during login |
| `auth.registerError` | 注册时出现错误 | An error occurred during registration |
| `auth.passwordValidationFailed` | 密码验证未通过 | Password validation failed |
| `auth.createAccountTitle` | 创建账户 | Create an Account |
| `auth.termsPrefix` | 创建账户即表示您同意我们的 | By creating an account you agree to our |
| `auth.termsLink` | 服务条款 | Terms |
| `auth.signUpGoogle` | 使用 Google 注册 | Sign up with Google |
| `auth.fullName` | 姓名 | Full name |
| `auth.fullNamePlaceholder` | 张三 | Jane Doe |
| `auth.firstNameRequired` | 名 * | First Name * |
| `auth.lastNameRequired` | 姓 * | Last Name * |
| `auth.firstNamePlaceholder` | 名 | First name |
| `auth.lastNamePlaceholder` | 姓 | Last name |
| `auth.emailRequired` | 邮箱 * | Email * |
| `auth.enterEmail` | 请输入邮箱 | Enter your email |
| `auth.passwordRequired` | 密码 * | Password * |
| `auth.createPasswordPlaceholder` | 设置密码 | Create a password |
| `auth.creatingAccount` | 正在创建账户… | Creating Account... |
| `auth.createAccount` | 创建账户 | Create Account |
| `auth.alreadyHaveAccount` | 已有账户？ | Already have an account? |
| `auth.signInLink` | 登录 | Sign In |
| `auth.registrationDisabled` | 目前暂不开放新用户注册。如已有账户，请直接登录。 | New registrations are currently disabled. Please sign in if you already have an account. |
| `auth.registrationClosedBanner` | 公开注册已关闭。 | Public registration is closed. |
| `auth.accountTemporarilyLocked` | 账户已被暂时锁定，请在 {{minutes}} 分钟后重试。 | Account is temporarily locked. Please try again in {{minutes}} minutes. |
| `auth.registerSuccessTitle` | 账户创建成功 | Account Created Successfully! |
| `auth.registerSuccessBody` | 欢迎使用 Ciuna。请查收邮件并验证您的账户。 | Welcome to Ciuna! Please check your email to verify your account. |
| `auth.registerSuccessHint` | 验证完成后，您即可登录并开始汇款。 | After verification, you can sign in to start sending money. |
| `auth.redirectingLogin` | 正在跳转到登录页… | Redirecting to login... |
| `auth.forgotPasswordTitle` | 忘记密码 | Forgot Password |
| `auth.enterCodeTitle` | 输入验证码 | Enter Verification Code |
| `auth.forgotEmailDesc` | 请输入邮箱以获取验证码 | Enter your email for verification code |
| `auth.codeSentTo` | 我们已向 {{email}} 发送了 6 位验证码 | We've sent a 6-digit code to {{email}} |
| `auth.emailAddress` | 邮箱地址 | Email Address |
| `auth.enterEmailAddress` | 请输入您的邮箱地址 | Enter your email address |
| `auth.sendVerificationCode` | 发送验证码 | Send Verification Code |
| `auth.sending` | 正在发送… | Sending... |
| `auth.enterSixDigit` | 请输入 6 位验证码 | Enter 6-digit code |
| `auth.verifying` | 正在验证… | Verifying... |
| `auth.verifyCode` | 验证 | Verify Code |
| `auth.resendIn` | {{seconds}} 秒后可重新发送 | Resend code in {{seconds}}s |
| `auth.resendCode` | 重新发送验证码 | Resend code |
| `auth.changeEmail` | 更换邮箱 | Change Email |
| `auth.backToSignIn` | 返回登录 | Back to Sign In |
| `auth.noAccountForgot` | 还没有账户？ | Don't have an account? |
| `auth.codeSentToast` | 我们已向您的邮箱发送了 6 位验证码。 | We've sent a 6-digit code to your email address. |
| `auth.newCodeSent` | 新的验证码已发送至您的邮箱。 | New code sent to your email address. |
| `auth.enterAllDigits` | 请输入完整的 6 位数字 | Please enter all 6 digits |
| `auth.genericError` | 出现错误，请重试。 | An error occurred. Please try again. |
| `auth.invalidOtp` | 验证码无效，请重试。 | Invalid code. Please try again. |
| `auth.resendFailed` | 重新发送验证码失败，请重试。 | Failed to resend code. Please try again. |
| `auth.apiError` | 出现错误 | An error occurred |
| `auth.resetPasswordTitle` | 重置密码 | Reset Password |
| `auth.resetPasswordDesc` | 请在下方输入新密码 | Enter your new password below |
| `auth.newPassword` | 新密码 | New Password |
| `auth.newPasswordPlaceholder` | 请输入新密码 | Enter new password |
| `auth.confirmPassword` | 确认密码 | Confirm password |
| `auth.confirmPasswordPlaceholder` | 请再次输入新密码 | Confirm new password |
| `auth.passwordMismatch` | 两次输入的密码不一致 | Passwords do not match |
| `auth.updatePassword` | 更新密码 | Update password |
| `auth.resetting` | 正在重置… | Resetting... |
| `auth.resetPasswordFailed` | 重置密码失败 | Failed to reset password |
| `auth.invalidResetLink` | 重置链接无效或已过期，请重新申请重置密码。 | Invalid or expired reset link. Please request a new password reset. |
| `auth.resetSuccessRedirect` | 密码已重置。请使用新密码登录。 | Password reset successful. Please sign in with your new password. |
| `auth.callbackCancelled` | 登录已取消 | Sign in was cancelled |
| `auth.callbackFailedSignIn` | 无法完成登录 | Failed to complete sign in |
| `auth.callbackRedirectLogin` | 正在跳转到登录页… | Redirecting to login... |
| `auth.fillAllFields` | 请填写所有字段 | Please fill in all fields |
| `auth.passwordMinLength` | 密码至少需要 6 个字符 | Password must be at least 6 characters long |
| `auth.helpToast` | 需要帮助？请联系客服：{{email}} | Need assistance? Contact support at {{email}} |
| `referralLanding.redirecting` | 正在跳转… | Redirecting… |
| `referralLanding.invalidLink` | 此推荐链接无效或已过期。 | This referral link is invalid or expired. |
| `pwa.title` | Ciuna 应用 | Ciuna App |
| `pwa.subtitle` | 无需浏览器，随时随地使用我们的应用 | Use our app on the go without browser |
| `pwa.install` | 安装 | Install |
| `pwa.dismiss` | 关闭 | Dismiss |
| `pwa.iosChromeShort` | {{share}} → {{viewMore}} → {{addHome}} | {{share}} → {{viewMore}} → {{addHome}} |
| `pwa.iosChromeLong` | 点按“分享”，然后点按“更多”，再选择“{{addHome}}” | Tap Share, then View more, then {{addHome}} |
| `pwa.iosSafariShort` | {{menu}} → {{share}} → {{viewMore}} → {{addHome}} | {{menu}} → {{share}} → {{viewMore}} → {{addHome}} |
| `pwa.iosSafariLong` | 点按菜单（三个点），然后点按“分享”，再点按“更多”，最后选择“{{addHome}}” | Tap the menu (three dots), then Share, then View more, then {{addHome}} |
| `pwa.share` | 分享 | Share |
| `pwa.viewMore` | 更多 | View more |
| `pwa.addHome` | 添加到主屏幕 | Add to Home Screen |
| `pwa.menu` | 菜单 | Menu |
| `errors.generic` | 出现错误，请重试。 | Something went wrong. Please try again. |
| `errors.loadFailed` | 无法加载数据，请重试。 | Could not load data. Please try again. |
| `marketplace.checkout` | 结算 | Checkout |
| `marketplace.amount` | 金额 | Amount |
| `marketplace.loading` | 正在加载… | Loading… |
| `marketplace.retryError` | 无法完成此步骤，请重试。 | We could not complete that step. Please try again. |
| `marketplace.resume` | 继续订单 | Resume order |
| `marketplace.placeOrder` | 提交订单 | Place order |
| `marketplace.total` | 应付总额 | Total to pay |
| `marketplace.serviceFee` | 服务手续费 | Service fee |
| `marketplace.deliveryFee` | 配送费 | Delivery fee |
| `marketplace.conversionFee` | 兑换手续费 | Conversion fee |
| `marketplace.fulfillment` | 获取方式 | How you get it |
| `marketplace.delivery` | 配送 | Delivery |
| `marketplace.pickup` | 自提 | Pickup |
| `marketplace.digital` | 数字商品 | Digital |
| `marketplace.online_appointment` | 线上预约 | Online appointment |
| `marketplace.in_person_appointment` | 线下预约 | In-person appointment |
| `marketplace.usuallyWithin` | 通常在 {{duration}} 内 | Usually within {{duration}} |
| `marketplace.fulfillmentNotes` | 备注 | Notes |
| `marketplace.pickupLocation` | 自提地点 | Pickup location |
| `marketplace.pickupHours` | 自提时间 | Pickup hours |
| `marketplace.deliveryDetails` | 配送信息 | Delivery details |
| `marketplace.pickupDetails` | 自提信息 | Pickup details |
| `marketplace.contactDetails` | 您的信息 | Your details |
| `marketplace.zone` | 配送区域 | Delivery area |
| `marketplace.choose` | 请选择 | Choose an option |
| `marketplace.chooseZone` | 请选择配送区域 | Choose a delivery area |
| `marketplace.noZones` | 该店铺暂不支持配送。 | Delivery is not available for this store yet. |
| `marketplace.address` | 配送地址 | Delivery address |
| `marketplace.name` | 姓名 | Full name |
| `marketplace.phone` | 电话 | Phone |
| `marketplace.optional` | 选填 | Optional |
| `marketplace.digitalAccessNote` | 付款后，访问和购买详情将显示在您的订单中。 | Access and purchase details will be available on your order after payment. |
| `marketplace.receiptEmail` | 收据和更新将发送至您的账户邮箱。 | Receipts and updates go to your account email. |
| `marketplace.note` | 订单备注 | Order note |
| `marketplace.otherCurrency` | 使用其他币种付款 | Pay in another currency |
| `marketplace.payWith` | 付款币种 | Pay with |
| `marketplace.pay` | 付款 | Pay |
| `marketplace.ivePaid` | 我已付款 | I've paid |
| `marketplace.payOnline` | 在线支付 | Pay online |
| `marketplace.payManual` | 银行转账 | Bank transfer |
| `marketplace.onlinePayHint` | 请在下方使用银行卡或 SBP 完成付款。 | Complete payment by card or SBP below. |
| `marketplace.onlinePayFrame` | 正在准备安全支付… | Preparing secure payment… |
| `marketplace.preparingPay` | 正在准备安全支付… | Preparing secure payment… |
| `marketplace.noManualMethods` | 该币种暂无可用的银行转账方式。 | No bank transfer methods are available for this currency yet. |
| `marketplace.completeDetails` | 请先完成上方信息，再继续。 | Complete the details above to continue. |
| `marketplace.uploadReceipt` | 上传付款凭证 | Upload payment receipt |
| `marketplace.fileTypesHint` | JPG、PNG 或 PDF（最大 10 MB） | JPG, PNG or PDF (max 10 MB) |
| `marketplace.uploadTypeError` | 请使用 JPG、PNG 或 PDF 文件。 | Use a JPG, PNG, or PDF file. |
| `marketplace.uploadSizeError` | 文件大小不得超过 10 MB。 | File must be 10 MB or smaller. |
| `marketplace.copy` | 复制 | Copy |
| `marketplace.online` | 在线支付 | Pay online |
| `marketplace.unavailable` | 请选择必填选项。该商品或服务暂时可能无法结算。 | Choose the required options. Checkout may not yet be available for this offering. |
| `marketplace.emptyCart` | 您的购物车是空的。已有订单请在“交易”中查看。 | Your cart is empty. Existing orders are in Transactions. |
| `marketplace.noSlots` | 暂无可预约时间 | No upcoming appointments |
| `marketplace.payment` | 付款 | Payment |
| `marketplace.awaiting_payment` | 待付款 | Awaiting payment |
| `marketplace.processing` | 正在核实付款 | Checking payment |
| `marketplace.paid` | 已付款 | Paid |
| `marketplace.expired` | 已超过付款期限 | Payment deadline passed |
| `marketplace.refund_pending` | 退款待处理 | Refund pending |
| `marketplace.refunded` | 已退款 | Refunded |
| `marketplace.awaiting_acceptance` | 待接单 | Awaiting acceptance |
| `marketplace.accepted` | 已接单 | Accepted |
| `marketplace.in_progress` | 进行中 | In progress |
| `marketplace.fulfilled` | 已履约 | Fulfilled |
| `marketplace.cancelled` | 已取消 | Cancelled |
| `marketplace.review` | Office 正在审核此订单。如需帮助，请联系客服。 | Office is reviewing this order. Contact support if you need help. |
| `marketplace.deadline` | 付款截止 | Pay by |
| `marketplace.instructions` | 付款说明 | Payment instructions |
| `marketplace.reference` | 付款参考号 | Payment reference |
| `marketplace.proof` | 上传付款凭证 | Upload payment proof |
| `marketplace.proof_submitted` | 凭证已提交，等待审核 | Proof submitted for review |
| `marketplace.digitalDelivery` | 您购买的数字商品 | Your digital purchase |
| `marketplace.updated` | 订单已更新 | Order updated |
| `marketplace.cancel` | 取消订单 | Cancel order |
| `marketplace.support` | 联系客服 | Contact support |
| `marketplace.errors.PRICE_CHANGED` | 价格或选项已变更。请查看更新后的合计并重新确认。 | Prices or options changed. Review the refreshed total and confirm again. |
| `marketplace.errors.QUOTE_EXPIRED` | 您的报价已过期。请查看更新后的合计。 | Your quote expired. Review the refreshed total. |
| `marketplace.errors.OUT_OF_STOCK` | 所需数量暂无库存。请更新购物车。 | The requested quantity is unavailable. Update your cart. |
| `marketplace.errors.SLOT_UNAVAILABLE` | 该预约时间已不可用，请选择其他时间。 | This appointment is no longer available. Choose another time. |
| `marketplace.errors.PAYMENT_UNRESOLVED` | 我们正在核实您的付款，请勿重复付款。 | We are checking your payment. Please do not pay again. |
| `marketplace.errors.DELIVERY_UNAVAILABLE` | 所选区域暂不支持配送。 | Delivery is unavailable for the selected area. |
| `marketplace.errors.NATIVE_BUILD_REQUIRED` | 在线支付需要使用已安装的开发版或正式商店版应用。 | Online payment requires the installed development or store build. |
| `marketplace.errors.CONTACT_NAME_REQUIRED` | 请输入您的姓名。 | Enter your full name. |
| `marketplace.errors.CONTACT_PHONE_REQUIRED` | 请输入用于履约的电话号码。 | Enter a phone number for fulfillment. |
| `marketplace.errors.AMOUNT_REQUIRED` | 请输入在商品限额范围内的金额。 | Enter an amount within the product’s limits. |
| `marketplace.errors.CONTACT_SUPPORT` | 如需修改已接单的订单，请联系客服。 | Contact support to change an accepted order. |
| `marketplace.errors.CHECKOUT_UNAVAILABLE` | 暂时无法结算。 | Checkout is not available yet. |
| `marketplace.events.created` | 待付款 | Awaiting payment |
| `marketplace.events.paid` | 已付款 | Paid |
| `marketplace.events.unknown` | 正在核实付款 | Checking payment |
| `marketplace.events.failed` | 无法完成此步骤，请重试。 | We could not complete that step. Please try again. |
| `marketplace.events.pending` | 待付款 | Awaiting payment |
| `marketplace.events.proof` | 凭证已提交，等待审核 | Proof submitted for review |
| `marketplace.events.expire` | 已超过付款期限 | Payment deadline passed |
| `marketplace.events.cancel` | 已取消 | Cancelled |
| `marketplace.events.accept` | 已接单 | Accepted |
| `marketplace.events.start` | 进行中 | In progress |
| `marketplace.events.fulfill` | 已履约 | Fulfilled |
| `marketplace.events.refund` | 已退款 | Refunded |
| `marketplace.events.reacquire` | 订单已更新 | Order updated |
| `marketplace.events.payment_method` | 订单已更新 | Order updated |
| `marketplace.resumeNative` | 请在 Ciuna 应用中继续付款 | Continue payment in the Ciuna app |
| `marketplace.newPurchase` | 再次购买 | Make another purchase |
| `marketplace.backToShopping` | 返回购物 | Back to shopping |
| `marketplace.orderCancelled` | 订单已取消 | Order cancelled |
| `social.loadFailed` | 加载失败，请重试 | Couldn't load, try again |
| `social.retry` | 重试 | Try again |
| `search.all` | 全部 | All |
| `search.back` | 返回 | Back |
| `search.clear` | 清除 | Clear |
| `search.clearRecent` | 清除 | Clear |
| `search.empty` | 搜索商品、店铺和专家。 | Search for products, stores and experts. |
| `search.experts` | 专家 | Experts |
| `search.minHint` | 请至少输入 2 个字符。 | Type at least 2 characters. |
| `search.noResultsBody` | 请检查拼写，或尝试更短的关键词。 | Check the spelling or try a shorter word. |
| `search.noResultsTitle` | 没有找到“{{q}}”的结果 | No results for “{{q}}” |
| `search.openAria` | 搜索 | Search |
| `search.placeholder` | 搜索商品、店铺、专家 | Search products, stores, experts |
| `search.placeholderExperts` | 搜索专家 | Search experts |
| `search.placeholderFood` | 搜索美食 | Search Food |
| `search.placeholderMart` | 搜索商城 | Search Mart |
| `search.products` | 商品 | Products |
| `search.rateLimited` | 搜索过于频繁，请一分钟后再试。 | Too many searches. Try again in a minute. |
| `search.recent` | 最近搜索 | Recent searches |
| `search.searchAll` | 搜索全部 | Search everywhere |
| `search.stores` | 店铺 | Stores |
| `favourites.title` | 收藏 | Favourites |
| `favourites.stores` | 店铺 | Stores |
| `favourites.products` | 商品 | Products |
| `favourites.experts` | 专家 | Experts |
| `favourites.addAria` | 添加到收藏 | Add to favourites |
| `favourites.removeAria` | 从收藏中移除 | Remove from favourites |
| `favourites.removed` | 已从收藏中移除 | Removed from favourites |
| `favourites.undo` | 撤销 | Undo |
| `favourites.saveFailed` | 无法更新收藏，请重试。 | Couldn't update favourites. Try again. |
| `favourites.emptyStores` | 还没有收藏的店铺。点击店铺上的爱心即可保存到这里。 | No favourite stores yet. Tap the heart on a store to save it here. |
| `favourites.emptyProducts` | 还没有收藏的商品。点击商品上的爱心即可保存到这里。 | No favourite products yet. Tap the heart on a product to save it here. |
| `favourites.emptyExperts` | 还没有收藏的专家。点击专家上的爱心即可保存到这里。 | No favourite experts yet. Tap the heart on an expert to save them here. |
| `favourites.browseFood` | 浏览美食 | Browse Food |
| `favourites.browseMart` | 浏览商城 | Browse Mart |
| `favourites.browseExperts` | 浏览专家 | Browse experts |
| `favourites.signedOutTitle` | 登录后查看收藏 | Sign in to see your favourites |
| `favourites.signedOutBody` | 收藏会随账户同步到所有设备。 | Your favourites follow your account across devices. |
| `favourites.signIn` | 登录 | Sign in |
| `chat.title` | 与卖家聊天 | Chat with seller |
| `chat.messageSeller` | 联系卖家 | Message seller |
| `chat.messageSellerHint` | 咨询您的订单 | Ask about your order |
| `chat.unreadAria` | 新消息 | New messages |
| `chat.loading` | 正在加载消息 | Loading messages |
| `chat.empty` | 向卖家咨询您的订单。 | Ask the seller a question about your order. |
| `chat.notAvailableTitle` | 订单支付后即可开始聊天 | Chat opens once your order is paid |
| `chat.notAvailableBody` | 支付确认后，您就可以联系卖家。 | You can message the seller as soon as your payment is confirmed. |
| `chat.closed` | 此聊天已关闭，您仍可查看聊天记录。 | This chat is closed. You can still read the conversation. |
| `chat.rateLimited` | 发送过于频繁，请稍候，您的消息已保留。 | You are sending messages too fast. Wait a moment, your message is kept. |
| `chat.notSent` | 未发送 | Not sent |
| `chat.retry` | 重试 | Retry |
| `chat.send` | 发送 | Send |
| `chat.placeholder` | 输入消息 | Write a message |
| `chat.counter` | {{n}} / {{max}} | {{n}} / {{max}} |
| `chat.cardHint` | 请勿在此分享银行卡号或支付信息。 | Please don't share card numbers or payment details here. |
| `chat.orderStrip` | 订单 {{id}} | Order {{id}} |
| `chat.today` | 今天 | Today |
| `chat.yesterday` | 昨天 | Yesterday |
| `chat.seen` | 已读 {{time}} | Seen {{time}} |
| `chat.unavailable` | 消息功能暂不可用 | Messaging isn't available right now |
| `chat.unavailableBody` | 请稍后再试。 | Please try again later. |
| `chat.closedOn` | 聊天已于 {{date}} 关闭，您仍可查看聊天记录。 | Chat closed on {{date}}. You can still read the conversation. |
| `reviews.promptTitle` | 为您的订单评分 | Rate your order |
| `reviews.promptTitleSession` | 为本次服务评分 | Rate your session |
| `reviews.promptHint` | 体验如何？您的评分可以帮助其他顾客。 | How was it? Your rating helps other customers. |
| `reviews.rate` | 评分 | Rate |
| `reviews.edit` | 编辑 | Edit |
| `reviews.view` | 查看 | View |
| `reviews.yourReview` | 您的评价 | Your review |
| `reviews.sheetTitle` | 为您的订单评分 | Rate your order |
| `reviews.sheetTitleSession` | 为本次服务评分 | Rate your session |
| `reviews.editTitle` | 编辑您的评价 | Edit your review |
| `reviews.lockedTitle` | 您的评价 | Your review |
| `reviews.star1` | 很差 | Poor |
| `reviews.star2` | 一般 | Fair |
| `reviews.star3` | 不错 | Good |
| `reviews.star4` | 很好 | Very good |
| `reviews.star5` | 非常棒 | Excellent |
| `reviews.starsAria` | {{n}} 星（共 5 星） | {{n}} of 5 stars |
| `reviews.bodyPlaceholder` | 告诉其他人您的看法（可选） | Tell others what you thought (optional) |
| `reviews.notice` | 仅显示您的名字：{{name}} | Shown with your first name only: {{name}} |
| `reviews.noticeNoName` | 仅显示您的名字。 | Shown with your first name only. |
| `reviews.editUntil` | 您可以在 {{date}} 前编辑此评价。 | You can edit this review until {{date}}. |
| `reviews.lockedNote` | 评价可在 48 小时内编辑，此评价现已锁定。 | Reviews can be edited for 48 hours. This one is now locked. |
| `reviews.submit` | 提交评价 | Submit review |
| `reviews.save` | 保存修改 | Save changes |
| `reviews.cancel` | 取消 | Cancel |
| `reviews.close` | 关闭 | Close |
| `reviews.thanks` | 谢谢，您的评价已发布 | Thanks, your review is posted |
| `reviews.updated` | 您的评价已更新 | Your review is updated |
| `reviews.postFailed` | 无法发布您的评价，请重试。 | Couldn't post your review. Try again. |
| `reviews.rateLimited` | 尝试次数过多，请一分钟后再试。 | Too many attempts. Try again in a minute. |
| `reviews.windowClosed` | 此订单的评价期限已结束。 | The review period for this order has ended. |
| `reviews.sectionTitle` | 评价 | Reviews |
| `reviews.none` | 暂无评价。 | No reviews yet. |
| `reviews.showMore` | 显示更多评价 | Show more reviews |
| `reviews.sellerReply` | 卖家回复 | Reply from the seller |
| `reviews.anonymous` | 顾客 | Customer |
| `reviews.count_one` | {{count}} 条评价 | {{count}} review |
| `reviews.count_other` | {{count}} 条评价 | {{count}} reviews |

### `packages/shared/src/locales/zh/common.json` (76 strings)

| Key | Text | English source |
| --- | --- | --- |
| `nav.home` | 首页 | Home |
| `nav.sendMoney` | 汇款 | Send Money |
| `nav.send` | 汇款 | Send |
| `nav.hub` | 首页 | Home |
| `nav.recipients` | 收款人 | Recipients |
| `nav.transactions` | 动态 | Activities |
| `nav.more` | 更多 | More |
| `nav.logout` | 退出登录 | Logout |
| `nav.login` | 登录 | Log in |
| `more.title` | 更多 | More |
| `more.open` | 打开 | Open |
| `more.account` | 账户 | Account |
| `more.yourProfile` | 个人资料 | Your Profile |
| `more.accountVerification` | 账户身份验证 | Account Verification |
| `more.affiliatesReferrals` | 合作伙伴与推荐 | Affiliates & Referrals |
| `more.loginPin` | 登录 PIN 码 | Login PIN |
| `more.app` | 应用 | App |
| `more.recipients` | 收款人 | Recipients |
| `more.support` | 客服 | Support |
| `more.privacyPolicy` | 隐私政策 | Privacy Policy |
| `more.termsOfService` | 服务条款 | Terms of Service |
| `more.version` | 版本 {{version}} | Version {{version}} |
| `more.logout` | 退出登录 | Logout |
| `more.signOutTitle` | 退出登录 | Sign Out |
| `more.signOutDescription` | 您确定要退出登录吗？退出后需要重新登录才能访问您的账户。 | Are you sure you want to sign out? You'll need to sign in again to access your account. |
| `more.cancel` | 取消 | Cancel |
| `more.signOut` | 退出登录 | Sign Out |
| `more.signingOut` | 正在退出… | Signing out... |
| `kyc.verified` | 已验证 | Verified |
| `kyc.inReview` | 审核中 | In review |
| `kyc.rejected` | 未通过 | Rejected |
| `kyc.pending` | 待处理 | Pending |
| `kyc.takeAction` | 去处理 | Take action |
| `languages.en` | 英语 | English |
| `languages.ru` | 俄语 | Russian |
| `languages.fr` | 法语 | French |
| `languages.es` | 西班牙语 | Spanish |
| `languages.zh` | 中文 | Chinese |
| `languages.pt` | 葡萄牙语 | Portuguese |
| `app.language` | 语言 | Language |
| `pinSetup.createTitle` | 创建应用 PIN 码 | Create your app PIN |
| `pinSetup.createSubtitle` | 请输入 4 位 PIN 码 | Enter your 4-digit PIN |
| `pinSetup.confirmTitle` | 确认 PIN 码 | Confirm your PIN |
| `pinSetup.confirmSubtitle` | 请再次输入相同的 PIN 码 | Enter the same PIN again |
| `pinSetup.benefitLine` | 下次回到应用时可用它快速进入。如果您完全退出登录，仍需使用密码。 | Use it for quick access when you return. You’ll still use your password if you sign out fully. |
| `pinSetup.mismatch` | 两次输入的 PIN 码不一致，请重试。 | PINs don’t match. Try again. |
| `pinSetup.saving` | 正在保存… | Saving… |
| `pinDialog.createTitle` | 创建 PIN 码 | Create PIN |
| `pinDialog.changeTitle` | 修改 PIN 码 | Change PIN |
| `pinDialog.createDescription` | 请设置一个 4 位 PIN 码，以便再次打开应用时快速进入。闲置锁定后，请输入 PIN 码而非密码。如果您退出登录，仍需使用密码登录。 | Choose a 4-digit PIN for quick access when you open the app again. After idle lock, enter your PIN instead of your password. You’ll still sign in with your password if you log out. |
| `pinDialog.changeDescription` | 请输入当前 PIN 码，然后设置新的 4 位 PIN 码。 | Enter your current PIN, then choose a new 4-digit PIN. |
| `pinDialog.currentPin` | 当前 PIN 码 | Current PIN |
| `pinDialog.pin` | PIN 码 | PIN |
| `pinDialog.newPin` | 新 PIN 码 | New PIN |
| `pinDialog.confirmPin` | 确认 PIN 码 | Confirm PIN |
| `pinDialog.cancel` | 取消 | Cancel |
| `pinDialog.save` | 保存 | Save |
| `pinDialog.saving` | 正在保存… | Saving… |
| `pinDialog.errorBothFields` | 请在两个输入框中都输入 4 位 PIN 码。 | Enter a 4-digit PIN in both fields. |
| `pinDialog.errorPinsNoMatch` | 两次输入的 PIN 码不一致。 | PINs do not match. |
| `pinDialog.errorSave` | 无法保存 PIN 码。 | Could not save PIN. |
| `pinDialog.errorCurrentRequired` | 请输入当前的 4 位 PIN 码。 | Enter your current 4-digit PIN. |
| `pinDialog.errorNewBothFields` | 请在两个输入框中都输入新的 4 位 PIN 码。 | Enter a new 4-digit PIN in both fields. |
| `pinDialog.errorNewNoMatch` | 两次输入的新 PIN 码不一致。 | New PINs do not match. |
| `pinDialog.errorNewSameAsOld` | 新 PIN 码不能与当前 PIN 码相同。 | New PIN must be different from your current PIN. |
| `pinDialog.errorWrongCurrent` | 当前 PIN 码不正确。 | Current PIN is incorrect. |
| `pinDialog.errorUpdate` | 无法更新 PIN 码。 | Could not update PIN. |
| `pinLock.welcomeBack` | 欢迎回来 | Welcome back |
| `pinLock.enterPin` | 请输入 4 位 PIN 码 | Enter your 4-digit PIN |
| `pinLock.incorrectPin` | PIN 码不正确 | Incorrect PIN |
| `pinLock.verifying` | 正在验证… | Verifying… |
| `pinLock.tooManyAttempts` | 尝试次数过多，请在 {{minutes}} 分钟后重试。 | Too many attempts. Try again in {{minutes}} minute(s). |
| `pinLock.tooManyAttemptsOne` | 尝试次数过多，请在 1 分钟后重试。 | Too many attempts. Try again in 1 minute. |
| `pinLock.notYourAccount` | 不是您的账户？ | Not your account? |
| `pinLock.logOut` | 退出登录 | Log out |
| `pinLock.backspaceAria` | 删除 | Delete |

### `packages/shared/src/locales/pt/app.json` (1126 strings)

| Key | Text | English source |
| --- | --- | --- |
| `layout.back` | Voltar | Back |
| `layout.accessDenied` | Acesso negado | Access Denied |
| `layout.adminCannotAccessUser` | Usuários administradores não podem acessar as páginas de cliente. | Admin users cannot access user pages. |
| `layout.goToAdminDashboard` | Ir para o painel de administração | Go to Admin Dashboard |
| `dashboard.profileAria` | Perfil | Profile |
| `dashboard.referEarn` | Indique e ganhe | Refer & Earn |
| `dashboard.supportAria` | Suporte | Support |
| `dashboard.totalVolume` | Total gasto | Total Spent |
| `dashboard.transactions` | Transações | Transactions |
| `dashboard.send` | Enviar | Send |
| `dashboard.hub` | Hub | Hub |
| `dashboard.recipient` | Destinatário | Recipient |
| `dashboard.recentTransactions` | Transações recentes | Recent Transactions |
| `dashboard.seeAll` | Ver tudo | See All |
| `dashboard.noRecentTransactions` | Nenhuma transação recente | No recent transactions |
| `dashboard.sendFirstTransfer` | Faça sua primeira transferência | Send Your First Transfer |
| `dashboard.referralPayout` | Pagamento de indicação | Referral payout |
| `dashboard.withdrawalTo` | Saque para | Withdrawal to |
| `dashboard.recipientReceives` | O destinatário recebe | Recipient receives |
| `dashboard.recipientFallback` | Destinatário | Recipient |
| `dashboard.to` | Para | To |
| `dashboard.unknownRecipient` | Desconhecido | Unknown |
| `dashboard.sendAmount` | Valor enviado | Send Amount |
| `dashboard.receiveAmount` | Valor recebido | Receive Amount |
| `dashboard.fullAmountAria` | Valor completo: {{label}} | Full amount: {{label}} |
| `dashboard.fullAmountCaption` | Valor completo | Full amount |
| `hub.hub` | Hub | Hub |
| `hub.heroTitle` | Envie, compre e reserve. | Send, Shop & Book. |
| `hub.heroBody` | Tudo o que você precisa: mercado, transferências e serviços em um só lugar na Ciuna. | Everything you need: groceries, transfers, and services in one place on Ciuna. |
| `hub.serviceLineTiles.food.title` | Comida | Food |
| `hub.serviceLineTiles.food.shortDescription` | Peça o que você quiser comer | Have all your cravings |
| `hub.serviceLineTiles.mart.title` | Mercado | Mart |
| `hub.serviceLineTiles.mart.shortDescription` | Alimentos e muito mais | Find foodstuffs and more |
| `hub.serviceLineTiles.assistant.title` | Assistente | Assistant |
| `hub.serviceLineTiles.assistant.shortDescription` | Envie encomendas e documentos | Send packages and docs |
| `hub.serviceLineTiles.send.title` | Transferência | Transfer |
| `hub.serviceLineTiles.send.shortDescription` | Transferência internacional de dinheiro | Cross-border money transfer |
| `hub.serviceLineTiles.experts.title` | Especialistas | Experts |
| `hub.serviceLineTiles.experts.shortDescription` | Contrate especialistas de confiança | Hire trusted experts |
| `hub.serviceLineTiles.insurance.title` | Seguros | Insurance |
| `hub.serviceLineTiles.insurance.shortDescription` | Proteção para o dia a dia | Get everyday protection |
| `hub.serviceLineTiles.experiences.title` | Experiências | Experiences |
| `hub.serviceLineTiles.experiences.shortDescription` | Encontre sua próxima aventura | Find your next adventure |
| `hub.serviceLineTiles.gift-packs.title` | Kits de presente | Gift Packs |
| `hub.serviceLineTiles.gift-packs.shortDescription` | Envie presentes a alguém | Send gifts to someone |
| `hub.referEarn` | Indique e ganhe | Refer & earn |
| `hub.referEarnShort` | Ganhe | Earn |
| `hub.chatSupport` | Suporte | Support |
| `hub.logoAria` | Início do Ciuna Hub | Ciuna Hub home |
| `hub.servicesTitle` | Serviços | Services |
| `hub.serviceUnavailable` | Este serviço está indisponível no momento. | This service is currently unavailable. |
| `hub.unavailableTitle` | Indisponível | Unavailable |
| `hub.redirecting` | Redirecionando… | Redirecting… |
| `hub.openingExternal` | Abrindo link… | Opening link… |
| `hub.catalogSubtitle` | Um marketplace para pedir serviços e produtos de que você precisa, pagando na sua moeda local | A marketplace to order services and products you need by paying with your local currency |
| `hub.productsSectionTitle` | Produtos | Products |
| `hub.marketplaceProductsHeading` | Produtos | Products |
| `hub.marketplaceStoresHeading` | Lojas | Stores |
| `hub.storesDirectorySubtitle` | Escolha uma loja para ver os produtos. | Choose a store to see its products. |
| `hub.marketplaceSeeAllStores` | Ver todas | See all |
| `hub.marketplaceNoVendors` | Ainda não há lojas — volte em breve. | No stores yet — check back soon. |
| `hub.verifiedVendor` | Vendedor verificado | Verified vendor |
| `hub.backToLine` | Voltar à categoria | Back to line |
| `hub.vendorStoreNotFound` | Loja não encontrada | Store not found |
| `hub.vendorStoreNotFoundBody` | Esta loja está indisponível ou o link pode estar incorreto. | This store is unavailable or the link may be incorrect. |
| `hub.categoryFilterAria` | Filtrar por categoria | Filter by category |
| `hub.noProductsInCategory` | Nenhum produto nesta categoria. | No products in this category. |
| `hub.showingCategory` | Exibindo categoria: | Showing category: |
| `hub.allCategories` | Todas as categorias | All categories |
| `hub.all` | Todos | All |
| `hub.noProducts` | Ainda não há produtos disponíveis. | No products available yet. |
| `hub.noImage` | Sem imagem | No image |
| `hub.setAmount` | Definir valor | Set amount |
| `hub.buy` | Comprar | Buy |
| `hub.order` | Pedir | Order |
| `hub.productNotFound` | Produto não encontrado. | Product not found. |
| `hub.backToHub` | Voltar ao Hub | Back to Hub |
| `hub.expertsTitle` | Especialistas | Experts |
| `hub.expertsSubtitle` | Profissionais de confiança para tudo o que você precisa em casa e em beleza. | Trusted professionals for all your home and beauty needs. |
| `hub.expertsFeaturedHeading` | Em destaque | Featured |
| `hub.expertsSeeAll` | Ver todos | See all |
| `hub.expertsServicesHeading` | Serviços | Services |
| `hub.expertsFeaturedEmpty` | Ainda não há especialistas — volte em breve. | No experts yet — check back soon. |
| `hub.expertsDirectoryTitle` | Todos os especialistas | All experts |
| `hub.expertsDirectorySubtitle` | Veja todos os especialistas da Ciuna. | Browse every expert on Ciuna. |
| `hub.backToExperts` | Voltar aos especialistas | Back to experts |
| `hub.expertVerified` | Especialista verificado | Verified expert |
| `hub.expertsServicesEmpty` | Ainda não há serviços listados. | No services listed yet. |
| `hub.expertsServicesNoneInCategory` | Nenhum serviço nesta categoria. | No services in this category. |
| `hub.expertsAll` | Todos os especialistas | All experts |
| `hub.expertNotFound` | Especialista não encontrado | Expert not found |
| `hub.noProductImage` | Sem imagem do produto | No product image |
| `hub.userInputPricingHint` | Você escolhe o valor a cobrir ({{currency}}). Será cobrada uma taxa de serviço. | You choose the amount to cover ({{currency}}). A service fee applies. |
| `hub.buyNow` | Comprar agora | Buy now |
| `hub.orderNow` | Pedir agora | Order now |
| `hub.checkout.title` | Finalizar compra | Checkout |
| `hub.checkout.hubCheckoutTitle` | Finalizar compra no Ciuna Hub | Ciuna Hub Checkout |
| `hub.checkout.order` | Pedido | Order |
| `hub.checkout.steps.amount` | Valor | Amount |
| `hub.checkout.steps.details` | Detalhes | Details |
| `hub.checkout.steps.pay` | Pagamento | Pay |
| `hub.checkout.amountCurrency` | Valor e moeda | Amount & currency |
| `hub.checkout.amountToCover` | Digite o valor a pagar | Enter amount to pay |
| `hub.checkout.payWith` | Moeda do pagamento | Currency you'll pay with |
| `hub.checkout.currency` | Moeda | Currency |
| `hub.checkout.youPayReadonly` | Você paga (somente leitura) | You pay (read-only) |
| `hub.checkout.orderSummary` | Resumo do pedido | Order summary |
| `hub.checkout.productLabel` | Produto | Product |
| `hub.checkout.productPrice` | Preço do produto | Product price |
| `hub.checkout.servicePrice` | Preço do serviço | Service price |
| `hub.checkout.subtotal` | Subtotal | Subtotal |
| `hub.checkout.transferFee` | Taxa de câmbio | Exchange fee |
| `hub.checkout.hubFee` | Taxa do Hub | Hub fee |
| `hub.checkout.orderTotal` | Total do pedido | Order Total |
| `hub.checkout.exchangeRate` | Taxa de câmbio | Exchange Rate |
| `hub.checkout.totalToPay` | Total a pagar | Total to Pay |
| `hub.checkout.fulfillmentSummary` | Atendimento | Fulfillment |
| `hub.checkout.fulfilledWithin` | Atendido em até | Fulfilled within |
| `hub.checkout.selectCurrencyAmountHint` | Selecione as moedas e o valor para ver os totais. | Select currencies and amount to see totals. |
| `hub.checkout.continue` | Continuar | Continue |
| `hub.checkout.contactDetails` | Detalhes do atendimento | Fulfillment details |
| `hub.checkout.fullName` | Nome completo | Full name |
| `hub.checkout.phone` | Telefone | Phone |
| `hub.checkout.comment` | Comentário | Comment |
| `hub.checkout.commentPlaceholder` | Adicione observações importantes sobre este pedido. | Add any important notes for this order. |
| `hub.checkout.inPersonAddressHint` | Escolha um endereço salvo para este atendimento presencial. | Choose a saved address for this in-person fulfillment. |
| `hub.checkout.savedAddressOptional` | Endereço salvo (opcional) | Saved address (optional) |
| `hub.checkout.select` | Selecionar | Select |
| `hub.checkout.none` | Nenhum | None |
| `hub.checkout.deliveryNotesAddressOptional` | Endereço de entrega / observações (opcional) | Delivery / notes address (optional) |
| `hub.checkout.addressLine` | Endereço | Address line |
| `hub.checkout.back` | Voltar | Back |
| `hub.checkout.continueToPayment` | Continuar para o pagamento | Continue to payment |
| `hub.checkout.makePayment` | Pagar | Make payment |
| `hub.checkout.youWillPay` | Você vai pagar | You will pay |
| `hub.checkout.for` | por | for |
| `hub.checkout.serverRecalculated` | Os totais são recalculados no servidor quando você confirma. | Totals are recalculated on the server when you confirm. |
| `hub.checkout.paymentMethodFor` | Forma de pagamento ({{currency}}) | Payment method ({{currency}}) |
| `hub.checkout.selectPaymentMethod` | Selecione a forma de pagamento | Select payment method |
| `hub.checkout.noActivePaymentMethod` | Nenhuma forma de pagamento ativa encontrada para {{currency}}. Adicione uma em taxas/configurações do Office antes de finalizar a compra. | No active payment method found for {{currency}}. Add one in Office rates/settings before checkout. |
| `hub.checkout.creating` | Criando… | Creating… |
| `hub.checkout.errors.verifyEmail` | Verifique seu e-mail antes de continuar. | Please verify your email before continuing. |
| `hub.checkout.errors.checkAmount` | Confira o valor e as moedas. | Check amount and currencies. |
| `hub.checkout.errors.namePhoneRequired` | Nome e telefone são obrigatórios. | Name and phone are required. |
| `hub.checkout.errors.deliveryAddressRequired` | Selecione um endereço de entrega. | Select a delivery address. |
| `hub.checkout.errors.fillField` | Preencha: {{field}} | Please fill: {{field}} |
| `hub.checkout.errors.noPaymentMethodForCurrency` | Nenhuma forma de pagamento configurada para {{currency}}. | No payment method is configured for {{currency}}. |
| `hub.checkout.errors.paymentSetupFailed` | Falha na configuração do pagamento | Payment setup failed |
| `hub.checkout.errors.missingTransaction` | Transação não encontrada | Missing transaction |
| `hub.checkout.errors.failed` | Falhou | Failed |
| `hub.checkout.forProduct` | Finalizar compra de {{product}} | Checkout for {{product}} |
| `hub.payFrom` | Pagar a partir de | Pay from |
| `hub.payUpTo` | Pagar até | Pay up to |
| `hub.toRange` | a | to |
| `hub.sellPrice` | Preço de venda | Sell price |
| `assistant.title` | Assistente | Assistant |
| `assistant.intro` | Diga o que você precisa — o Assistente Ciuna coordena retiradas, compras e recados. | Tell us what you need — Ciuna Assistant coordinates pickup, shopping, and errands. |
| `assistant.help` | Ajuda | Help |
| `assistant.section.serviceType` | Tipo de serviço | Service type |
| `assistant.section.details` | Endereços e instruções | Addresses & instructions |
| `assistant.kind.pickupTitle` | Retirar um pedido | Pick up an order |
| `assistant.kind.pickupDesc` | Retiramos algo que você já pediu ou que está aguardando retirada. | We collect something you already ordered or that is waiting for pickup. |
| `assistant.kind.buyTitle` | Comprar algo | Buy something |
| `assistant.kind.buyDesc` | Compramos itens em seu nome em uma loja ou com um vendedor. | We purchase items on your behalf from a store or vendor. |
| `assistant.kind.errandTitle` | Fazer recados | Run errands |
| `assistant.kind.errandDesc` | Documentos, encomendas e tarefas rápidas pela cidade. | Documents, packages, and quick tasks around the city. |
| `assistant.field.whatToBuy` | O que devemos comprar? | What should we buy? |
| `assistant.field.pickupInstructions` | Retirada e instruções | Pickup & instructions |
| `assistant.field.courier` | Preferência de entregador | Courier preference |
| `assistant.field.vehicle` | Veículo | Vehicle |
| `assistant.field.dropoff` | Entrega | Drop-off |
| `assistant.placeholder.pickup` | Onde retirar, códigos, contato no local… | Where to pick up, codes, contact on site… |
| `assistant.placeholder.buy` | Nome da loja, lista de produtos, tamanhos, alternativas… | Store name, product list, sizes, alternatives… |
| `assistant.placeholder.vehicle` | Moto, carro, van — ou deixe em branco para qualquer um | Bike, car, van — or leave blank for any |
| `assistant.placeholder.dropoff` | Endereço completo de entrega e observações de acesso | Full drop-off address and access notes |
| `assistant.cta.pickKind` | Escolha um tipo de serviço | Choose a service type |
| `assistant.cta.pickupDetails` | Adicionar detalhes da retirada | Add pickup details |
| `assistant.cta.buyDetails` | Adicionar detalhes da compra | Add shopping details |
| `assistant.cta.dropoff` | Adicionar endereço de entrega | Add drop-off |
| `assistant.cta.vehicle` | Adicionar preferência de veículo | Add vehicle preference |
| `assistant.cta.submit` | Enviar solicitação | Submit request |
| `assistant.pill.howItWorks` | Como funciona | How it works |
| `assistant.pill.restrictions` | Restrições | Restrictions |
| `assistant.footer.total` | Total | Total |
| `assistant.footer.fromQuote` | Conforme orçamento (após análise) | From quote (after review) |
| `assistant.footer.payment` | Pagamento após o orçamento | Payment after quote |
| `assistant.submitting` | Enviando… | Submitting… |
| `assistant.submitFailed` | Não foi possível enviar. Tente novamente. | Could not submit. Try again. |
| `experts.profile.bookSession` | Reservar uma sessão | Book a session |
| `experts.profile.notBookableOnline` | Reserva online indisponível | Not bookable online |
| `experts.profile.servicesHeading` | Serviços | Services |
| `experts.profile.noServices` | Ainda não há serviços para reservar. | No bookable services yet. |
| `experts.profile.typicalSession` | Sessão típica: {{minutes}} min | Typical session: {{minutes}} min |
| `experts.profile.serviceArea` | Região: {{area}} | Area: {{area}} |
| `experts.profile.fulfillmentOnline` | Online | Online |
| `experts.profile.fulfillmentInPerson` | Presencial | In person |
| `experts.profile.fulfillmentBoth` | Online ou presencial | Online or in person |
| `experts.profile.fulfillmentHero` | Atendimento: {{value}} | Fulfillment: {{value}} |
| `experts.profile.priceFrom` | A partir de | From |
| `experts.booking.title` | Reservar um especialista | Book an expert |
| `experts.booking.intro` | Escolha um especialista publicado e sugira um horário. A Ciuna confirmará os detalhes com você. | Pick a published expert and suggest a time. Ciuna will confirm details with you. |
| `experts.booking.loading` | Carregando especialistas… | Loading experts… |
| `experts.booking.noExperts` | Ainda não há especialistas publicados. Volte em breve. | No published experts yet. Check back soon. |
| `experts.booking.expert` | Especialista | Expert |
| `experts.booking.slotStart` | Início preferido | Preferred start |
| `experts.booking.slotEnd` | Término preferido | Preferred end |
| `experts.booking.message` | Observações | Notes |
| `experts.booking.saving` | Salvando… | Saving… |
| `experts.booking.submit` | Solicitar reserva | Request booking |
| `experts.booking.backCatalog` | Voltar ao catálogo de especialistas | Back to Experts catalog |
| `experts.booking.success` | Solicitação de reserva enviada. | Booking request sent. |
| `experts.booking.failed` | Não foi possível enviar a reserva. Tente novamente. | Could not send booking. Try again. |
| `experts.bookingWizard.pageTitle` | Reservar com {{name}} | Book with {{name}} |
| `experts.bookingWizard.heroBookService` | Reservar serviço de {{title}} | Book {{title}} Service |
| `experts.bookingWizard.providedBy` | Oferecido por | Provided by |
| `experts.bookingWizard.checkoutServiceLabel` | Serviço | Service |
| `experts.bookingWizard.sessionTime` | Horário da sessão | Session time |
| `experts.bookingWizard.stepSession` | Sessão | Session |
| `experts.bookingWizard.stepTime` | Data e hora | Date & time |
| `experts.bookingWizard.stepCheckout` | Pagamento | Checkout |
| `experts.bookingWizard.stepConfirm` | Confirmação | Confirm |
| `experts.bookingWizard.chooseService` | Escolha o tipo de sessão | Choose a session type |
| `experts.bookingWizard.noServices` | Ainda não há serviços para reservar. | No bookable services yet. |
| `experts.bookingWizard.continue` | Continuar | Continue |
| `experts.bookingWizard.back` | Voltar | Back |
| `experts.bookingWizard.chooseTime` | Escolha a data e o horário | Pick a date and time |
| `experts.bookingWizard.pickDay` | Escolha um dia com disponibilidade | Pick a day with availability |
| `experts.bookingWizard.loadingSlots` | Carregando horários… | Loading times… |
| `experts.bookingWizard.selectDayHint` | Selecione um dia no calendário para ver os horários livres. | Select a day on the calendar to see open times. |
| `experts.bookingWizard.noSlotsDay` | Não há horários neste dia. | No times on this day. |
| `experts.bookingWizard.loadingConfirm` | Carregando confirmação… | Loading confirmation… |
| `experts.bookingWizard.confirmTitle` | Revise e confirme | Review and confirm |
| `experts.bookingWizard.yourName` | Seu nome | Your name |
| `experts.bookingWizard.email` | E-mail | Email |
| `experts.bookingWizard.termsPrefix` | Concordo com os | I agree to the |
| `experts.bookingWizard.terms` | Termos | Terms |
| `experts.bookingWizard.and` | e a | and |
| `experts.bookingWizard.privacy` | Política de Privacidade | Privacy Policy |
| `experts.bookingWizard.paymentStubNote` | Nesta versão, o pagamento não é cobrado. Confirmaremos sua reserva por e-mail. | Payment is not charged in this version. We will confirm your booking by email. |
| `experts.bookingWizard.payAmount` | Pagar {{amount}} | Pay {{amount}} |
| `experts.bookingWizard.confirmBooking` | Confirmar reserva | Confirm booking |
| `experts.bookingWizard.acceptTerms` | Aceite os termos para continuar. | Please accept the terms to continue. |
| `experts.bookingWizard.nameRequired` | Digite seu nome. | Please enter your name. |
| `experts.bookingWizard.slotTaken` | Esse horário acabou de ser ocupado. Escolha outro horário ou volte para selecionar outro. | That time was just taken. Pick another time or go back to choose a different slot. |
| `experts.bookingWizard.slotUnavailable` | Este horário não está mais disponível. | This time slot is no longer available. |
| `experts.bookingWizard.tryAgain` | Tentar reservar novamente | Try booking again |
| `experts.bookingWizard.successTitle` | Reserva confirmada | You’re booked |
| `experts.bookingWizard.successBody` | Obrigado — sua sessão com {{name}} está reservada. | Thanks — your session with {{name}} is reserved. |
| `experts.bookingWizard.confirmationEmail` | Enviamos uma confirmação para {{email}}. | We sent a confirmation to {{email}}. |
| `experts.bookingWizard.bookAnother` | Reservar outra sessão | Book another session |
| `experts.bookingWizard.quoteNote` | O preço final pode ser combinado separadamente, antes ou depois da sessão. | Final price may be agreed separately before or after the session. |
| `experts.bookingWizard.priceQuote` | Combinaremos o preço depois | We’ll agree price later |
| `experts.bookingWizard.priceHourly` | {{rate}} {{currency}} / h | {{rate}} {{currency}} / hr |
| `experts.bookingWizard.priceFixed` | {{amount}} {{currency}} | {{amount}} {{currency}} |
| `experts.bookingWizard.priceFixedWithLabel` | {{amount}} {{currency}} — {{label}} | {{amount}} {{currency}} — {{label}} |
| `experts.bookingWizard.priceDash` | — | — |
| `transactions.title` | Atividades | Activities |
| `transactions.searchPlaceholder` | Buscar transações... | Search transactions... |
| `transactions.empty` | Nenhuma transação encontrada | No transactions found |
| `transactions.emptyHint` | Comece enviando sua primeira transferência | Start by sending your first transfer |
| `transactions.noSearchResults` | Nenhuma transação corresponde à sua busca | No transactions match your search |
| `transactions.adjustSearch` | Tente ajustar os termos da busca | Try adjusting your search terms |
| `transactions.referralPayout` | Pagamento de indicação | Referral payout |
| `transactions.withdrawalTo` | Saque para | Withdrawal to |
| `transactions.recipientReceives` | O destinatário recebe | Recipient receives |
| `transactions.recipientFallback` | Destinatário | Recipient |
| `transactions.to` | Para | To |
| `transactions.unknownRecipient` | Desconhecido | Unknown |
| `transactions.sendAmount` | Valor enviado | Send Amount |
| `transactions.receiveAmount` | Valor recebido | Receive Amount |
| `transactions.orderLabel` | PEDIDO | ORDER |
| `transactions.sendBadge` | ENVIO | SEND |
| `transactions.amountPaid` | Valor pago | Amount Paid |
| `transactions.orderAmount` | Valor do pedido | Order Amount |
| `orders.title` | Transferência | Transfer |
| `orders.totalVolume` | Total gasto | Total Spent |
| `orders.totalTransactions` | Transações | Transactions |
| `orders.rowSentTo` | Enviado para {{name}} | Sent to {{name}} |
| `orders.rowHubOrder` | Pedido do Hub | Hub order |
| `orders.statusPending` | Pendente | Pending |
| `orders.statusFailed` | Falhou | Failed |
| `orders.statusCancelled` | Cancelada | Cancelled |
| `orders.searchPlaceholder` | Buscar transações... | Search transactions... |
| `orders.chipAll` | Todas | All |
| `orders.chipSend` | Envio | Send |
| `orders.chipHub` | Hub | Hub |
| `orders.chipPayout` | Pagamento | Payout |
| `orders.badgeFood` | Comida | Food |
| `orders.badgeMart` | Mercado | Mart |
| `orders.badgeReferral` | Indicação | Referral |
| `orders.groupToday` | Hoje | Today |
| `orders.groupYesterday` | Ontem | Yesterday |
| `txDetail.errorNotFound` | Transação não encontrada ou acesso negado | Transaction not found or access denied |
| `txDetail.errorLoadFailed` | Falha ao carregar os detalhes da transação | Failed to load transaction details |
| `txDetail.notFound` | Transação não encontrada | Transaction not found |
| `txDetail.backToDashboard` | Voltar ao painel | Back to Dashboard |
| `txDetail.login` | Entrar | Login |
| `txDetail.referralPayout` | Pagamento de indicação | Referral payout |
| `txDetail.transaction` | Transação | Transaction |
| `txDetail.transfer` | Transferência | Transfer |
| `txDetail.payoutStatus` | Status do pagamento | Payout status |
| `txDetail.transactionStatus` | Status da transação | Transaction Status |
| `txDetail.copyTxnId` | Copiar ID da transação | Copy Transaction ID |
| `txDetail.transactionId` | ID da transação | Transaction ID |
| `txDetail.createdLabel` | Criada em: | Created: |
| `txDetail.failedLabel` | Falhou em: | Failed: |
| `txDetail.statusLabel` | Status: | Status: |
| `txDetail.receiptUploaded` | Comprovante de pagamento enviado | Payment Receipt Uploaded |
| `txDetail.receiptFile` | Arquivo do comprovante | Receipt file |
| `txDetail.sendAgain` | Enviar novamente | Send Again |
| `txDetail.backToReferrals` | Voltar às indicações | Back to referrals |
| `txDetail.contactSupport` | Falar com o suporte | Contact Support |
| `txDetail.dashboard` | Painel | Dashboard |
| `txDetail.payoutSummary` | Resumo do pagamento | Payout summary |
| `txDetail.transactionSummary` | Resumo da transação | Transaction Summary |
| `txDetail.withdrawalAmount` | Valor do saque | Withdrawal amount |
| `txDetail.youSent` | Você enviou | You Sent |
| `txDetail.hubAmountPaid` | Valor pago | Amount Paid |
| `txDetail.hubOrderAmount` | Valor do pedido | Order Amount |
| `txDetail.hubProductAmount` | Valor do produto | Product Amount |
| `txDetail.hubOrderTitle` | Resumo do pedido | Order summary |
| `txDetail.hubOrderSummary` | Resumo do pedido | Order summary |
| `txDetail.hubTotalToPaid` | Total pago | Total to paid |
| `txDetail.hubFee` | Taxa do Hub | Hub fee |
| `txDetail.fulfillmentSummary` | Atendimento | Fulfillment |
| `txDetail.fulfillmentContact` | Contato | Contact |
| `txDetail.fulfillmentAddress` | Endereço | Address |
| `txDetail.fulfillmentComment` | Comentário | Comment |
| `txDetail.fullName` | Nome completo | Full name |
| `txDetail.phone` | Telefone | Phone |
| `txDetail.fee` | Taxa de câmbio | Exchange fee |
| `txDetail.free` | Grátis | Free |
| `txDetail.totalPaid` | Total pago | Total Paid |
| `txDetail.recipientGets` | O destinatário recebe | Recipient Gets |
| `txDetail.exchangeRate` | Taxa de câmbio | Exchange Rate |
| `txDetail.logisticsFee` | Taxa de logística | Logistics fee |
| `txDetail.cashDelivery` | Entrega em dinheiro | Cash delivery |
| `txDetail.recipient` | Destinatário | Recipient |
| `txDetail.timerTookDelayed` | Levou {{elapsed}} • Atraso de {{delay}} | Took {{elapsed}} • Delayed {{delay}} |
| `txDetail.timerTook` | Levou {{elapsed}} | Took {{elapsed}} |
| `txDetail.timerDelayed` | Atraso de {{delay}} | Delayed {{delay}} |
| `txDetail.timerTimeLeft` | Tempo restante: {{time}} | Time left {{time}} |
| `txDetail.stepTxnInitiated` | Transação iniciada | Transaction Initiated |
| `txDetail.stepPaymentReceived` | Pagamento recebido | Payment Received |
| `txDetail.stepTransferInitiated` | Transferência iniciada | Transfer Initiated |
| `txDetail.stepTransferFailed` | Transferência falhou | Transfer Failed |
| `txDetail.stepTransferCancelled` | Transferência cancelada | Transfer Cancelled |
| `txDetail.stepTxnCreated` | Transação criada | Transaction Created |
| `txDetail.stepTransferComplete` | Transferência concluída | Transfer Complete |
| `txDetail.hubStepFulfillmentStarted` | Atendimento iniciado | Fulfillment Started |
| `txDetail.hubStepTransactionFailed` | Transação falhou | Transaction Failed |
| `txDetail.hubStepTransactionCancelled` | Transação cancelada | Transaction Cancelled |
| `txDetail.hubStepOrderCompleted` | Pedido concluído | Order Completed |
| `txDetail.payoutRequestSubmitted` | Solicitação enviada | Request submitted |
| `txDetail.payoutRequestSubmittedDesc` | Seu saque de indicação está na fila de processamento. | Your referral withdrawal is queued for processing. |
| `txDetail.payoutProcessing` | Processando pagamento | Processing payout |
| `txDetail.payoutProcessingDesc` | Estamos enviando os fundos ao destinatário que você salvou. | We're sending funds to your saved recipient. |
| `txDetail.payoutComplete` | Pagamento concluído | Payout complete |
| `txDetail.payoutCompleteDesc` | Sua recompensa de indicação foi enviada ao seu destinatário. | Your referral reward has been sent to your recipient. |
| `txDetail.payoutFailed` | Pagamento falhou | Payout failed |
| `txDetail.payoutFailedDesc` | Houve um problema ao processar este saque. Entre em contato com o suporte. | There was an issue processing this withdrawal. Please contact support. |
| `txDetail.payoutCancelled` | Solicitação cancelada | Request cancelled |
| `txDetail.payoutCancelledDesc` | Esta solicitação de pagamento foi cancelada. Seu saldo de indicação não foi reduzido. | This payout request was cancelled. Your referral balance was not reduced. |
| `txDetail.payoutProcessingGeneric` | Em processamento | Processing |
| `txDetail.payoutProcessingGenericDesc` | Seu saque está sendo processado. | Your withdrawal is being processed. |
| `txDetail.statusTxnCreated` | Transação criada | Transaction Created |
| `txDetail.statusTxnCreatedDesc` | Sua transferência foi criada e está sendo processada | Your transfer has been created and is being processed |
| `txDetail.statusPaymentReceived` | Pagamento recebido | Payment Received |
| `txDetail.statusPaymentReceivedDesc` | Seu pagamento foi recebido e está sendo processado | Your payment has been received and is being processed |
| `txDetail.statusTransferComplete` | Transferência concluída | Transfer Complete! |
| `txDetail.statusTransferCompleteDesc` | Seu dinheiro foi transferido com sucesso | Your money has been successfully transferred |
| `txDetail.hubStatusOrderCreated` | Pedido criado | Order created |
| `txDetail.hubStatusOrderCreatedDesc` | Seu pedido do Hub foi criado e aguarda atendimento. | Your Hub order has been created and is awaiting fulfillment. |
| `txDetail.hubStatusFulfillmentStarted` | Atendimento iniciado | Fulfillment started |
| `txDetail.hubStatusFulfillmentStartedDesc` | Seu pedido do Hub está sendo atendido. | Your Hub order is being fulfilled. |
| `txDetail.hubStatusOrderCompleted` | Pedido concluído | Order completed |
| `txDetail.hubStatusOrderCompletedDesc` | Seu pedido do Hub foi atendido com sucesso. | Your Hub order was fulfilled successfully. |
| `txDetail.statusTxnFailed` | Transação falhou | Transaction Failed |
| `txDetail.statusTxnFailedDesc` | Houve um problema com a sua transação. Entre em contato com o suporte. | There was an issue with your transaction. Please contact support. |
| `txDetail.statusTxnCancelled` | Transação cancelada | Transaction Cancelled |
| `txDetail.statusTxnCancelledDesc` | Esta transação foi cancelada. Se o pagamento foi feito, você receberá o reembolso. | This transaction has been cancelled. You will receive a refund if payment was made. |
| `txDetail.statusProcessing` | Transação em processamento | Transaction Processing |
| `txDetail.statusProcessingDesc` | Sua transação está sendo processada | Your transaction is being processed |
| `txTimeline.payoutSubmitted` | Solicitação enviada | Request submitted |
| `txTimeline.payoutSubmittedDesc` | Recebemos sua solicitação de saque de indicação. | Your referral withdrawal request was received. |
| `txTimeline.processing` | Em processamento | Processing |
| `txTimeline.processingDesc` | Estamos analisando e enviando seu pagamento ao destinatário. | We're reviewing and sending your payout to your recipient. |
| `txTimeline.payoutSent` | Pagamento enviado | Payout sent |
| `txTimeline.payoutSentDescBank` | Os fundos estão a caminho de {{bank}}. | Funds are on the way to {{bank}}. |
| `txTimeline.payoutSentDesc` | Seu pagamento de indicação foi processado. | Your referral payout has been processed. |
| `txTimeline.initiated` | Iniciada | Initiated |
| `txTimeline.initiatedDesc` | Aguardando confirmação do pagamento | Pending payment confirmation |
| `txTimeline.processingSend` | Em processamento | Processing |
| `txTimeline.processingSendDesc` | Seu dinheiro está a caminho. | Your money is on its way. |
| `txTimeline.hubProcessingSend` | Processando seu pedido | Processing your order |
| `txTimeline.hubProcessingSendDesc` | Estamos atendendo seu pedido do Ciuna Hub. | We're fulfilling your Ciuna Hub order. |
| `txTimeline.completed` | Concluída | Completed |
| `txTimeline.completedDescBank` | {{bank}} recebeu sua transação. | {{bank}} received your transaction. |
| `txTimeline.completedDesc` | Transação concluída com sucesso. | Transaction completed successfully. |
| `txTimeline.hubOrderCompletedDesc` | Seu pedido foi atendido com sucesso. | Your order was fulfilled successfully. |
| `support.title` | Suporte | Support |
| `support.getInTouch` | Fale conosco | Get in Touch |
| `support.emailSupport` | Suporte por e-mail | Email Support |
| `support.telegramChat` | Chat no Telegram | Telegram Chat |
| `support.telegramSubtitle` | Converse conosco no Telegram | Chat with us on Telegram |
| `support.faqTitle` | Perguntas frequentes | Frequently Asked Questions |
| `support.hoursTitle` | Horário do suporte | Support Hours |
| `support.hoursBody` | Todos os dias, das 8h às 23h (GMT+3) | All week from 8 am to 11pm GMT+3 |
| `support.faq1q` | Como envio dinheiro? | How do I send money? |
| `support.faq1a` | Para enviar dinheiro, toque no botão “Enviar dinheiro” no seu painel, informe o valor e selecione as moedas, escolha um destinatário, faça o pagamento pela forma exibida e confirme sua transação. | To send money, click the "Send Money" button on your dashboard, enter the amount and select currencies, choose a recipient, make payment using the displayed method, and confirm your transaction. |
| `support.faq2q` | Quais são as taxas? | What are the fees? |
| `support.faq2a` | Não cobramos nenhuma taxa em nenhuma transação. Envie dinheiro para o mundo todo sem custo com a Ciuna. | We charge absolutely no fees on any transaction. Send money worldwide completely free with Ciuna. |
| `support.faq3q` | Quanto tempo leva? | How long does it take? |
| `support.faq3a` | Todas as transações são concluídas em minutos, para que seu dinheiro chegue ao destino de forma rápida e eficiente. | All transactions are completed within minutes, ensuring your money reaches its destination quickly and efficiently. |
| `send.retry` | Tentar novamente | Retry |
| `send.noCurrencies` | Nenhuma moeda disponível. Entre em contato com o suporte. | No currencies available. Please contact support. |
| `send.youSend` | Você envia | You Send |
| `send.receiverGets` | O destinatário recebe | Receiver Gets |
| `send.sendMoneyHeroTitle` | Enviar dinheiro | Send Money |
| `send.sendMoneyHeroSubtitle` | Escolha o valor e as moedas para começar | Choose amount and currencies to begin |
| `send.steps.amount` | Valor | Amount |
| `send.steps.recipient` | Destinatário | Recipient |
| `send.steps.review` | Revisão | Review |
| `send.rateUnavailable` | Taxa de câmbio indisponível para este par. | Exchange rate not available for this pair. |
| `send.mobile.amountHeadline` | Quanto você quer enviar? | How much are you sending? |
| `send.mobile.recipientHeadline` | Quem vai receber? | Who receives it? |
| `send.mobile.reviewHeadline` | Revisar e pagar | Review & pay |
| `send.mobile.manageRecipients` | Gerenciar destinatários | Manage recipients |
| `send.mobile.saveRecipient` | Salvar destinatário | Save recipient |
| `send.mobile.paymentSbp` | Pagamento: SBP | Payment: SBP |
| `send.mobile.createSbpPayment` | Criar pagamento via SBP | Create SBP payment |
| `send.mobile.verifyBannerTitle` | Verifique sua identidade para enviar dinheiro | Verify identity to send money |
| `send.mobile.verifyBannerAction` | Começar | Begin |
| `send.mobile.swapCurrencies` | Inverter moedas | Swap currencies |
| `send.mobile.verifyRequired` | Conclua a verificação de identidade para enviar dinheiro. | Complete identity verification to send money. |
| `send.mobile.quoteFeesUnavailable` | Não foi possível confirmar a taxa. Tente novamente. | Couldn't confirm the fee. Try again. |
| `send.mobile.quoteBelowMinRub` | Envie pelo menos 1.000 RUB. | Send at least 1,000 RUB. |
| `send.mobile.quoteMinContribution` | Envie um valor maior para continuar. | Send a higher amount to continue. |
| `send.quoteDeskRateNotConfigured` | Esta rota ainda não está pronta. Defina no Office a taxa de USD para a moeda de recebimento (usada como mesa de pagamento em USDT). | This corridor isn't ready yet. Set the USD → receive currency rate in Office (used as USDT payout desk). |
| `send.quoteReceiveCappedByUsdt` | O valor do destinatário reflete o que este pagamento consegue cobrir após as taxas. | Recipient amount reflects what this payment can fund after fees. |
| `send.quoteMinContribution` | Envie um valor maior para continuar. | Send a higher amount to continue. |
| `send.fee` | Taxa de câmbio | Exchange fee |
| `send.processingFee` | Taxa de processamento | Processing Fee |
| `send.rate` | Taxa de câmbio | Exchange Rate |
| `send.free` | Grátis | Free |
| `send.min` | Mín.: {{amount}} | Min: {{amount}} |
| `send.max` | Máx.: {{amount}} | Max: {{amount}} |
| `send.continue` | Continuar | Continue |
| `send.addRecipient` | Adicionar destinatário | Add Recipient |
| `send.searchRecipients` | Buscar destinatários | Search recipients |
| `send.addNewRecipient` | Adicionar novo destinatário | Add new recipient |
| `send.addNewRecipientTitle` | Adicionar novo destinatário | Add New Recipient |
| `send.currency` | Moeda | Currency |
| `send.autoSelected` | Selecionada automaticamente | Auto-selected |
| `send.accountName` | Nome da conta * | Account Name * |
| `send.enterAccountName` | Digite o nome da conta | Enter account name |
| `send.selectCurrencyFirst` | Selecione uma moeda primeiro para ver os campos obrigatórios | Please select a currency first to see the required fields |
| `send.transferType` | Tipo de transferência * | Transfer Type * |
| `send.addRecipientBtn` | Adicionar destinatário | Add Recipient |
| `send.noRecipientsSearch` | Nenhum destinatário encontrado para “{{term}}” | No recipients found matching "{{term}}" |
| `send.noRecipientsCurrency` | Nenhum destinatário encontrado para {{currency}} | No recipients found for {{currency}} |
| `send.addRecipientHint` | Adicione um novo destinatário para começar | Add a new recipient to get started |
| `send.back` | Voltar | Back |
| `send.makePayment` | Pagar | Make Payment |
| `send.transferLine` | Transferir {{amount}} | Transfer {{amount}} |
| `send.transferLineWithLogistics` | Transferir {{amount}} (+ taxa de logística) | Transfer {{amount}} (+ logistics fee) |
| `send.sendAmountPlusFee` | Valor enviado: {{send}} + taxa de câmbio: {{fee}} | Send amount: {{send}} + Exchange fee: {{fee}} |
| `send.noPaymentMethods` | Nenhuma forma de pagamento configurada para {{currency}} | No payment methods configured for {{currency}} |
| `send.contactSupport` | Entre em contato com o suporte | Please contact support |
| `send.importantInstructions` | Instruções importantes | Important Instructions |
| `send.transferExactly` | Transfira exatamente | Transfer exactly |
| `send.amountFeeBreakdown` | (Valor: {{send}} + taxa de câmbio: {{fee}}) | (Amount: {{send}} + Exchange fee: {{fee}}) |
| `send.noteTransactionId` | Anote o ID da transação | Note Transaction ID |
| `send.completeWithin` | Conclua em até | Complete within |
| `send.aFewMinutes` | alguns minutos | a few minutes |
| `send.uploadReceiptVerify` | Envie o comprovante para uma verificação mais rápida | Upload receipt for quick verification |
| `send.scanQrBanking` | Escaneie o QR code com o aplicativo do seu banco | Scan QR code with your mobile banking app |
| `send.cryptoAsset` | Ativo | Asset |
| `send.cryptoNetwork` | Rede | Network |
| `send.walletAddress` | Endereço da carteira | Wallet address |
| `send.stablecoinMissingAddress` | O endereço da carteira não foi informado. Entre em contato com o suporte. | Wallet address is missing. Contact support. |
| `send.scanWalletQr` | Escaneie o QR code com sua carteira de criptomoedas e confirme que a rede é a mesma antes de enviar. | Scan the QR code with your crypto wallet and confirm the network matches before sending. |
| `send.mobileMoneyNameLabel` | Nome | Name |
| `send.mobileMoneyPhoneLabel` | Número de telefone | Phone number |
| `send.payMobileMoney` | Envie o pagamento por mobile money para o nome e o número indicados acima. | Send the payment via mobile money to the name and number shown above. |
| `send.viewQrPdf` | Ver PDF do QR code | View QR Code PDF |
| `send.qrCodeAlt` | QR code | QR Code |
| `send.uploadError` | Erro no envio | Upload Error |
| `send.uploadFailed` | Falha no envio | Upload Failed |
| `send.uploadReceipt` | Enviar comprovante de pagamento | Upload Payment Receipt |
| `send.clickTryAgain` | Toque para tentar novamente | Click to try again |
| `send.fileTypesHint` | JPG, PNG ou PDF (máx. 5 MB) | JPG, PNG or PDF (Max 5MB) |
| `send.uploading` | Enviando... | Uploading... |
| `send.sending` | Enviando... | Sending... |
| `send.ivePaid` | Já paguei | I've Paid |
| `send.transactionSummary` | Resumo da transação | Transaction Summary |
| `send.youSendLabel` | Você envia | You Send |
| `send.totalToPay` | Total a pagar | Total to Pay |
| `send.recipientGetsLabel` | O destinatário recebe | Recipient Gets |
| `send.arrivesIn` | Chega em até | Arrives within |
| `send.arrivalDurationHours_one` | {{count}} hora | {{count}} hour |
| `send.arrivalDurationHours_other` | {{count}} horas | {{count}} hours |
| `send.arrivalDurationMinutes_one` | {{count}} minuto | {{count}} minute |
| `send.arrivalDurationMinutes_other` | {{count}} minutos | {{count}} minutes |
| `send.arrivalDurationHoursMinutes` | {{hours}} h {{minutes}} min | {{hours}} h {{minutes}} min |
| `send.exchangeRateLabel` | Taxa de câmbio | Exchange Rate |
| `send.recipientLabel` | Destinatário | Recipient |
| `send.transactionId` | ID da transação | Transaction ID |
| `send.failedAddRecipient` | Falha ao adicionar o destinatário. Tente novamente. | Failed to add recipient. Please try again. |
| `send.fileTooLarge` | O arquivo deve ter menos de 5 MB | File size must be less than 5MB |
| `send.fileTypeInvalid` | Somente arquivos JPG, PNG e PDF são permitidos | Only JPG, PNG, and PDF files are allowed |
| `send.failedCreateTxn` | Falha ao criar a transação. Tente novamente. | Failed to create transaction. Please try again. |
| `send.emailVerificationTitle` | Verificação de e-mail necessária | Email Verification Required |
| `send.emailVerificationBody` | Verifique seu endereço de e-mail antes de enviar dinheiro. Enviamos um link de verificação para {{email}}. | Please verify your email address before you can send money. We've sent a verification link to {{email}}. |
| `send.emailVerificationCheck` | Confira seu e-mail e toque no link de verificação para continuar. | Check your email and click the verification link to continue. |
| `send.cancel` | Cancelar | Cancel |
| `send.resendEmail` | Reenviar e-mail | Resend Email |
| `send.resending` | Enviando... | Sending... |
| `send.resendVerificationSuccess` | E-mail de verificação enviado. Confira sua caixa de entrada. | Verification email sent! Please check your inbox. |
| `send.resendVerificationFailed` | Falha ao enviar o e-mail de verificação. Tente novamente. | Failed to send verification email. Please try again. |
| `send.optionalSuffix` |  (opcional) |  (Optional) |
| `send.fulfillmentErrorOutsideBank` | Este valor de recebimento está fora do intervalo permitido para transferência bancária nesta rota. Ajuste o valor ou adicione uma faixa de dinheiro em espécie no admin / entre em contato com o suporte. | This receive amount is outside the range allowed for bank transfer on this corridor. Adjust the amount or add a cash window in admin / contact support. |
| `send.fulfillmentErrorOverlap` | Este valor de recebimento se enquadra nas regras de banco e de dinheiro em espécie. As configurações da rota devem usar faixas distintas — entre em contato com o suporte. | This receive amount matches both bank and cash rules. Corridor settings should use disjoint ranges — contact support. |
| `send.fulfillmentErrorGap` | Este valor de recebimento não é elegível para esta rota. Ajuste o valor. | This receive amount is not eligible for this corridor. Adjust the amount. |
| `send.cashHandBanner` | Para este valor, os fundos serão entregues em dinheiro no endereço que você selecionar (não por transferência bancária). | For this amount, funds will be delivered as cash to the address you select (not by bank transfer). |
| `send.logisticsFeeLabel` | Taxa de logística | Logistics fee |
| `send.logisticsFeeHintPercent` | {{pct}}% do valor que o destinatário recebe (somado ao total do seu envio) | {{pct}}% of what the recipient receives (added to your send total) |
| `send.cashStep2Title` | Entrega em dinheiro | Cash delivery |
| `send.searchDeliveryAddresses` | Buscar por endereço ou telefone | Search by address or phone |
| `send.noDeliverySearch` | Nenhum endereço salvo corresponde a “{{term}}” | No saved addresses match "{{term}}" |
| `send.noDeliveryAddressesYet` | Nenhum endereço de entrega salvo ainda | No delivery addresses saved yet |
| `send.addDeliveryHint` | Adicione um endereço acima para continuar | Add an address above to continue |
| `send.deliveryAddressSection` | Endereço de entrega | Delivery address |
| `send.addDeliveryAddress` | Adicionar endereço de entrega | Add delivery address |
| `send.addDeliveryAddressTitle` | Adicionar endereço de entrega | Add delivery address |
| `send.deliveryAddressLine` | Endereço | Address |
| `send.deliveryAddressLinePlaceholder` | Rua, bairro, ponto de referência… | Street, area, landmark… |
| `send.deliveryPhone` | Telefone | Phone |
| `send.deliveryPhonePlaceholder` | Telefone de contato para a entrega | Phone number for delivery contact |
| `send.saveDeliveryAddress` | Salvar endereço | Save address |
| `send.failedAddDelivery` | Não foi possível salvar o endereço de entrega. Tente novamente. | Could not save delivery address. Try again. |
| `send.cashDeliverySummary` | Entrega em dinheiro | Cash delivery |
| `recipients.title` | Destinatários | Recipients |
| `recipients.transferType` | Tipo de transferência * | Transfer Type * |
| `recipients.addRecipient` | Adicionar destinatário | Add Recipient |
| `recipients.addNewTitle` | Adicionar novo destinatário | Add New Recipient |
| `recipients.editRecipientTitle` | Editar destinatário | Edit Recipient |
| `recipients.confirmDeleteTitle` | Excluir destinatário? | Delete recipient? |
| `recipients.confirmDeleteBody` | Esta ação não pode ser desfeita. | This can't be undone. |
| `recipients.deleteAction` | Excluir | Delete |
| `recipients.searchPlaceholder` | Buscar destinatários... | Search recipients... |
| `recipients.saving` | Salvando... | Saving... |
| `recipients.updateRecipient` | Atualizar destinatário | Update Recipient |
| `recipients.failedAdd` | Falha ao adicionar o destinatário | Failed to add recipient |
| `recipients.failedUpdate` | Falha ao atualizar o destinatário | Failed to update recipient |
| `recipients.failedDeleteLinked` | Falha ao excluir — vinculado a uma transação | Failed to delete — linked to a transaction |
| `recipients.noMatchSearch` | Nenhum destinatário corresponde à sua busca | No recipients match your search |
| `recipients.noneFound` | Nenhum destinatário encontrado | No recipients found |
| `recipients.emptyAddHint` | Adicione seu primeiro destinatário para começar | Add your first recipient to get started |
| `recipients.checking` | Conta corrente | Checking |
| `recipients.savings` | Poupança | Savings |
| `recipients.currency` | Moeda | Currency |
| `recipients.accountName` | Nome da conta * | Account Name * |
| `recipients.enterAccountName` | Digite o nome da conta | Enter account name |
| `recipients.selectCurrencyFirst` | Selecione uma moeda primeiro para ver os campos obrigatórios | Please select a currency first to see the required fields |
| `recipients.optionalSuffix` |  (opcional) |  (Optional) |
| `recipients.fieldLabels.routing_number` | Número de roteamento | Routing Number |
| `recipients.fieldLabels.account_number` | Número da conta | Account Number |
| `recipients.fieldLabels.account_name` | Nome da conta | Account Name |
| `recipients.fieldLabels.bank_name` | Nome do banco | Bank Name |
| `recipients.fieldLabels.address_line1` | Endereço (linha 1) | Address Line 1 |
| `recipients.fieldLabels.address_line2` | Endereço (linha 2) | Address Line 2 |
| `recipients.fieldLabels.city` | Cidade | City |
| `recipients.fieldLabels.state` | Estado | State |
| `recipients.fieldLabels.postal_code` | Código postal | ZIP Code |
| `recipients.fieldLabels.checking_or_savings` | Tipo de conta | Account Type |
| `recipients.fieldLabels.sort_code` | Sort code | Sort Code |
| `recipients.fieldLabels.iban` | IBAN | IBAN |
| `recipients.fieldLabels.swift_bic` | SWIFT/BIC | SWIFT/BIC |
| `recipients.fieldPlaceholders.routing_number` | ex.: 123456789 | e.g., 123456789 |
| `recipients.fieldPlaceholders.account_number` | ex.: 1234567890 | e.g., 1234567890 |
| `recipients.fieldPlaceholders.account_name` | ex.: Nome da Empresa Ltda. | e.g., Company Name LLC |
| `recipients.fieldPlaceholders.bank_name` | ex.: Bank of America | e.g., Bank of America |
| `recipients.fieldPlaceholders.address_line1` | ex.: 123 Main Street | e.g., 123 Main Street |
| `recipients.fieldPlaceholders.address_line2` | ex.: Apto 4B (opcional) | e.g., Apt 4B (optional) |
| `recipients.fieldPlaceholders.city` | ex.: Nova York | e.g., New York |
| `recipients.fieldPlaceholders.state` | ex.: NY | e.g., NY |
| `recipients.fieldPlaceholders.postal_code` | ex.: 10001 | e.g., 10001 |
| `recipients.fieldPlaceholders.checking_or_savings` | Selecione o tipo de conta | Select account type |
| `recipients.fieldPlaceholders.sort_code` | ex.: 123456 | e.g., 123456 |
| `recipients.fieldPlaceholders.iban` | ex.: GB82 WEST 1234 5698 7654 32 | e.g., GB82 WEST 1234 5698 7654 32 |
| `recipients.fieldPlaceholders.swift_bic` | ex.: NWBKGB2L | e.g., NWBKGB2L |
| `referrals.pageTitle` | Afiliados e indicações | Affiliates & Referrals |
| `referrals.subtitle` | Compartilhe seu link e acompanhe as recompensas quando seus amigos enviarem dinheiro. | Share your link and track rewards when friends send money. |
| `referrals.referFriend` | Indique um amigo | Refer a friend |
| `referrals.referralLink` | Link de indicação | Referral link |
| `referrals.copyLink` | Copiar link | Copy link |
| `referrals.copied` | Copiado | Copied |
| `referrals.commissionRules` | Regras da taxa de comissão | Commission rate rules |
| `referrals.commissionRulesHint` | Quanto mais amigos você indicar e concluírem transações, maior será sua taxa de comissão. | The more friends you refer and they complete transactions, the higher your commission rate! |
| `referrals.commissionRulesExample` | Exemplo: uma transação concluída de $100 a 0,5% rende a você $0,50. | Example: a completed $100 transaction at 0.5% earns you $0.50. |
| `referrals.tierLine_one` | <bold>{{count}}</bold> indicado qualificado neste trimestre | <bold>{{count}}</bold> qualified referee this quarter |
| `referrals.tierLine_few` | <bold>{{count}}</bold> indicados qualificados neste trimestre | <bold>{{count}}</bold> qualified referees this quarter |
| `referrals.tierLine_many` | <bold>{{count}}</bold> indicados qualificados neste trimestre | <bold>{{count}}</bold> qualified referees this quarter |
| `referrals.tierLine_other` | <bold>{{count}}</bold> indicados qualificados neste trimestre | <bold>{{count}}</bold> qualified referees this quarter |
| `referrals.availableWithdraw` | Disponível para saque | Available to withdraw |
| `referrals.lifetimeEarned` | Total ganho (incluindo o já pago): {{amount}} | Lifetime earned (incl. paid out): {{amount}} |
| `referrals.myReferrals` | Minhas indicações | My referrals |
| `referrals.noReferrals` | Você ainda não tem indicações | You have no referrals yet |
| `referrals.completedTxCount_one` | {{count}} transação concluída | {{count}} completed transaction |
| `referrals.completedTxCount_few` | {{count}} transações concluídas | {{count}} completed transactions |
| `referrals.completedTxCount_many` | {{count}} transações concluídas | {{count}} completed transactions |
| `referrals.completedTxCount_other` | {{count}} transações concluídas | {{count}} completed transactions |
| `referrals.rewardWindowEnds` | O período de recompensa termina em {{date}} | Reward window ends {{date}} |
| `referrals.shareLink` | Compartilhar | Share |
| `referrals.withdraw` | Sacar | Withdraw |
| `referrals.requestPayout` | Solicitar pagamento | Request payout |
| `referrals.payoutInstructions` | Escolha um destinatário salvo e o valor. Nossa equipe processará a transferência. Disponível: {{available}} | Choose a saved recipient and amount. Our team will process the transfer. Available: {{available}} |
| `referrals.recipient` | Destinatário | Recipient |
| `referrals.selectRecipient` | Selecione o destinatário | Select recipient |
| `referrals.amount` | Valor ({{symbol}}) | Amount ({{symbol}}) |
| `referrals.cancel` | Cancelar | Cancel |
| `referrals.submitRequest` | Enviar solicitação | Submit request |
| `referrals.errRecipientAmount` | Escolha um destinatário e informe um valor. | Choose a recipient and enter an amount. |
| `referrals.errAmountPositive` | Informe um valor maior que zero. | Enter an amount greater than zero. |
| `referrals.errAmountExceeds` | Esse valor é maior que o seu saldo disponível ({{balance}}). Informe um valor menor. | That amount is more than your available balance ({{balance}}). Enter a lower amount. |
| `referrals.failedLoad` | Falha ao carregar | Failed to load |
| `referrals.withdrawFailed` | Falha no saque | Withdraw failed |
| `referrals.requestFailed` | Falha na solicitação | Request failed |
| `referrals.programPaused` | O programa de indicação está pausado. Volte mais tarde. | The referral program is paused. Check back later. |
| `referrals.programPercent` | Ganhe {{pct}}% sobre as transações concluídas de cada usuário indicado por {{months}} meses a partir da primeira transação dele na Ciuna. | Earn {{pct}}% on each referred user's completed transactions for {{months}} months from their first transaction on Ciuna. |
| `referrals.programTier` | Ganhe comissão escalonada sobre as transações concluídas de cada usuário indicado por {{months}} meses a partir da primeira transação dele na Ciuna. | Earn tiered commission on each referred user's completed transactions for {{months}} months from their first transaction on Ciuna. |
| `referrals.programThreshold` | Ganhe {{reward}} quando cada indicado enviar, somadas, {{threshold}} ou mais em transações concluídas na Ciuna. | Earn {{reward}} when each referral sends a combined {{threshold}} or more in completed transactions on Ciuna. |
| `referrals.shareTitle` | Envie dinheiro com a Ciuna | Send Money with Ciuna |
| `referrals.shareMessagePrefix` | Use meu link para se cadastrar e enviar dinheiro entre mais de 10 países africanos e a Rússia, sem taxas, na Ciuna: | Use my link to sign up and send money between 10+ African countries and Russia for free on Ciuna: |
| `referrals.unnamedReferee` | Usuário | User |
| `profile.title` | Seu perfil | Your profile |
| `profile.changePhoto` | Alterar foto | Change photo |
| `profile.removePhoto` | Remover foto | Remove photo |
| `profile.removePhotoConfirm` | Remover sua foto de perfil? | Remove your profile photo? |
| `profile.takePhoto` | Tirar foto | Take Photo |
| `profile.chooseFromLibrary` | Escolher da galeria | Choose from Library |
| `profile.profileInfo` | Informações do perfil | Profile Information |
| `profile.edit` | Editar | Edit |
| `profile.discard` | Descartar | Discard |
| `profile.save` | Salvar | Save |
| `profile.saving` | Salvando... | Saving... |
| `profile.firstName` | Nome | First Name |
| `profile.lastName` | Sobrenome | Last Name |
| `profile.email` | Endereço de e-mail | Email Address |
| `profile.emailLocked` | O e-mail não pode ser alterado | Email cannot be changed |
| `profile.phone` | Número de telefone | Phone Number |
| `profile.baseCurrency` | Moeda base | Base Currency |
| `profile.selectBaseCurrency` | Selecione a moeda base | Select base currency |
| `profile.baseCurrencyHint` | Usada para exibir o total enviado | Used for reporting your total sent amount |
| `profile.notSet` | Não definido | Not set |
| `profile.deleteNotImplemented` | A exclusão de conta ainda não está disponível | Account deletion is not yet implemented |
| `profile.deleteFailed` | Falha ao excluir a conta. Tente novamente. | Failed to delete account. Please try again. |
| `profile.deleteAccount` | Excluir conta | Delete Account |
| `profile.deleteTitle` | Excluir conta | Delete Account |
| `profile.deleteDescription` | Tem certeza de que deseja excluir sua conta? Esta ação não pode ser desfeita. Todos os seus dados, transações e informações da conta serão excluídos permanentemente. | Are you sure you want to delete your account? This action cannot be undone. All your data, transactions, and account information will be permanently deleted. |
| `profile.cancel` | Cancelar | Cancel |
| `profile.deleting` | Excluindo... | Deleting... |
| `verification.hubTitle` | Verificação | Verification |
| `verification.hubSubtitle` | Conclua a verificação de identidade e de endereço, exigida por conformidade. | Complete identity and address verification for compliance. |
| `verification.infoKyc` | Conclua as informações de identidade e endereço (KYC) para fins de conformidade. | Please complete KYC Identity and Address information for compliance. |
| `verification.identityTitle` | Verificação de identidade | Identity verification |
| `verification.addressTitle` | Verificação de endereço | Address verification |
| `verification.identityCardDesc` | Informações do seu documento de identidade. | Your ID verification information. |
| `verification.addressInformation` | Informações de endereço | Address information |
| `verification.addressCardDesc` | Seu endereço residencial e comprovante. | Your home address and document. |
| `verification.notStarted` | Não iniciada | Not started |
| `verification.badgeDone` | Concluída | Done |
| `verification.badgeInReview` | Em análise | In review |
| `verification.badgeRejected` | Recusada | Rejected |
| `verification.badgePending` | Pendente | Pending |
| `verification.identityPageTitle` | Verificação de identidade | Identity Verification |
| `verification.addressPageTitle` | Informações de endereço | Address Information |
| `verification.labelFullName` | Nome completo | Full Name |
| `verification.labelDateOfBirth` | Data de nascimento | Date of Birth |
| `verification.labelCountry` | País | Country |
| `verification.labelIdType` | Tipo de documento | ID Type |
| `verification.labelIdDocument` | Documento de identidade | ID Document |
| `verification.labelDocument` | Documento | Document |
| `verification.labelStatus` | Status | Status |
| `verification.labelAddress` | Endereço | Address |
| `verification.labelDocumentType` | Tipo de documento | Document Type |
| `verification.labelAddressDocument` | Comprovante de endereço | Address Document |
| `verification.placeholderFullName` | Digite seu nome completo como consta no documento | Enter your full name as it appears on your ID |
| `verification.placeholderSelectCountry` | Selecione seu país | Select your country |
| `verification.searchCountries` | Buscar países... | Search countries... |
| `verification.placeholderSelectIdType` | Selecione o tipo de documento | Select ID type |
| `verification.placeholderAddress` | Digite seu endereço completo | Enter your full address |
| `verification.placeholderSelectDocType` | Selecione o tipo de documento | Select document type |
| `verification.registration` | Registro de residência | Registration |
| `verification.utilityBill` | Conta de serviços (luz, água, etc.) | Utility Bill |
| `verification.bankStatement` | Extrato bancário | Bank Statement |
| `verification.uploadErrorTitle` | Erro no envio | Upload Error |
| `verification.uploadIdTitle` | Enviar documento de identidade | Upload ID Document |
| `verification.uploadAddressTitle` | Enviar comprovante de endereço | Upload Address Document |
| `verification.uploadFailed` | Falha no envio | Upload Failed |
| `verification.clickToTryAgain` | Toque para tentar novamente | Click to try again |
| `verification.fileHint` | JPG, PNG ou PDF (máx. 10 MB) | JPG, PNG or PDF (max 10 MB) |
| `verification.chooseDocument` | Escolher arquivo (PDF ou imagem) | Choose file (PDF or image) |
| `verification.fileTooLarge` | O arquivo deve ter menos de 10 MB | File size must be less than 10MB |
| `verification.fileTypeInvalid` | Somente arquivos JPG, PNG e PDF são permitidos | Only JPG, PNG, and PDF files are allowed |
| `verification.fillAllFields` | Preencha todos os campos e envie um arquivo | Please fill in all fields and upload a file |
| `verification.identityLocked` | Sua verificação de identidade já está em análise ou aprovada. Não é possível enviar um novo documento. | Your identity verification is already under review or approved. You cannot upload a new document. |
| `verification.addressLocked` | Sua verificação de endereço já está em análise ou aprovada. Não é possível enviar um novo documento. | Your address verification is already under review or approved. You cannot upload a new document. |
| `verification.failedUploadDocument` | Falha ao enviar o documento | Failed to upload document |
| `verification.identityInReview` | Suas informações de identidade (KYC) estão em análise. Avisaremos assim que possível. Fique de olho no seu e-mail. | Your KYC identity information is in review. We will provide an update account soonest. Please check your email for updates. |
| `verification.identityPendingNote` | Seu envio está pendente de análise. Você pode atualizá-lo abaixo. | Your submission is pending review. You can update it below. |
| `verification.updateSubmissionHeading` | Atualizar envio | Update Submission |
| `verification.updating` | Atualizando... | Updating... |
| `verification.updateSubmission` | Atualizar envio | Update Submission |
| `verification.uploading` | Enviando... | Uploading... |
| `verification.submit` | Enviar | Submit |
| `verification.addressInReview` | Suas informações de endereço (KYC) estão em análise. Avisaremos assim que possível. Fique de olho no seu e-mail. | Your KYC address information is in review. We will provide an update account soonest. Please check your email for updates. |
| `verification.hubStatusVerifiedTitle` | Você está pronto para enviar | You're ready to send |
| `verification.hubStatusVerifiedBody` | Sua identidade foi verificada. Abra Enviar para transferir dinheiro. | Your identity is verified. Open Send to transfer money. |
| `verification.hubStatusPendingTitle` | Verificação em andamento | Verification in progress |
| `verification.hubStatusPendingBody` | Estamos conferindo os dados do seu passaporte. A maioria das análises termina em poucos minutos — esta página é atualizada automaticamente. | We're checking your passport details. Most reviews finish in a few minutes — this page updates automatically. |
| `verification.hubStatusNeededTitle` | Confirme sua identidade | Confirm your identity |
| `verification.hubStatusNeededBody` | Para enviar dinheiro, é preciso fazer uma verificação de identidade única com nosso parceiro de pagamentos (aceitamos passaportes russos e estrangeiros). | Sending money requires a one-time identity check with our payment partner (Russian and foreign passports supported). |
| `verification.hubContinueCta` | Verificar identidade | Verify identity |
| `verification.optionalSection` | Enviar documentos | Upload documents |
| `verification.sbpFormTitle` | Verificação de identidade | Identity verification |
| `verification.formLead` | Use exatamente o nome e os dados do passaporte que constam no seu documento — erros podem impedir o envio. | Use the exact name and passport details on your document — errors can block sending. |
| `verification.sbpSuccessTitle` | Você está pronto para enviar | You're ready to send |
| `verification.sbpSuccessBody` | Identidade verificada. Vá para Enviar para fazer uma transferência. | Identity verified. Go to Send to make a transfer. |
| `verification.sbpChecking` | Estamos analisando seu envio. A maioria das verificações termina em poucos minutos — você pode sair e voltar depois. | We're reviewing your submission. Most checks finish in a few minutes — you can leave and come back. |
| `verification.passportSegmentRu` | Passaporte russo | Russian passport |
| `verification.passportSegmentForeign` | Outro passaporte | Other passport |
| `verification.passportCountryShort` | País do passaporte | Passport country |
| `verification.formSectionName` | Nome | Name |
| `verification.formSectionPassport` | Passaporte | Passport |
| `verification.formSectionContact` | Contato | Contact |
| `verification.formSectionAddress` | Endereço na Rússia | Address in Russia |
| `verification.formFirstName` | Nome | First name |
| `verification.formLastName` | Sobrenome | Last name |
| `verification.formPatronymic` | Patronímico | Patronymic |
| `verification.formPassportNumber` | Número do passaporte | Passport number |
| `verification.formBirthDate` | Data de nascimento | Date of birth |
| `verification.formPassportIssueDate` | Data de emissão | Issue date |
| `verification.formDatePlaceholder` | DD.MM.AAAA | DD.MM.YYYY |
| `verification.formConsentShort` | Concordo com a verificação de identidade para pagamentos. | I agree to identity verification for payments. |
| `verification.sbpCardTitle` | Identidade SBP (Enviar) | SBP identity (Send) |
| `verification.sbpCardDesc` | Verificação em uma página segura do nosso parceiro. A Ciuna não coleta dados de passaporte no app. | Verification on a secure partner page. Ciuna does not collect passport data in the app. |
| `verification.sbpBadgeVerified` | Verificada | Verified |
| `verification.sbpBadgeRequired` | Necessária para Enviar | Required for Send |
| `verification.sbpBadgeChecking` | Em verificação | Checking |
| `verification.kycBridge.screenTitle` | Verificar identidade | Verify identity |
| `verification.kycBridge.subtitle` | Verificação hospedada | Hosted verification |
| `verification.kycBridge.verifyCta` | Verificar identidade | Verify identity |
| `verification.kycBridge.continueCta` | Continuar verificação | Continue verification |
| `verification.kycBridge.lead` | Faça a verificação com nosso parceiro de verificação. Aceitamos passaportes russos e estrangeiros; a checagem é feita na página segura dele, não na Ciuna. | Verify with our verification partner. Russian and foreign passports are supported; the check happens on their secure page, not in Ciuna. |
| `verification.kycBridge.linkExpires` | O link de verificação expira às {{time}} (cerca de uma hora). | Verification link expires at {{time}} (about one hour). |
| `verification.kycBridge.reviewPending` | Verificação em andamento ou em análise. Liberaremos o envio quando for confirmada. | Verification in progress or under review. We will unlock Send when it is confirmed. |
| `verification.kycBridge.successBody` | Você pode enviar dinheiro por SBP. Volte à sua transferência para continuar. | You can send money with SBP. Return to your transfer to continue. |
| `verification.bitbanker.pageTitle` | Verificar identidade | Verify identity |
| `verification.bitbanker.intro` | Abra a página segura do nosso parceiro de verificação para poder enviar. Aceitamos passaportes russos e estrangeiros. | Open our verification partner's secure page to verify for Send. Russian and foreign passports are supported. |
| `verification.bitbanker.verifiedTitle` | Você está verificado para enviar | You are verified for send |
| `verification.bitbanker.refreshStatus` | Atualizar status | Refresh status |
| `verification.bitbanker.checkAgain` | Verificar novamente | Check again |
| `verification.bitbanker.goToSend` | Ir para Enviar | Go to Send |
| `verification.bitbanker.statusLabel` | Status | Status |
| `verification.bitbanker.submitting` | Enviando… | Submitting… |
| `verification.bitbanker.submit` | Enviar verificação | Submit verification |
| `verification.bitbanker.consent` | Autorizo a verificação de identidade para pagamentos via SBP e o compartilhamento, pela Ciuna, dos dados acima com o parceiro de pagamentos. | I consent to identity verification for SBP payments and to Ciuna sharing the data above with the payment partner. |
| `verification.bitbanker.passportCountry` | País emissor do passaporte | Passport issuing country |
| `verification.bitbanker.passportCountryHint` | Código ISO, ex.: RU para passaporte da Federação Russa | ISO code, e.g. RU for Russian Federation passport |
| `verification.bitbanker.firstNameCyrillic` | Nome (em cirílico) | First name (Cyrillic) |
| `verification.bitbanker.lastNameCyrillic` | Sobrenome (em cirílico) | Last name (Cyrillic) |
| `verification.bitbanker.patronymic` | Patronímico (em cirílico) | Patronymic (Cyrillic) |
| `verification.bitbanker.firstNameNative` | Nome (como no passaporte) | First name (as in passport) |
| `verification.bitbanker.lastNameNative` | Sobrenome (como no passaporte) | Last name (as in passport) |
| `verification.bitbanker.email` | E-mail | Email |
| `verification.bitbanker.phone` | Celular | Mobile phone |
| `verification.bitbanker.phoneHint` | Formato +71234567890 | Format +71234567890 |
| `verification.bitbanker.birthDate` | Data de nascimento | Date of birth |
| `verification.bitbanker.passportIssueDate` | Data de emissão do passaporte | Passport issue date |
| `verification.bitbanker.dateHint` | Use o seletor de data ou DD.MM.AAAA | Use the date picker or DD.MM.YYYY |
| `verification.bitbanker.passportNumber` | Série e número do passaporte | Passport series and number |
| `verification.bitbanker.passportNumberHint` | Sem espaços (ex.: 4010123456) | No spaces (e.g. 4010123456) |
| `verification.bitbanker.registrationSection` | Endereço de registro na Rússia | Registration address in Russia |
| `verification.bitbanker.registrationCountry` | País (ISO de 3 letras) | Country (ISO 3 letters) |
| `verification.bitbanker.registrationCity` | Cidade | City |
| `verification.bitbanker.registrationStreet` | Rua | Street |
| `verification.bitbanker.registrationHouse` | Casa / prédio | House / building |
| `verification.bitbanker.registrationIndex` | Código postal (opcional) | Postal code (optional) |
| `verification.bitbanker.foreignBranchNote` | Passaporte não russo: informe os nomes como constam no documento e seu endereço de registro na Rússia. | Non-Russian passport: enter names as in the document and your registration address in Russia. |
| `verification.bitbanker.errors.consent_required` | O consentimento é obrigatório. | Consent is required. |
| `verification.bitbanker.errors.email_required` | O e-mail é obrigatório. | Email is required. |
| `verification.bitbanker.errors.email_invalid` | Digite um endereço de e-mail válido. | Enter a valid email address. |
| `verification.bitbanker.errors.phone_required` | O número de telefone é obrigatório. | Phone number is required. |
| `verification.bitbanker.errors.phone_invalid` | Use o formato +71234567890. | Use format +71234567890. |
| `verification.bitbanker.errors.passport_country_required` | O país do passaporte é obrigatório. | Passport country is required. |
| `verification.bitbanker.errors.passport_country_invalid` | Use um código de país válido (ex.: RU). | Use a valid country code (e.g. RU). |
| `verification.bitbanker.errors.first_name_required` | O nome é obrigatório. | First name is required. |
| `verification.bitbanker.errors.last_name_required` | O sobrenome é obrigatório. | Last name is required. |
| `verification.bitbanker.errors.patronymic_required` | O patronímico é obrigatório para passaportes russos. | Patronymic is required for Russian passports. |
| `verification.bitbanker.errors.first_name_native_required` | O nome (como no passaporte) é obrigatório. | First name (as in passport) is required. |
| `verification.bitbanker.errors.last_name_native_required` | O sobrenome (como no passaporte) é obrigatório. | Last name (as in passport) is required. |
| `verification.bitbanker.errors.birth_date_required` | A data de nascimento é obrigatória. | Date of birth is required. |
| `verification.bitbanker.errors.birth_date_invalid` | Use DD.MM.AAAA ou o seletor de data. | Use DD.MM.YYYY or the date picker. |
| `verification.bitbanker.errors.birth_date_future` | A data de nascimento não pode ser futura. | Date of birth cannot be in the future. |
| `verification.bitbanker.errors.passport_issue_date_required` | A data de emissão do passaporte é obrigatória. | Passport issue date is required. |
| `verification.bitbanker.errors.passport_issue_date_invalid` | Use DD.MM.AAAA ou o seletor de data. | Use DD.MM.YYYY or the date picker. |
| `verification.bitbanker.errors.passport_issue_date_future` | A data de emissão não pode ser futura. | Issue date cannot be in the future. |
| `verification.bitbanker.errors.passport_issue_before_birth` | A data de emissão deve ser posterior à data de nascimento. | Issue date must be after date of birth. |
| `verification.bitbanker.errors.passport_number_required` | O número do passaporte é obrigatório. | Passport number is required. |
| `verification.bitbanker.errors.passport_number_invalid` | Digite a série e o número sem espaços (6 a 20 caracteres). | Enter series and number without spaces (6–20 characters). |
| `verification.bitbanker.errors.registration_country_required` | O país de registro é obrigatório. | Registration country is required. |
| `verification.bitbanker.errors.registration_country_invalid` | Use um código de país de 3 letras (ex.: RUS). | Use a 3-letter country code (e.g. RUS). |
| `verification.bitbanker.errors.registration_city_required` | A cidade de registro é obrigatória. | Registration city is required. |
| `verification.bitbanker.errors.registration_street_required` | A rua de registro é obrigatória. | Registration street is required. |
| `verification.bitbanker.errors.registration_house_required` | A casa / prédio é obrigatório. | House / building is required. |
| `verification.bitbanker.errors.cyrillic_required` | Use letras cirílicas para os nomes em passaportes russos. | Use Cyrillic letters for Russian passport names. |
| `verification.bitbanker.errors.validation_failed` | Corrija os campos destacados. | Please fix the highlighted fields. |
| `verification.bitbanker.errors.submit_failed` | Não foi possível enviar a verificação. Tente novamente mais tarde. | Verification could not be submitted. Try again later. |
| `auth.welcomeBack` | Bem-vindo de volta | Welcome back |
| `auth.signInGoogle` | Entrar com Google | Sign in with Google |
| `auth.signInApple` | Entrar com Apple | Sign in with Apple |
| `auth.signUpApple` | Cadastrar-se com Apple | Sign up with Apple |
| `auth.or` | Ou | Or |
| `auth.email` | E-mail | Email |
| `auth.emailPlaceholder` | voce@exemplo.com | you@example.com |
| `auth.password` | Senha | Password |
| `auth.passwordPlaceholder` | Digite sua senha | Enter your password |
| `auth.rememberMe` | Lembrar de mim | Remember me |
| `auth.forgotPassword` | Esqueceu a senha? | Forgot password? |
| `auth.signingIn` | Entrando... | Signing In... |
| `auth.signIn` | Entrar | Sign in |
| `auth.noAccount` | Não tem uma conta? | Don't have an account? |
| `auth.signUp` | Cadastre-se | Sign up |
| `auth.loginError` | Ocorreu um erro ao entrar | An error occurred during login |
| `auth.registerError` | Ocorreu um erro durante o cadastro | An error occurred during registration |
| `auth.passwordValidationFailed` | Falha na validação da senha | Password validation failed |
| `auth.createAccountTitle` | Criar uma conta | Create an Account |
| `auth.termsPrefix` | Ao criar uma conta, você concorda com nossos | By creating an account you agree to our |
| `auth.termsLink` | Termos | Terms |
| `auth.signUpGoogle` | Cadastrar-se com Google | Sign up with Google |
| `auth.fullName` | Nome completo | Full name |
| `auth.fullNamePlaceholder` | Maria Silva | Jane Doe |
| `auth.firstNameRequired` | Nome * | First Name * |
| `auth.lastNameRequired` | Sobrenome * | Last Name * |
| `auth.firstNamePlaceholder` | Nome | First name |
| `auth.lastNamePlaceholder` | Sobrenome | Last name |
| `auth.emailRequired` | E-mail * | Email * |
| `auth.enterEmail` | Digite seu e-mail | Enter your email |
| `auth.passwordRequired` | Senha * | Password * |
| `auth.createPasswordPlaceholder` | Crie uma senha | Create a password |
| `auth.creatingAccount` | Criando conta... | Creating Account... |
| `auth.createAccount` | Criar conta | Create Account |
| `auth.alreadyHaveAccount` | Já tem uma conta? | Already have an account? |
| `auth.signInLink` | Entrar | Sign In |
| `auth.registrationDisabled` | Novos cadastros estão desativados no momento. Entre se você já tiver uma conta. | New registrations are currently disabled. Please sign in if you already have an account. |
| `auth.registrationClosedBanner` | O cadastro público está encerrado. | Public registration is closed. |
| `auth.accountTemporarilyLocked` | A conta está temporariamente bloqueada. Tente novamente em {{minutes}} minutos. | Account is temporarily locked. Please try again in {{minutes}} minutes. |
| `auth.registerSuccessTitle` | Conta criada com sucesso | Account Created Successfully! |
| `auth.registerSuccessBody` | Bem-vindo à Ciuna! Confira seu e-mail para verificar sua conta. | Welcome to Ciuna! Please check your email to verify your account. |
| `auth.registerSuccessHint` | Depois da verificação, você poderá entrar e começar a enviar dinheiro. | After verification, you can sign in to start sending money. |
| `auth.redirectingLogin` | Redirecionando para o login... | Redirecting to login... |
| `auth.forgotPasswordTitle` | Esqueci a senha | Forgot Password |
| `auth.enterCodeTitle` | Digite o código de verificação | Enter Verification Code |
| `auth.forgotEmailDesc` | Digite seu e-mail para receber o código de verificação | Enter your email for verification code |
| `auth.codeSentTo` | Enviamos um código de 6 dígitos para {{email}} | We've sent a 6-digit code to {{email}} |
| `auth.emailAddress` | Endereço de e-mail | Email Address |
| `auth.enterEmailAddress` | Digite seu endereço de e-mail | Enter your email address |
| `auth.sendVerificationCode` | Enviar código de verificação | Send Verification Code |
| `auth.sending` | Enviando... | Sending... |
| `auth.enterSixDigit` | Digite o código de 6 dígitos | Enter 6-digit code |
| `auth.verifying` | Verificando... | Verifying... |
| `auth.verifyCode` | Verificar código | Verify Code |
| `auth.resendIn` | Reenviar código em {{seconds}}s | Resend code in {{seconds}}s |
| `auth.resendCode` | Reenviar código | Resend code |
| `auth.changeEmail` | Alterar e-mail | Change Email |
| `auth.backToSignIn` | Voltar para entrar | Back to Sign In |
| `auth.noAccountForgot` | Não tem uma conta? | Don't have an account? |
| `auth.codeSentToast` | Enviamos um código de 6 dígitos para o seu e-mail. | We've sent a 6-digit code to your email address. |
| `auth.newCodeSent` | Novo código enviado para o seu e-mail. | New code sent to your email address. |
| `auth.enterAllDigits` | Digite os 6 dígitos | Please enter all 6 digits |
| `auth.genericError` | Ocorreu um erro. Tente novamente. | An error occurred. Please try again. |
| `auth.invalidOtp` | Código inválido. Tente novamente. | Invalid code. Please try again. |
| `auth.resendFailed` | Falha ao reenviar o código. Tente novamente. | Failed to resend code. Please try again. |
| `auth.apiError` | Ocorreu um erro | An error occurred |
| `auth.resetPasswordTitle` | Redefinir senha | Reset Password |
| `auth.resetPasswordDesc` | Digite sua nova senha abaixo | Enter your new password below |
| `auth.newPassword` | Nova senha | New Password |
| `auth.newPasswordPlaceholder` | Digite a nova senha | Enter new password |
| `auth.confirmPassword` | Confirmar senha | Confirm password |
| `auth.confirmPasswordPlaceholder` | Confirme a nova senha | Confirm new password |
| `auth.passwordMismatch` | As senhas não coincidem | Passwords do not match |
| `auth.updatePassword` | Atualizar senha | Update password |
| `auth.resetting` | Redefinindo... | Resetting... |
| `auth.resetPasswordFailed` | Falha ao redefinir a senha | Failed to reset password |
| `auth.invalidResetLink` | Link de redefinição inválido ou expirado. Solicite uma nova redefinição de senha. | Invalid or expired reset link. Please request a new password reset. |
| `auth.resetSuccessRedirect` | Senha redefinida com sucesso. Entre com sua nova senha. | Password reset successful. Please sign in with your new password. |
| `auth.callbackCancelled` | O login foi cancelado | Sign in was cancelled |
| `auth.callbackFailedSignIn` | Falha ao concluir o login | Failed to complete sign in |
| `auth.callbackRedirectLogin` | Redirecionando para o login... | Redirecting to login... |
| `auth.fillAllFields` | Preencha todos os campos | Please fill in all fields |
| `auth.passwordMinLength` | A senha deve ter pelo menos 6 caracteres | Password must be at least 6 characters long |
| `auth.helpToast` | Precisa de ajuda? Fale com o suporte em {{email}} | Need assistance? Contact support at {{email}} |
| `referralLanding.redirecting` | Redirecionando… | Redirecting… |
| `referralLanding.invalidLink` | Este link de indicação é inválido ou expirou. | This referral link is invalid or expired. |
| `pwa.title` | Aplicativo Ciuna | Ciuna App |
| `pwa.subtitle` | Use nosso aplicativo em qualquer lugar, sem navegador | Use our app on the go without browser |
| `pwa.install` | Instalar | Install |
| `pwa.dismiss` | Dispensar | Dismiss |
| `pwa.iosChromeShort` | {{share}} → {{viewMore}} → {{addHome}} | {{share}} → {{viewMore}} → {{addHome}} |
| `pwa.iosChromeLong` | Toque em Compartilhar, depois em Ver mais e em {{addHome}} | Tap Share, then View more, then {{addHome}} |
| `pwa.iosSafariShort` | {{menu}} → {{share}} → {{viewMore}} → {{addHome}} | {{menu}} → {{share}} → {{viewMore}} → {{addHome}} |
| `pwa.iosSafariLong` | Toque no menu (três pontos), depois em Compartilhar, Ver mais e {{addHome}} | Tap the menu (three dots), then Share, then View more, then {{addHome}} |
| `pwa.share` | Compartilhar | Share |
| `pwa.viewMore` | Ver mais | View more |
| `pwa.addHome` | Adicionar à Tela de Início | Add to Home Screen |
| `pwa.menu` | Menu | Menu |
| `errors.generic` | Algo deu errado. Tente novamente. | Something went wrong. Please try again. |
| `errors.loadFailed` | Não foi possível carregar os dados. Tente novamente. | Could not load data. Please try again. |
| `marketplace.checkout` | Finalizar compra | Checkout |
| `marketplace.amount` | Valor | Amount |
| `marketplace.loading` | Carregando… | Loading… |
| `marketplace.retryError` | Não foi possível concluir esta etapa. Tente novamente. | We could not complete that step. Please try again. |
| `marketplace.resume` | Retomar pedido | Resume order |
| `marketplace.placeOrder` | Fazer pedido | Place order |
| `marketplace.total` | Total a pagar | Total to pay |
| `marketplace.serviceFee` | Taxa de serviço | Service fee |
| `marketplace.deliveryFee` | Taxa de entrega | Delivery fee |
| `marketplace.conversionFee` | Taxa de conversão | Conversion fee |
| `marketplace.fulfillment` | Como você recebe | How you get it |
| `marketplace.delivery` | Entrega | Delivery |
| `marketplace.pickup` | Retirada | Pickup |
| `marketplace.digital` | Digital | Digital |
| `marketplace.online_appointment` | Atendimento online | Online appointment |
| `marketplace.in_person_appointment` | Atendimento presencial | In-person appointment |
| `marketplace.usuallyWithin` | Normalmente em até {{duration}} | Usually within {{duration}} |
| `marketplace.fulfillmentNotes` | Observações | Notes |
| `marketplace.pickupLocation` | Local de retirada | Pickup location |
| `marketplace.pickupHours` | Horário de retirada | Pickup hours |
| `marketplace.deliveryDetails` | Detalhes da entrega | Delivery details |
| `marketplace.pickupDetails` | Detalhes da retirada | Pickup details |
| `marketplace.contactDetails` | Seus dados | Your details |
| `marketplace.zone` | Área de entrega | Delivery area |
| `marketplace.choose` | Escolha uma opção | Choose an option |
| `marketplace.chooseZone` | Escolha uma área de entrega | Choose a delivery area |
| `marketplace.noZones` | A entrega ainda não está disponível para esta loja. | Delivery is not available for this store yet. |
| `marketplace.address` | Endereço de entrega | Delivery address |
| `marketplace.name` | Nome completo | Full name |
| `marketplace.phone` | Telefone | Phone |
| `marketplace.optional` | Opcional | Optional |
| `marketplace.digitalAccessNote` | Os detalhes de acesso e da compra ficarão disponíveis no seu pedido após o pagamento. | Access and purchase details will be available on your order after payment. |
| `marketplace.receiptEmail` | Comprovantes e atualizações são enviados ao e-mail da sua conta. | Receipts and updates go to your account email. |
| `marketplace.note` | Observação do pedido | Order note |
| `marketplace.otherCurrency` | Pagar em outra moeda | Pay in another currency |
| `marketplace.payWith` | Pagar com | Pay with |
| `marketplace.pay` | Pagar | Pay |
| `marketplace.ivePaid` | Já paguei | I've paid |
| `marketplace.payOnline` | Pagar online | Pay online |
| `marketplace.payManual` | Transferência bancária | Bank transfer |
| `marketplace.onlinePayHint` | Conclua o pagamento por cartão ou SBP abaixo. | Complete payment by card or SBP below. |
| `marketplace.onlinePayFrame` | Preparando pagamento seguro… | Preparing secure payment… |
| `marketplace.preparingPay` | Preparando pagamento seguro… | Preparing secure payment… |
| `marketplace.noManualMethods` | Ainda não há formas de transferência bancária disponíveis para esta moeda. | No bank transfer methods are available for this currency yet. |
| `marketplace.completeDetails` | Preencha os dados acima para continuar. | Complete the details above to continue. |
| `marketplace.uploadReceipt` | Enviar comprovante de pagamento | Upload payment receipt |
| `marketplace.fileTypesHint` | JPG, PNG ou PDF (máx. 10 MB) | JPG, PNG or PDF (max 10 MB) |
| `marketplace.uploadTypeError` | Use um arquivo JPG, PNG ou PDF. | Use a JPG, PNG, or PDF file. |
| `marketplace.uploadSizeError` | O arquivo deve ter no máximo 10 MB. | File must be 10 MB or smaller. |
| `marketplace.copy` | Copiar | Copy |
| `marketplace.online` | Pagar online | Pay online |
| `marketplace.unavailable` | Escolha as opções obrigatórias. A finalização da compra pode ainda não estar disponível para esta oferta. | Choose the required options. Checkout may not yet be available for this offering. |
| `marketplace.emptyCart` | Seu carrinho está vazio. Os pedidos existentes estão em Transações. | Your cart is empty. Existing orders are in Transactions. |
| `marketplace.noSlots` | Nenhum atendimento futuro | No upcoming appointments |
| `marketplace.payment` | Pagamento | Payment |
| `marketplace.awaiting_payment` | Aguardando pagamento | Awaiting payment |
| `marketplace.processing` | Verificando pagamento | Checking payment |
| `marketplace.paid` | Pago | Paid |
| `marketplace.expired` | Prazo de pagamento expirado | Payment deadline passed |
| `marketplace.refund_pending` | Reembolso pendente | Refund pending |
| `marketplace.refunded` | Reembolsado | Refunded |
| `marketplace.awaiting_acceptance` | Aguardando aceitação | Awaiting acceptance |
| `marketplace.accepted` | Aceito | Accepted |
| `marketplace.in_progress` | Em andamento | In progress |
| `marketplace.fulfilled` | Concluído | Fulfilled |
| `marketplace.cancelled` | Cancelado | Cancelled |
| `marketplace.review` | O Office está analisando este pedido. Entre em contato com o suporte se precisar de ajuda. | Office is reviewing this order. Contact support if you need help. |
| `marketplace.deadline` | Pagar até | Pay by |
| `marketplace.instructions` | Instruções de pagamento | Payment instructions |
| `marketplace.reference` | Referência do pagamento | Payment reference |
| `marketplace.proof` | Enviar comprovante de pagamento | Upload payment proof |
| `marketplace.proof_submitted` | Comprovante enviado para análise | Proof submitted for review |
| `marketplace.digitalDelivery` | Sua compra digital | Your digital purchase |
| `marketplace.updated` | Pedido atualizado | Order updated |
| `marketplace.cancel` | Cancelar pedido | Cancel order |
| `marketplace.support` | Falar com o suporte | Contact support |
| `marketplace.errors.PRICE_CHANGED` | Os preços ou as opções mudaram. Revise o total atualizado e confirme novamente. | Prices or options changed. Review the refreshed total and confirm again. |
| `marketplace.errors.QUOTE_EXPIRED` | Seu orçamento expirou. Revise o total atualizado. | Your quote expired. Review the refreshed total. |
| `marketplace.errors.OUT_OF_STOCK` | A quantidade solicitada não está disponível. Atualize seu carrinho. | The requested quantity is unavailable. Update your cart. |
| `marketplace.errors.SLOT_UNAVAILABLE` | Este horário não está mais disponível. Escolha outro horário. | This appointment is no longer available. Choose another time. |
| `marketplace.errors.PAYMENT_UNRESOLVED` | Estamos verificando seu pagamento. Não pague novamente. | We are checking your payment. Please do not pay again. |
| `marketplace.errors.DELIVERY_UNAVAILABLE` | A entrega não está disponível para a área selecionada. | Delivery is unavailable for the selected area. |
| `marketplace.errors.NATIVE_BUILD_REQUIRED` | O pagamento online exige a versão de desenvolvimento ou da loja de aplicativos instalada. | Online payment requires the installed development or store build. |
| `marketplace.errors.CONTACT_NAME_REQUIRED` | Digite seu nome completo. | Enter your full name. |
| `marketplace.errors.CONTACT_PHONE_REQUIRED` | Digite um telefone para o atendimento. | Enter a phone number for fulfillment. |
| `marketplace.errors.AMOUNT_REQUIRED` | Digite um valor dentro dos limites do produto. | Enter an amount within the product’s limits. |
| `marketplace.errors.CONTACT_SUPPORT` | Entre em contato com o suporte para alterar um pedido aceito. | Contact support to change an accepted order. |
| `marketplace.errors.CHECKOUT_UNAVAILABLE` | A finalização da compra ainda não está disponível. | Checkout is not available yet. |
| `marketplace.events.created` | Aguardando pagamento | Awaiting payment |
| `marketplace.events.paid` | Pago | Paid |
| `marketplace.events.unknown` | Verificando pagamento | Checking payment |
| `marketplace.events.failed` | Não foi possível concluir esta etapa. Tente novamente. | We could not complete that step. Please try again. |
| `marketplace.events.pending` | Aguardando pagamento | Awaiting payment |
| `marketplace.events.proof` | Comprovante enviado para análise | Proof submitted for review |
| `marketplace.events.expire` | Prazo de pagamento expirado | Payment deadline passed |
| `marketplace.events.cancel` | Cancelado | Cancelled |
| `marketplace.events.accept` | Aceito | Accepted |
| `marketplace.events.start` | Em andamento | In progress |
| `marketplace.events.fulfill` | Concluído | Fulfilled |
| `marketplace.events.refund` | Reembolsado | Refunded |
| `marketplace.events.reacquire` | Pedido atualizado | Order updated |
| `marketplace.events.payment_method` | Pedido atualizado | Order updated |
| `marketplace.resumeNative` | Continuar o pagamento no aplicativo Ciuna | Continue payment in the Ciuna app |
| `marketplace.newPurchase` | Fazer outra compra | Make another purchase |
| `marketplace.backToShopping` | Voltar às compras | Back to shopping |
| `marketplace.orderCancelled` | Pedido cancelado | Order cancelled |
| `social.loadFailed` | Não foi possível carregar, tente novamente | Couldn't load, try again |
| `social.retry` | Tentar novamente | Try again |
| `search.all` | Tudo | All |
| `search.back` | Voltar | Back |
| `search.clear` | Limpar | Clear |
| `search.clearRecent` | Limpar | Clear |
| `search.empty` | Pesquise produtos, lojas e especialistas. | Search for products, stores and experts. |
| `search.experts` | Especialistas | Experts |
| `search.minHint` | Digite pelo menos 2 caracteres. | Type at least 2 characters. |
| `search.noResultsBody` | Verifique a ortografia ou tente uma palavra mais curta. | Check the spelling or try a shorter word. |
| `search.noResultsTitle` | Nenhum resultado para “{{q}}” | No results for “{{q}}” |
| `search.openAria` | Pesquisar | Search |
| `search.placeholder` | Pesquisar produtos, lojas, especialistas | Search products, stores, experts |
| `search.placeholderExperts` | Pesquisar especialistas | Search experts |
| `search.placeholderFood` | Pesquisar em Comida | Search Food |
| `search.placeholderMart` | Pesquisar em Mercado | Search Mart |
| `search.products` | Produtos | Products |
| `search.rateLimited` | Pesquisas demais. Tente novamente em um minuto. | Too many searches. Try again in a minute. |
| `search.recent` | Pesquisas recentes | Recent searches |
| `search.searchAll` | Pesquisar em tudo | Search everywhere |
| `search.stores` | Lojas | Stores |
| `favourites.title` | Favoritos | Favourites |
| `favourites.stores` | Lojas | Stores |
| `favourites.products` | Produtos | Products |
| `favourites.experts` | Especialistas | Experts |
| `favourites.addAria` | Adicionar aos favoritos | Add to favourites |
| `favourites.removeAria` | Remover dos favoritos | Remove from favourites |
| `favourites.removed` | Removido dos favoritos | Removed from favourites |
| `favourites.undo` | Desfazer | Undo |
| `favourites.saveFailed` | Não foi possível atualizar os favoritos. Tente novamente. | Couldn't update favourites. Try again. |
| `favourites.emptyStores` | Nenhuma loja favorita ainda. Toque no coração de uma loja para salvá-la aqui. | No favourite stores yet. Tap the heart on a store to save it here. |
| `favourites.emptyProducts` | Nenhum produto favorito ainda. Toque no coração de um produto para salvá-lo aqui. | No favourite products yet. Tap the heart on a product to save it here. |
| `favourites.emptyExperts` | Nenhum especialista favorito ainda. Toque no coração de um especialista para salvá-lo aqui. | No favourite experts yet. Tap the heart on an expert to save them here. |
| `favourites.browseFood` | Ver Comida | Browse Food |
| `favourites.browseMart` | Ver Mercado | Browse Mart |
| `favourites.browseExperts` | Ver especialistas | Browse experts |
| `favourites.signedOutTitle` | Entre para ver seus favoritos | Sign in to see your favourites |
| `favourites.signedOutBody` | Seus favoritos acompanham sua conta em todos os dispositivos. | Your favourites follow your account across devices. |
| `favourites.signIn` | Entrar | Sign in |
| `chat.title` | Conversa com o vendedor | Chat with seller |
| `chat.messageSeller` | Enviar mensagem ao vendedor | Message seller |
| `chat.messageSellerHint` | Pergunte sobre o seu pedido | Ask about your order |
| `chat.unreadAria` | Novas mensagens | New messages |
| `chat.loading` | Carregando mensagens | Loading messages |
| `chat.empty` | Faça uma pergunta ao vendedor sobre o seu pedido. | Ask the seller a question about your order. |
| `chat.notAvailableTitle` | O chat abre depois que o pedido for pago | Chat opens once your order is paid |
| `chat.notAvailableBody` | Você poderá enviar mensagens ao vendedor assim que o pagamento for confirmado. | You can message the seller as soon as your payment is confirmed. |
| `chat.closed` | Este chat está fechado. Você ainda pode ler a conversa. | This chat is closed. You can still read the conversation. |
| `chat.rateLimited` | Você está enviando mensagens rápido demais. Aguarde um instante, sua mensagem foi mantida. | You are sending messages too fast. Wait a moment, your message is kept. |
| `chat.notSent` | Não enviada | Not sent |
| `chat.retry` | Tentar de novo | Retry |
| `chat.send` | Enviar | Send |
| `chat.placeholder` | Escreva uma mensagem | Write a message |
| `chat.counter` | {{n}} / {{max}} | {{n}} / {{max}} |
| `chat.cardHint` | Não compartilhe números de cartão nem dados de pagamento aqui. | Please don't share card numbers or payment details here. |
| `chat.orderStrip` | Pedido {{id}} | Order {{id}} |
| `chat.today` | Hoje | Today |
| `chat.yesterday` | Ontem | Yesterday |
| `chat.seen` | Visto {{time}} | Seen {{time}} |
| `chat.unavailable` | As mensagens não estão disponíveis no momento | Messaging isn't available right now |
| `chat.unavailableBody` | Tente novamente mais tarde. | Please try again later. |
| `chat.closedOn` | Chat encerrado em {{date}}. Você ainda pode ler a conversa. | Chat closed on {{date}}. You can still read the conversation. |
| `reviews.promptTitle` | Avalie o seu pedido | Rate your order |
| `reviews.promptTitleSession` | Avalie a sua sessão | Rate your session |
| `reviews.promptHint` | Como foi? Sua avaliação ajuda outros clientes. | How was it? Your rating helps other customers. |
| `reviews.rate` | Avaliar | Rate |
| `reviews.edit` | Editar | Edit |
| `reviews.view` | Ver | View |
| `reviews.yourReview` | Sua avaliação | Your review |
| `reviews.sheetTitle` | Avalie o seu pedido | Rate your order |
| `reviews.sheetTitleSession` | Avalie a sua sessão | Rate your session |
| `reviews.editTitle` | Editar sua avaliação | Edit your review |
| `reviews.lockedTitle` | Sua avaliação | Your review |
| `reviews.star1` | Ruim | Poor |
| `reviews.star2` | Regular | Fair |
| `reviews.star3` | Bom | Good |
| `reviews.star4` | Muito bom | Very good |
| `reviews.star5` | Excelente | Excellent |
| `reviews.starsAria` | {{n}} de 5 estrelas | {{n}} of 5 stars |
| `reviews.bodyPlaceholder` | Conte aos outros o que achou (opcional) | Tell others what you thought (optional) |
| `reviews.notice` | Exibida apenas com o seu primeiro nome: {{name}} | Shown with your first name only: {{name}} |
| `reviews.noticeNoName` | Exibida apenas com o seu primeiro nome. | Shown with your first name only. |
| `reviews.editUntil` | Você pode editar esta avaliação até {{date}}. | You can edit this review until {{date}}. |
| `reviews.lockedNote` | As avaliações podem ser editadas por 48 horas. Esta já está bloqueada. | Reviews can be edited for 48 hours. This one is now locked. |
| `reviews.submit` | Enviar avaliação | Submit review |
| `reviews.save` | Salvar alterações | Save changes |
| `reviews.cancel` | Cancelar | Cancel |
| `reviews.close` | Fechar | Close |
| `reviews.thanks` | Obrigado, sua avaliação foi publicada | Thanks, your review is posted |
| `reviews.updated` | Sua avaliação foi atualizada | Your review is updated |
| `reviews.postFailed` | Não foi possível publicar sua avaliação. Tente novamente. | Couldn't post your review. Try again. |
| `reviews.rateLimited` | Tentativas demais. Tente novamente em um minuto. | Too many attempts. Try again in a minute. |
| `reviews.windowClosed` | O prazo para avaliar este pedido terminou. | The review period for this order has ended. |
| `reviews.sectionTitle` | Avaliações | Reviews |
| `reviews.none` | Ainda não há avaliações. | No reviews yet. |
| `reviews.showMore` | Mostrar mais avaliações | Show more reviews |
| `reviews.sellerReply` | Resposta do vendedor | Reply from the seller |
| `reviews.anonymous` | Cliente | Customer |
| `reviews.count_one` | {{count}} avaliação | {{count}} review |
| `reviews.count_other` | {{count}} avaliações | {{count}} reviews |

### `packages/shared/src/locales/pt/common.json` (76 strings)

| Key | Text | English source |
| --- | --- | --- |
| `nav.home` | Início | Home |
| `nav.sendMoney` | Enviar dinheiro | Send Money |
| `nav.send` | Enviar | Send |
| `nav.hub` | Início | Home |
| `nav.recipients` | Destinatários | Recipients |
| `nav.transactions` | Atividades | Activities |
| `nav.more` | Mais | More |
| `nav.logout` | Sair | Logout |
| `nav.login` | Entrar | Log in |
| `more.title` | Mais | More |
| `more.open` | Abrir | Open |
| `more.account` | Conta | Account |
| `more.yourProfile` | Seu perfil | Your Profile |
| `more.accountVerification` | Verificação de identidade | Account Verification |
| `more.affiliatesReferrals` | Afiliados e indicações | Affiliates & Referrals |
| `more.loginPin` | PIN de acesso | Login PIN |
| `more.app` | Aplicativo | App |
| `more.recipients` | Destinatários | Recipients |
| `more.support` | Suporte | Support |
| `more.privacyPolicy` | Política de Privacidade | Privacy Policy |
| `more.termsOfService` | Termos de Serviço | Terms of Service |
| `more.version` | Versão {{version}} | Version {{version}} |
| `more.logout` | Sair | Logout |
| `more.signOutTitle` | Sair da conta | Sign Out |
| `more.signOutDescription` | Tem certeza de que deseja sair? Você precisará entrar novamente para acessar sua conta. | Are you sure you want to sign out? You'll need to sign in again to access your account. |
| `more.cancel` | Cancelar | Cancel |
| `more.signOut` | Sair | Sign Out |
| `more.signingOut` | Saindo... | Signing out... |
| `kyc.verified` | Verificada | Verified |
| `kyc.inReview` | Em análise | In review |
| `kyc.rejected` | Recusada | Rejected |
| `kyc.pending` | Pendente | Pending |
| `kyc.takeAction` | Agir agora | Take action |
| `languages.en` | Inglês | English |
| `languages.ru` | Russo | Russian |
| `languages.fr` | Francês | French |
| `languages.es` | Espanhol | Spanish |
| `languages.zh` | Chinês | Chinese |
| `languages.pt` | Português | Portuguese |
| `app.language` | Idioma | Language |
| `pinSetup.createTitle` | Crie o PIN do aplicativo | Create your app PIN |
| `pinSetup.createSubtitle` | Digite seu PIN de 4 dígitos | Enter your 4-digit PIN |
| `pinSetup.confirmTitle` | Confirme seu PIN | Confirm your PIN |
| `pinSetup.confirmSubtitle` | Digite o mesmo PIN novamente | Enter the same PIN again |
| `pinSetup.benefitLine` | Use-o para acessar rapidamente quando voltar. Se sair da conta por completo, você ainda usará sua senha. | Use it for quick access when you return. You’ll still use your password if you sign out fully. |
| `pinSetup.mismatch` | Os PINs não coincidem. Tente novamente. | PINs don’t match. Try again. |
| `pinSetup.saving` | Salvando… | Saving… |
| `pinDialog.createTitle` | Criar PIN | Create PIN |
| `pinDialog.changeTitle` | Alterar PIN | Change PIN |
| `pinDialog.createDescription` | Escolha um PIN de 4 dígitos para acessar rapidamente quando abrir o aplicativo de novo. Após o bloqueio por inatividade, digite o PIN em vez da senha. Se você sair da conta, ainda entrará com a senha. | Choose a 4-digit PIN for quick access when you open the app again. After idle lock, enter your PIN instead of your password. You’ll still sign in with your password if you log out. |
| `pinDialog.changeDescription` | Digite seu PIN atual e depois escolha um novo PIN de 4 dígitos. | Enter your current PIN, then choose a new 4-digit PIN. |
| `pinDialog.currentPin` | PIN atual | Current PIN |
| `pinDialog.pin` | PIN | PIN |
| `pinDialog.newPin` | Novo PIN | New PIN |
| `pinDialog.confirmPin` | Confirmar PIN | Confirm PIN |
| `pinDialog.cancel` | Cancelar | Cancel |
| `pinDialog.save` | Salvar | Save |
| `pinDialog.saving` | Salvando… | Saving… |
| `pinDialog.errorBothFields` | Digite um PIN de 4 dígitos nos dois campos. | Enter a 4-digit PIN in both fields. |
| `pinDialog.errorPinsNoMatch` | Os PINs não coincidem. | PINs do not match. |
| `pinDialog.errorSave` | Não foi possível salvar o PIN. | Could not save PIN. |
| `pinDialog.errorCurrentRequired` | Digite seu PIN atual de 4 dígitos. | Enter your current 4-digit PIN. |
| `pinDialog.errorNewBothFields` | Digite um novo PIN de 4 dígitos nos dois campos. | Enter a new 4-digit PIN in both fields. |
| `pinDialog.errorNewNoMatch` | Os novos PINs não coincidem. | New PINs do not match. |
| `pinDialog.errorNewSameAsOld` | O novo PIN deve ser diferente do PIN atual. | New PIN must be different from your current PIN. |
| `pinDialog.errorWrongCurrent` | O PIN atual está incorreto. | Current PIN is incorrect. |
| `pinDialog.errorUpdate` | Não foi possível atualizar o PIN. | Could not update PIN. |
| `pinLock.welcomeBack` | Bem-vindo de volta | Welcome back |
| `pinLock.enterPin` | Digite seu PIN de 4 dígitos | Enter your 4-digit PIN |
| `pinLock.incorrectPin` | PIN incorreto | Incorrect PIN |
| `pinLock.verifying` | Verificando… | Verifying… |
| `pinLock.tooManyAttempts` | Muitas tentativas. Tente novamente em {{minutes}} minuto(s). | Too many attempts. Try again in {{minutes}} minute(s). |
| `pinLock.tooManyAttemptsOne` | Muitas tentativas. Tente novamente em 1 minuto. | Too many attempts. Try again in 1 minute. |
| `pinLock.notYourAccount` | Não é a sua conta? | Not your account? |
| `pinLock.logOut` | Sair | Log out |
| `pinLock.backspaceAria` | Apagar | Delete |

## Customer email templates

### `api/locales/zh/emails.json` (138 strings)

| Key | Text | English source |
| --- | --- | --- |
| `common.logoAlt` | Ciuna | Ciuna |
| `common.needHelp` | 需要帮助？我们随时为您服务。 | Need help? We're here for you! |
| `common.contactSupport` | 联系客服 | Contact Support |
| `common.contactSupportMailto` | mailto:support@ciuna.com | mailto:support@ciuna.com |
| `common.footerCopyright` | © {{year}} Ciuna。版权所有。 | © {{year}} Ciuna. All rights reserved. |
| `common.footerAccountNote` | 您收到此邮件是因为您拥有 Ciuna 账户。 | You received this email because you have a Ciuna account. |
| `common.refundNote` | 如果您已被扣款，我们将在 24 小时内退款至您的原支付方式。 | If you were charged, we'll refund to your original payment method within 24 hours. |
| `status.pending` | 待处理 | Pending |
| `status.processing` | 处理中 | Processing |
| `status.completed` | 已完成 | Completed |
| `status.failed` | 失败 | Failed |
| `status.cancelled` | 已取消 | Cancelled |
| `summary.heading` | 交易详情 | Transaction Details |
| `summary.transactionId` | 交易编号： | Transaction ID: |
| `summary.recipient` | 收款人： | Recipient: |
| `summary.amount` | 金额： | Amount: |
| `summary.receiving` | 到账金额： | Receiving: |
| `summary.rateUsed` | 使用汇率： | Rate Used: |
| `summary.exchangeFee` | 兑换手续费： | Exchange fee: |
| `summary.logisticsFee` | 物流费： | Logistics fee: |
| `summary.corridorFee` | 通道费： | Corridor fee: |
| `summary.hubFee` | 平台费： | Hub fee: |
| `summary.totalPaid` | 实付总额： | Total paid: |
| `summary.status` | 状态： | Status: |
| `summary.date` | 日期： | Date: |
| `summary.order` | 订单： | Order: |
| `summary.type` | 类型： | Type: |
| `summary.typeFixed` | 固定价格 | Fixed price |
| `summary.typeUserInput` | 自定义金额 | User-entered amount |
| `summary.fundedAmount` | 充值金额： | Funded amount: |
| `summary.exchangeRate` | 汇率： | Exchange rate: |
| `summary.fulfillment` | 配送方式： | Fulfillment: |
| `summary.fulfillmentOnlineValue` | 线上交付给 {{contactName}} | Online delivery to {{contactName}} |
| `summary.fulfillmentInPersonValue` | 上门配送给 {{contactName}} | In-person delivery to {{contactName}} |
| `summary.deliveryAddress` | 配送地址： | Delivery address: |
| `summary.contact` | 联系人： | Contact: |
| `summary.product` | 商品： | Product: |
| `welcome.subject` | 欢迎使用 Ciuna，让我们开始吧 | Welcome to Ciuna! Let's get started |
| `welcome.title` | 欢迎使用 Ciuna | Welcome to Ciuna! |
| `welcome.greeting` | 您好，{{firstName}}！欢迎使用 Ciuna。 | Hi {{firstName}}! Welcome to Ciuna. |
| `welcome.intro` | 感谢您加入 Ciuna！您的账户已激活，可以在 5 分钟内完成跨境汇款。 | Thank you for joining Ciuna! We're excited to have you as part of our community. Your account is now active and ready to send money across borders in under 5 minutes. |
| `welcome.featuresLead` | 使用 Ciuna，您可以： | With Ciuna, you can: |
| `welcome.featureSpeed` | 5 分钟内完成全球汇款，跨境转账快速到账 | Send money globally in under 5 minutes - Lightning-fast cross-border transfers |
| `welcome.featureTracking` | 实时查看转账进度 | Track your transfers in real-time with live updates |
| `welcome.featureRecipients` | 保存常用收款人，快速转账 | Save your favorite recipients for instant transfers |
| `welcome.featureRates` | 享受有竞争力的汇率，没有隐藏费用 | Enjoy competitive exchange rates with zero hidden fees |
| `welcome.gettingStartedHeading` | 开始使用 | Getting Started |
| `welcome.gettingStartedBody` | 要发起第一笔转账，只需点击控制台中的“汇款”按钮，按照简单的步骤操作即可。资金将在 5 分钟内到达收款方！ | To send your first transfer, simply click the "Send Money" button in your dashboard and follow the easy steps. Your money will reach its destination in under 5 minutes! |
| `welcome.cta` | 前往控制台 | Go to Dashboard |
| `send.pending.subject` | 转账已创建 - #{{transactionId}} | Transfer Created - #{{transactionId}} |
| `send.pending.title` | 交易已创建 | Transaction Created |
| `send.pending.body` | 您向 {{recipientName}} 的转账已创建，目前正在处理中。资金送达前，我们会向您发送进度更新。 | Your transfer to {{recipientName}} has been created and is now being processed. We'll send you updates as your money makes its way to its destination! |
| `send.pending.nextHeading` | 接下来 | What's Next |
| `send.pending.nextBody` | 我们正在处理您的转账，完成后会通知您。您可以在控制台查看进度。 | We're working on your transfer and will notify you as soon as it's completed. You can track the progress in your dashboard. |
| `send.pending.cta` | 查看交易进度 | Track Transaction |
| `send.processing.subject` | 转账处理中 - #{{transactionId}} | Transfer Processing - #{{transactionId}} |
| `send.processing.title` | 转账处理中 | Transfer Processing |
| `send.processing.body` | 好消息！我们已收到您的付款，向 {{recipientName}} 的转账正在处理中。资金将在 5 分钟内到账。 | Great news! We've received your payment and your transfer to {{recipientName}} is now being processed. Your money will arrive in under 5 minutes! |
| `send.processing.nextHeading` | 当前进展 | What's Happening |
| `send.processing.nextBody` | 我们正与银行合作伙伴完成转账。得益于我们的先进技术，这通常只需 5 分钟之内。 | We're working with our banking partners to complete your transfer. Thanks to our advanced technology, this typically takes under 5 minutes! |
| `send.processing.cta` | 查看转账 | Track Transfer |
| `send.completed.subject` | 转账已成功完成 #{{transactionId}} | Transfer Completed Successfully! #{{transactionId}} |
| `send.completed.title` | 转账已完成 | Transfer Completed! |
| `send.completed.body` | 您向 {{recipientName}} 的转账已成功完成。资金已发出，几分钟内即可到账。 | Your transfer to {{recipientName}} has been completed successfully! The money has been sent and should arrive within minutes. |
| `send.completed.nextHeading` | 接下来 | What's Next |
| `send.completed.nextBody` | 得益于快速处理，收款方应在几分钟内收到资金。您可以在控制台查看所有转账记录。 | Your recipient should receive the money within minutes thanks to our fast processing. You can track all your transfers in your dashboard. |
| `send.completed.cta` | 查看交易 | View Transaction |
| `send.failed.subject` | 转账失败 - #{{transactionId}} | Transfer Failed - #{{transactionId}} |
| `send.failed.title` | 转账失败 | Transfer Failed |
| `send.failed.bodyWithReason` | 很抱歉，您向 {{recipientName}} 的转账未能完成。原因：{{reason}} | Unfortunately, your transfer to {{recipientName}} could not be completed. Reason: {{reason}} |
| `send.failed.bodyNoReason` | 很抱歉，您向 {{recipientName}} 的转账未能完成。如需更多信息，请联系客服。 | Unfortunately, your transfer to {{recipientName}} could not be completed. Please contact support for more information. |
| `send.failed.nextHeading` | 接下来会发生什么 | What Happens Next |
| `send.failed.cta` | 联系客服 | Contact Support |
| `send.cancelled.subject` | 转账已取消 - #{{transactionId}} | Transfer Cancelled - #{{transactionId}} |
| `send.cancelled.title` | 转账已取消 | Transfer Cancelled |
| `send.cancelled.bodyWithReason` | 您向 {{recipientName}} 的转账已取消。原因：{{reason}} | Your transfer to {{recipientName}} has been cancelled. Reason: {{reason}} |
| `send.cancelled.bodyNoReason` | 您向 {{recipientName}} 的转账已取消。可能是您或我们的客服取消的。 | Your transfer to {{recipientName}} has been cancelled. This may have been cancelled by you or our support team. |
| `send.cancelled.refundHeading` | 退款信息 | Refund Information |
| `send.cancelled.cta` | 发起新转账 | Send New Transfer |
| `hubOrder.pending.subject` | 订单已收到 - {{productTitle}}（#{{transactionId}}） | Order received - {{productTitle}} (#{{transactionId}}) |
| `hubOrder.pending.title` | 订单已收到 | Order Received |
| `hubOrder.pending.hero.fixed` | 感谢您购买 {{productTitle}}（{{fundedAmount}} {{fundedCurrency}}）。 | Thanks for your purchase of {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}). |
| `hubOrder.pending.hero.userInput` | 我们已收到您为 {{productTitle}} 的充值 {{fundedAmount}} {{fundedCurrency}}。 | We've received your top-up for {{productTitle}} - {{fundedAmount}} {{fundedCurrency}}. |
| `hubOrder.pending.fulfillment.online` | 我们会将商品交付给 {{contactName}}，联系电话 {{contactPhone}}。 | We'll deliver to {{contactName}} at {{contactPhone}}. |
| `hubOrder.pending.fulfillment.inPerson` | 我们会将商品配送到 {{contactName}}，地址 {{deliveryAddressLine}}。配送员到达时会致电 {{contactPhone}}。 | We'll deliver to {{contactName}} at {{deliveryAddressLine}}. Our rider will call {{contactPhone}} on arrival. |
| `hubOrder.pending.nextHeading` | 接下来 | What's Next |
| `hubOrder.pending.nextBody` | 我们正在准备您的订单，处理完成后会通知您。您可以随时在“交易”中查看进度。 | We're preparing your order and will notify you as soon as it's processed. You can track the progress anytime in Transactions. |
| `hubOrder.pending.cta` | 查看订单 | View order |
| `hubOrder.processing.subject` | 订单处理中 - {{productTitle}}（#{{transactionId}}） | Processing your order - {{productTitle}} (#{{transactionId}}) |
| `hubOrder.processing.title` | 订单处理中 | Order Processing |
| `hubOrder.processing.hero.fixed` | 我们已收到您为 {{productTitle}}（{{fundedAmount}} {{fundedCurrency}}）的付款，正在处理中。 | We've received your payment for {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}) and are processing it now. |
| `hubOrder.processing.hero.userInput` | 我们已收到您为 {{productTitle}}（{{fundedAmount}} {{fundedCurrency}}）的付款，正在处理您的充值。 | We've received your payment for {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}) and are processing your top-up now. |
| `hubOrder.processing.fulfillment.online` | 发往 {{contactName}}（{{contactPhone}}）的商品正在配送途中。 | Delivery to {{contactName}} at {{contactPhone}} is on the way. |
| `hubOrder.processing.fulfillment.inPerson` | 配送员正在准备发往 {{contactName}}（{{deliveryAddressLine}}）的商品，到达时会致电 {{contactPhone}}。 | Our rider is preparing delivery to {{contactName}} at {{deliveryAddressLine}} and will call {{contactPhone}} on arrival. |
| `hubOrder.processing.nextHeading` | 当前进展 | What's Happening |
| `hubOrder.processing.nextBody` | 订单备妥后，我们会发送最终确认。 | We'll send you a final confirmation as soon as your order is ready. |
| `hubOrder.processing.cta` | 查看订单 | View order |
| `hubOrder.completed.subjectOnline` | 订单已送达 - {{productTitle}}（#{{transactionId}}） | Order delivered - {{productTitle}} (#{{transactionId}}) |
| `hubOrder.completed.subjectInPerson` | 订单配送中 - {{productTitle}}（#{{transactionId}}） | Order on the way - {{productTitle}} (#{{transactionId}}) |
| `hubOrder.completed.title` | 订单已完成 | Order Completed |
| `hubOrder.completed.hero.fixed` | 您购买的 {{productTitle}}（{{fundedAmount}} {{fundedCurrency}}）已完成。 | Your order of {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}) is complete. |
| `hubOrder.completed.hero.userInput` | 您为 {{productTitle}}（{{fundedAmount}} {{fundedCurrency}}）的充值已完成。 | Your top-up for {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}) is complete. |
| `hubOrder.completed.fulfillment.online` | 您的订单已送达 {{contactName}}。详情请查看订单页面。 | Your order has been delivered to {{contactName}}. Check your order page for details. |
| `hubOrder.completed.fulfillment.inPerson` | 配送员正前往 {{contactName}}（{{deliveryAddressLine}}），到达时会致电 {{contactPhone}}。 | Our rider is on the way to {{contactName}} at {{deliveryAddressLine}} and will call {{contactPhone}} on arrival. |
| `hubOrder.completed.nextHeading` | 接下来 | What's Next |
| `hubOrder.completed.nextBody` | 您可以随时在订单页面查看完整收据。 | You can view the full receipt on your order page at any time. |
| `hubOrder.completed.cta` | 查看订单 | View order |
| `hubOrder.failed.subject` | 订单失败 - {{productTitle}}（#{{transactionId}}） | Order failed - {{productTitle}} (#{{transactionId}}) |
| `hubOrder.failed.title` | 订单失败 | Order Failed |
| `hubOrder.failed.bodyWithReason` | 很抱歉，您购买的 {{productTitle}} 未能完成。原因：{{reason}} | Unfortunately, your order of {{productTitle}} could not be completed. Reason: {{reason}} |
| `hubOrder.failed.bodyNoReason` | 很抱歉，您购买的 {{productTitle}} 未能完成。如需更多信息，请联系客服。 | Unfortunately, your order of {{productTitle}} could not be completed. Please contact support for more information. |
| `hubOrder.failed.nextHeading` | 接下来会发生什么 | What Happens Next |
| `hubOrder.failed.cta` | 联系客服 | Contact Support |
| `hubOrder.cancelled.subject` | 订单已取消 - {{productTitle}}（#{{transactionId}}） | Order cancelled - {{productTitle}} (#{{transactionId}}) |
| `hubOrder.cancelled.title` | 订单已取消 | Order Cancelled |
| `hubOrder.cancelled.bodyWithReason` | 您购买的 {{productTitle}} 已取消。原因：{{reason}} | Your order of {{productTitle}} has been cancelled. Reason: {{reason}} |
| `hubOrder.cancelled.bodyNoReason` | 您购买的 {{productTitle}} 已取消。可能是您或我们的客服取消的。 | Your order of {{productTitle}} has been cancelled. This may have been cancelled by you or our support team. |
| `hubOrder.cancelled.refundHeading` | 退款信息 | Refund Information |
| `hubOrder.cancelled.cta` | 浏览商城 | Browse Hub |
| `referralPayout.pending.subjectWithTx` | 推荐奖励提现申请 — #{{payoutTransactionId}} | Referral payout request — #{{payoutTransactionId}} |
| `referralPayout.pending.subjectWithRequest` | 已收到推荐奖励提现申请 — {{requestIdShort}}… | Referral payout request received — {{requestIdShort}}… |
| `referralPayout.pending.subjectFallback` | 已收到推荐奖励提现申请 | Referral payout request received |
| `referralPayout.pending.title` | 已收到推荐奖励提现申请 | Referral payout request received |
| `referralPayout.pending.body` | 您好，{{firstName}}，我们已收到您向 {{recipientName}} 提现 {{amount}} {{currency}} 推荐奖励的申请。我们的团队会审核并处理，与发起汇款时类似，提现完成或取消时您都会收到邮件。 | Hi {{firstName}}, we've received your referral reward withdrawal request of {{amount}} {{currency}} to {{recipientName}}. Our team will review and process it—similar to when you start a send, you'll get another email when the payout is completed or if it's cancelled. |
| `referralPayout.pending.referenceTx` | 交易编号：{{payoutTransactionId}} | Transaction ID: {{payoutTransactionId}} |
| `referralPayout.pending.referenceRequest` | 申请编号：{{payoutRequestId}} | Request ID: {{payoutRequestId}} |
| `referralPayout.pending.nextHeading` | 接下来 | What happens next |
| `referralPayout.pending.nextBody` | 提现发出或申请取消时，我们会通过邮件通知您。您也可以在应用的“联盟与推荐”中查看状态。 | We'll notify you by email when the payout is sent or if the request is cancelled. You can also check status under Affiliates & Referrals in the app. |
| `referralPayout.pending.cta` | 查看推荐 | View referrals |
| `referralPayout.completed.subject` | 推荐奖励已发出 — {{amount}} {{currency}} | Referral payout sent — {{amount}} {{currency}} |
| `referralPayout.completed.title` | 推荐奖励提现已完成 | Referral payout completed |
| `referralPayout.completed.body` | 您好，{{firstName}}，您向 {{recipientName}} 提现 {{amount}} {{currency}} 推荐奖励的申请已完成。这笔转账会像普通转账一样显示在您的记录中，并计入您全年的汇款总额。 | Hi {{firstName}}, your referral reward withdrawal of {{amount}} {{currency}} to {{recipientName}} has been completed. This send appears in your activity like a regular transfer and counts toward your send totals for the year. |
| `referralPayout.completed.referenceTx` | 交易编号：{{linkedTransactionId}} | Transaction ID: {{linkedTransactionId}} |
| `referralPayout.completed.cta` | 查看记录 | View activity |
| `referralPayout.cancelled.subject` | 推荐奖励提现申请已取消 | Referral payout request cancelled |
| `referralPayout.cancelled.title` | 推荐奖励提现已取消 | Referral payout cancelled |
| `referralPayout.cancelled.body` | 您好，{{firstName}}，您向 {{recipientName}} 提现 {{amount}} {{currency}} 推荐奖励的申请已取消。这些资金仍保留在您可用的推荐余额中。如果您并未预期此结果，请联系客服。 | Hi {{firstName}}, your referral payout request for {{amount}} {{currency}} to {{recipientName}} has been cancelled. Those funds remain in your available referral balance. If you did not expect this, contact support. |
| `referralPayout.cancelled.cta` | 打开推荐 | Open referrals |

### `api/locales/pt/emails.json` (138 strings)

| Key | Text | English source |
| --- | --- | --- |
| `common.logoAlt` | Ciuna | Ciuna |
| `common.needHelp` | Precisa de ajuda? Estamos aqui para você. | Need help? We're here for you! |
| `common.contactSupport` | Falar com o suporte | Contact Support |
| `common.contactSupportMailto` | mailto:support@ciuna.com | mailto:support@ciuna.com |
| `common.footerCopyright` | © {{year}} Ciuna. Todos os direitos reservados. | © {{year}} Ciuna. All rights reserved. |
| `common.footerAccountNote` | Você recebeu este e-mail porque tem uma conta na Ciuna. | You received this email because you have a Ciuna account. |
| `common.refundNote` | Se você foi cobrado, devolveremos o valor ao seu meio de pagamento original em até 24 horas. | If you were charged, we'll refund to your original payment method within 24 hours. |
| `status.pending` | Pendente | Pending |
| `status.processing` | Em processamento | Processing |
| `status.completed` | Concluído | Completed |
| `status.failed` | Falhou | Failed |
| `status.cancelled` | Cancelado | Cancelled |
| `summary.heading` | Detalhes da transação | Transaction Details |
| `summary.transactionId` | ID da transação: | Transaction ID: |
| `summary.recipient` | Destinatário: | Recipient: |
| `summary.amount` | Valor: | Amount: |
| `summary.receiving` | Valor recebido: | Receiving: |
| `summary.rateUsed` | Taxa usada: | Rate Used: |
| `summary.exchangeFee` | Taxa de câmbio: | Exchange fee: |
| `summary.logisticsFee` | Taxa de logística: | Logistics fee: |
| `summary.corridorFee` | Taxa do corredor: | Corridor fee: |
| `summary.hubFee` | Taxa da plataforma: | Hub fee: |
| `summary.totalPaid` | Total pago: | Total paid: |
| `summary.status` | Status: | Status: |
| `summary.date` | Data: | Date: |
| `summary.order` | Pedido: | Order: |
| `summary.type` | Tipo: | Type: |
| `summary.typeFixed` | Preço fixo | Fixed price |
| `summary.typeUserInput` | Valor informado pelo cliente | User-entered amount |
| `summary.fundedAmount` | Valor carregado: | Funded amount: |
| `summary.exchangeRate` | Taxa de câmbio: | Exchange rate: |
| `summary.fulfillment` | Entrega: | Fulfillment: |
| `summary.fulfillmentOnlineValue` | Entrega online para {{contactName}} | Online delivery to {{contactName}} |
| `summary.fulfillmentInPersonValue` | Entrega presencial para {{contactName}} | In-person delivery to {{contactName}} |
| `summary.deliveryAddress` | Endereço de entrega: | Delivery address: |
| `summary.contact` | Contato: | Contact: |
| `summary.product` | Produto: | Product: |
| `welcome.subject` | Bem-vindo à Ciuna! Vamos começar | Welcome to Ciuna! Let's get started |
| `welcome.title` | Bem-vindo à Ciuna! | Welcome to Ciuna! |
| `welcome.greeting` | Olá, {{firstName}}! Bem-vindo à Ciuna. | Hi {{firstName}}! Welcome to Ciuna. |
| `welcome.intro` | Obrigado por entrar na Ciuna! Sua conta já está ativa e pronta para enviar dinheiro para o exterior em menos de 5 minutos. | Thank you for joining Ciuna! We're excited to have you as part of our community. Your account is now active and ready to send money across borders in under 5 minutes. |
| `welcome.featuresLead` | Com a Ciuna, você pode: | With Ciuna, you can: |
| `welcome.featureSpeed` | Enviar dinheiro para o mundo todo em menos de 5 minutos — transferências internacionais rápidas | Send money globally in under 5 minutes - Lightning-fast cross-border transfers |
| `welcome.featureTracking` | Acompanhar suas transferências em tempo real | Track your transfers in real-time with live updates |
| `welcome.featureRecipients` | Salvar seus destinatários favoritos para transferências rápidas | Save your favorite recipients for instant transfers |
| `welcome.featureRates` | Aproveitar taxas de câmbio competitivas, sem taxas ocultas | Enjoy competitive exchange rates with zero hidden fees |
| `welcome.gettingStartedHeading` | Primeiros passos | Getting Started |
| `welcome.gettingStartedBody` | Para fazer sua primeira transferência, clique em “Enviar dinheiro” no seu painel e siga os passos. O dinheiro chega ao destino em menos de 5 minutos! | To send your first transfer, simply click the "Send Money" button in your dashboard and follow the easy steps. Your money will reach its destination in under 5 minutes! |
| `welcome.cta` | Ir para o painel | Go to Dashboard |
| `send.pending.subject` | Transferência criada - #{{transactionId}} | Transfer Created - #{{transactionId}} |
| `send.pending.title` | Transação criada | Transaction Created |
| `send.pending.body` | Sua transferência para {{recipientName}} foi criada e está sendo processada. Enviaremos atualizações enquanto o dinheiro segue até o destino. | Your transfer to {{recipientName}} has been created and is now being processed. We'll send you updates as your money makes its way to its destination! |
| `send.pending.nextHeading` | Próximos passos | What's Next |
| `send.pending.nextBody` | Estamos trabalhando na sua transferência e avisaremos assim que ela for concluída. Você pode acompanhar o andamento no seu painel. | We're working on your transfer and will notify you as soon as it's completed. You can track the progress in your dashboard. |
| `send.pending.cta` | Acompanhar transação | Track Transaction |
| `send.processing.subject` | Transferência em processamento - #{{transactionId}} | Transfer Processing - #{{transactionId}} |
| `send.processing.title` | Transferência em processamento | Transfer Processing |
| `send.processing.body` | Boa notícia! Recebemos seu pagamento e sua transferência para {{recipientName}} está em processamento. O dinheiro chegará em menos de 5 minutos! | Great news! We've received your payment and your transfer to {{recipientName}} is now being processed. Your money will arrive in under 5 minutes! |
| `send.processing.nextHeading` | O que está acontecendo | What's Happening |
| `send.processing.nextBody` | Estamos trabalhando com nossos parceiros bancários para concluir sua transferência. Graças à nossa tecnologia, isso normalmente leva menos de 5 minutos. | We're working with our banking partners to complete your transfer. Thanks to our advanced technology, this typically takes under 5 minutes! |
| `send.processing.cta` | Acompanhar transferência | Track Transfer |
| `send.completed.subject` | Transferência concluída com sucesso! #{{transactionId}} | Transfer Completed Successfully! #{{transactionId}} |
| `send.completed.title` | Transferência concluída | Transfer Completed! |
| `send.completed.body` | Sua transferência para {{recipientName}} foi concluída com sucesso. O dinheiro foi enviado e deve chegar em minutos. | Your transfer to {{recipientName}} has been completed successfully! The money has been sent and should arrive within minutes. |
| `send.completed.nextHeading` | Próximos passos | What's Next |
| `send.completed.nextBody` | Graças ao nosso processamento rápido, o destinatário deve receber o dinheiro em minutos. Você pode acompanhar todas as suas transferências no painel. | Your recipient should receive the money within minutes thanks to our fast processing. You can track all your transfers in your dashboard. |
| `send.completed.cta` | Ver transação | View Transaction |
| `send.failed.subject` | Transferência falhou - #{{transactionId}} | Transfer Failed - #{{transactionId}} |
| `send.failed.title` | Transferência falhou | Transfer Failed |
| `send.failed.bodyWithReason` | Infelizmente, sua transferência para {{recipientName}} não pôde ser concluída. Motivo: {{reason}} | Unfortunately, your transfer to {{recipientName}} could not be completed. Reason: {{reason}} |
| `send.failed.bodyNoReason` | Infelizmente, sua transferência para {{recipientName}} não pôde ser concluída. Fale com o suporte para mais informações. | Unfortunately, your transfer to {{recipientName}} could not be completed. Please contact support for more information. |
| `send.failed.nextHeading` | O que acontece agora | What Happens Next |
| `send.failed.cta` | Falar com o suporte | Contact Support |
| `send.cancelled.subject` | Transferência cancelada - #{{transactionId}} | Transfer Cancelled - #{{transactionId}} |
| `send.cancelled.title` | Transferência cancelada | Transfer Cancelled |
| `send.cancelled.bodyWithReason` | Sua transferência para {{recipientName}} foi cancelada. Motivo: {{reason}} | Your transfer to {{recipientName}} has been cancelled. Reason: {{reason}} |
| `send.cancelled.bodyNoReason` | Sua transferência para {{recipientName}} foi cancelada. Pode ter sido cancelada por você ou pela nossa equipe de suporte. | Your transfer to {{recipientName}} has been cancelled. This may have been cancelled by you or our support team. |
| `send.cancelled.refundHeading` | Informações de reembolso | Refund Information |
| `send.cancelled.cta` | Fazer nova transferência | Send New Transfer |
| `hubOrder.pending.subject` | Pedido recebido - {{productTitle}} (#{{transactionId}}) | Order received - {{productTitle}} (#{{transactionId}}) |
| `hubOrder.pending.title` | Pedido recebido | Order Received |
| `hubOrder.pending.hero.fixed` | Obrigado pela compra de {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}). | Thanks for your purchase of {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}). |
| `hubOrder.pending.hero.userInput` | Recebemos seu carregamento para {{productTitle}} — {{fundedAmount}} {{fundedCurrency}}. | We've received your top-up for {{productTitle}} - {{fundedAmount}} {{fundedCurrency}}. |
| `hubOrder.pending.fulfillment.online` | Vamos entregar para {{contactName}} no telefone {{contactPhone}}. | We'll deliver to {{contactName}} at {{contactPhone}}. |
| `hubOrder.pending.fulfillment.inPerson` | Vamos entregar para {{contactName}} em {{deliveryAddressLine}}. Nosso entregador ligará para {{contactPhone}} ao chegar. | We'll deliver to {{contactName}} at {{deliveryAddressLine}}. Our rider will call {{contactPhone}} on arrival. |
| `hubOrder.pending.nextHeading` | Próximos passos | What's Next |
| `hubOrder.pending.nextBody` | Estamos preparando seu pedido e avisaremos assim que ele for processado. Você pode acompanhar o andamento a qualquer momento em Transações. | We're preparing your order and will notify you as soon as it's processed. You can track the progress anytime in Transactions. |
| `hubOrder.pending.cta` | Ver pedido | View order |
| `hubOrder.processing.subject` | Processando seu pedido - {{productTitle}} (#{{transactionId}}) | Processing your order - {{productTitle}} (#{{transactionId}}) |
| `hubOrder.processing.title` | Pedido em processamento | Order Processing |
| `hubOrder.processing.hero.fixed` | Recebemos seu pagamento de {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}) e estamos processando agora. | We've received your payment for {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}) and are processing it now. |
| `hubOrder.processing.hero.userInput` | Recebemos seu pagamento de {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}) e estamos processando seu carregamento agora. | We've received your payment for {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}) and are processing your top-up now. |
| `hubOrder.processing.fulfillment.online` | A entrega para {{contactName}} no telefone {{contactPhone}} já está a caminho. | Delivery to {{contactName}} at {{contactPhone}} is on the way. |
| `hubOrder.processing.fulfillment.inPerson` | Nosso entregador está preparando a entrega para {{contactName}} em {{deliveryAddressLine}} e ligará para {{contactPhone}} ao chegar. | Our rider is preparing delivery to {{contactName}} at {{deliveryAddressLine}} and will call {{contactPhone}} on arrival. |
| `hubOrder.processing.nextHeading` | O que está acontecendo | What's Happening |
| `hubOrder.processing.nextBody` | Enviaremos uma confirmação final assim que o seu pedido estiver pronto. | We'll send you a final confirmation as soon as your order is ready. |
| `hubOrder.processing.cta` | Ver pedido | View order |
| `hubOrder.completed.subjectOnline` | Pedido entregue - {{productTitle}} (#{{transactionId}}) | Order delivered - {{productTitle}} (#{{transactionId}}) |
| `hubOrder.completed.subjectInPerson` | Pedido a caminho - {{productTitle}} (#{{transactionId}}) | Order on the way - {{productTitle}} (#{{transactionId}}) |
| `hubOrder.completed.title` | Pedido concluído | Order Completed |
| `hubOrder.completed.hero.fixed` | Seu pedido de {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}) foi concluído. | Your order of {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}) is complete. |
| `hubOrder.completed.hero.userInput` | Seu carregamento para {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}) foi concluído. | Your top-up for {{productTitle}} ({{fundedAmount}} {{fundedCurrency}}) is complete. |
| `hubOrder.completed.fulfillment.online` | Seu pedido foi entregue para {{contactName}}. Veja os detalhes na página do pedido. | Your order has been delivered to {{contactName}}. Check your order page for details. |
| `hubOrder.completed.fulfillment.inPerson` | Nosso entregador está a caminho de {{contactName}} em {{deliveryAddressLine}} e ligará para {{contactPhone}} ao chegar. | Our rider is on the way to {{contactName}} at {{deliveryAddressLine}} and will call {{contactPhone}} on arrival. |
| `hubOrder.completed.nextHeading` | Próximos passos | What's Next |
| `hubOrder.completed.nextBody` | Você pode ver o recibo completo na página do pedido a qualquer momento. | You can view the full receipt on your order page at any time. |
| `hubOrder.completed.cta` | Ver pedido | View order |
| `hubOrder.failed.subject` | Pedido falhou - {{productTitle}} (#{{transactionId}}) | Order failed - {{productTitle}} (#{{transactionId}}) |
| `hubOrder.failed.title` | Pedido falhou | Order Failed |
| `hubOrder.failed.bodyWithReason` | Infelizmente, seu pedido de {{productTitle}} não pôde ser concluído. Motivo: {{reason}} | Unfortunately, your order of {{productTitle}} could not be completed. Reason: {{reason}} |
| `hubOrder.failed.bodyNoReason` | Infelizmente, seu pedido de {{productTitle}} não pôde ser concluído. Fale com o suporte para mais informações. | Unfortunately, your order of {{productTitle}} could not be completed. Please contact support for more information. |
| `hubOrder.failed.nextHeading` | O que acontece agora | What Happens Next |
| `hubOrder.failed.cta` | Falar com o suporte | Contact Support |
| `hubOrder.cancelled.subject` | Pedido cancelado - {{productTitle}} (#{{transactionId}}) | Order cancelled - {{productTitle}} (#{{transactionId}}) |
| `hubOrder.cancelled.title` | Pedido cancelado | Order Cancelled |
| `hubOrder.cancelled.bodyWithReason` | Seu pedido de {{productTitle}} foi cancelado. Motivo: {{reason}} | Your order of {{productTitle}} has been cancelled. Reason: {{reason}} |
| `hubOrder.cancelled.bodyNoReason` | Seu pedido de {{productTitle}} foi cancelado. Pode ter sido cancelado por você ou pela nossa equipe de suporte. | Your order of {{productTitle}} has been cancelled. This may have been cancelled by you or our support team. |
| `hubOrder.cancelled.refundHeading` | Informações de reembolso | Refund Information |
| `hubOrder.cancelled.cta` | Ver a loja | Browse Hub |
| `referralPayout.pending.subjectWithTx` | Solicitação de repasse de indicação — #{{payoutTransactionId}} | Referral payout request — #{{payoutTransactionId}} |
| `referralPayout.pending.subjectWithRequest` | Solicitação de repasse de indicação recebida — {{requestIdShort}}… | Referral payout request received — {{requestIdShort}}… |
| `referralPayout.pending.subjectFallback` | Solicitação de repasse de indicação recebida | Referral payout request received |
| `referralPayout.pending.title` | Solicitação de repasse de indicação recebida | Referral payout request received |
| `referralPayout.pending.body` | Olá, {{firstName}}! Recebemos seu pedido de saque de {{amount}} {{currency}} da recompensa de indicação para {{recipientName}}. Nossa equipe vai analisar e processar — assim como ao iniciar um envio, você receberá outro e-mail quando o repasse for concluído ou cancelado. | Hi {{firstName}}, we've received your referral reward withdrawal request of {{amount}} {{currency}} to {{recipientName}}. Our team will review and process it—similar to when you start a send, you'll get another email when the payout is completed or if it's cancelled. |
| `referralPayout.pending.referenceTx` | ID da transação: {{payoutTransactionId}} | Transaction ID: {{payoutTransactionId}} |
| `referralPayout.pending.referenceRequest` | ID da solicitação: {{payoutRequestId}} | Request ID: {{payoutRequestId}} |
| `referralPayout.pending.nextHeading` | Próximos passos | What happens next |
| `referralPayout.pending.nextBody` | Avisaremos por e-mail quando o repasse for enviado ou se o pedido for cancelado. Você também pode ver o status em Afiliados e indicações no app. | We'll notify you by email when the payout is sent or if the request is cancelled. You can also check status under Affiliates & Referrals in the app. |
| `referralPayout.pending.cta` | Ver indicações | View referrals |
| `referralPayout.completed.subject` | Repasse de indicação enviado — {{amount}} {{currency}} | Referral payout sent — {{amount}} {{currency}} |
| `referralPayout.completed.title` | Repasse de indicação concluído | Referral payout completed |
| `referralPayout.completed.body` | Olá, {{firstName}}! Seu saque de {{amount}} {{currency}} da recompensa de indicação para {{recipientName}} foi concluído. Este envio aparece nas suas atividades como uma transferência comum e conta para o total de envios do ano. | Hi {{firstName}}, your referral reward withdrawal of {{amount}} {{currency}} to {{recipientName}} has been completed. This send appears in your activity like a regular transfer and counts toward your send totals for the year. |
| `referralPayout.completed.referenceTx` | ID da transação: {{linkedTransactionId}} | Transaction ID: {{linkedTransactionId}} |
| `referralPayout.completed.cta` | Ver atividade | View activity |
| `referralPayout.cancelled.subject` | Solicitação de repasse de indicação cancelada | Referral payout request cancelled |
| `referralPayout.cancelled.title` | Repasse de indicação cancelado | Referral payout cancelled |
| `referralPayout.cancelled.body` | Olá, {{firstName}}! Sua solicitação de repasse de {{amount}} {{currency}} para {{recipientName}} foi cancelada. Esses valores continuam no seu saldo de indicações disponível. Se você não esperava isso, fale com o suporte. | Hi {{firstName}}, your referral payout request for {{amount}} {{currency}} to {{recipientName}} has been cancelled. Those funds remain in your available referral balance. If you did not expect this, contact support. |
| `referralPayout.cancelled.cta` | Abrir indicações | Open referrals |

