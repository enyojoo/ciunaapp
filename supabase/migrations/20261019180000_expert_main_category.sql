-- Expert main category: one of eight fixed "needs" the customer apps group experts by (Documents and visas,
-- Translation, Education, Work and business, Housing, Health, Hair and beauty, Errands).
-- `category` stays as the free-text label Office shows on the profile; `main_category` decides where the expert
-- appears. Backfilled from category, then headline, with the same keywords as mobile/lib/expert-category.ts.
begin;
-- Fail fast instead of queueing behind a long-running transaction.
-- If this errors with a lock timeout, nothing was changed: run it again a minute later.
set local lock_timeout = '5s';

alter table expert_profiles
  add column if not exists main_category text
    check (main_category is null or main_category in ('documents', 'translation', 'education', 'work', 'housing', 'health', 'beauty', 'errands'));

-- Matches one piece of text to a main category, or null when nothing matches. Session-only helper.
create or replace function pg_temp.ciuna_main_category(t text) returns text language sql immutable as $$
  select case
    when t is null or btrim(t) = '' then null
    when lower(t) ~ '(immigra|migra|visa|permit|residen|citizen|registr|patent|\mlaw\M|lawyer|legal|миграц|виз|внж|рвп|гражданств|регистрац|патент|юрист|юрид|inmigra|visado|résiden|avocat|advogad|移民|签证|居留|律师|法律)' then 'documents'
    when lower(t) ~ '(translat|interpret|notar|apostil|перевод|нотари|апостил|traduc|tradu|翻译|公证)' then 'translation'
    when lower(t) ~ '(educat|lesson|tutor|teach|school|universit|admission|exam|ielts|toefl|language|russian|course|образов|урок|репетит|экзам|поступлен|университет|язык|курс|educa|clase|cours|aula|教育|课|考试|大学|语言)' then 'education'
    when lower(t) ~ '(\mjob|career|develop|engineer|design|разработ|инженер|дизайн|desarroll|ingenier|développ|ingénieur|desenvolv|engenheir|开发|工程师|设计|\mcv\M|resume|business|company|account|\mtax|finance|consult|\mit\M|tech|computer|software|работ|карьер|резюме|бизнес|компани|бухгалт|налог|консульт|айти|компьют|trabajo|negocio|emploi|entreprise|trabalho|工作|简历|公司|会计|税|咨询|电脑|技术)' then 'work'
    when lower(t) ~ '(housing|apartment|\mflat\M|\mrent|realtor|real estate|moving|relocat|жиль|квартир|аренд|риелтор|переезд|vivienda|alquiler|logement|location|moradia|aluguel|住房|租房|公寓|搬家)' then 'housing'
    when lower(t) ~ '(health|doctor|medic|clinic|dentist|therap|psycholog|nurse|здоров|врач|медиц|клиник|стомат|психолог|salud|médic|santé|saúde|健康|医生|医疗|牙|心理)' then 'health'
    when lower(t) ~ '(hair|barber|braid|beauty|\mnail|makeup|stylist|salon|волос|барбер|парикмах|косич|красот|маникюр|макияж|peluq|belleza|coiff|beauté|cabel|beleza|美发|理发|美容|美甲|化妆)' then 'beauty'
    when lower(t) ~ '(errand|courier|delivery|pickup|shopping|queue|cleaning|handyman|поручен|курьер|доставк|покупк|уборк|мастер на час|encargo|mandado|recado|coursier|ménage|faxina|跑腿|代购|快递|清洁)' then 'errands'
    else null
  end
$$;

update expert_profiles
set main_category = coalesce(pg_temp.ciuna_main_category(category), pg_temp.ciuna_main_category(headline), 'errands')
where main_category is null;

commit;
