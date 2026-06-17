insert into categories (name, sort_order, is_default)
select seed.name, seed.sort_order, true
from (
  values
    ('Cleaning', 10),
    ('Repairs & maintenance', 20),
    ('Supplies', 30),
    ('Furniture & equipment', 40),
    ('Utilities', 50),
    ('Internet & subscriptions', 60),
    ('Platform fees', 70),
    ('Insurance', 80),
    ('Loan interest', 90),
    ('Housing company fees / maintenance charges', 100),
    ('Professional services', 110),
    ('Travel & transport', 120),
    ('Other', 130)
) as seed(name, sort_order)
where not exists (
  select 1
  from categories
  where categories.name = seed.name
    and categories.is_default = true
    and categories.user_id is null
);
