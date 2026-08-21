create table materials (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    created_at timestamptz default now()
);

create table mattresses (
    id uuid primary key default gen_random_uuid(),
    material_id uuid not null
        references materials(id)
        on delete restrict,
    name text not null,
    description text,
    warranty_years integer,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table product_images (
    id uuid primary key default gen_random_uuid(),
    mattress_id uuid not null
        references mattresses(id)
        on delete cascade,
    image_url text not null,
    is_primary boolean default false,
    sort_order integer default 0,
    created_at timestamptz default now()
);

create table variants (
    id uuid primary key default gen_random_uuid(),
    mattress_id uuid not null
        references mattresses(id)
        on delete cascade,
    size_name text,
    length integer not null,
    width integer not null,
    height integer not null,
    price numeric(10,2) not null,
    stock integer default 0,
    sku text unique,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table profiles (
    id uuid primary key,
    email text unique,
    full_name text,
    phone text,
    role text default 'CUSTOMER',
    created_at timestamptz default now()
);

create table coupons (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    percentage numeric(5,2),
    flat_discount numeric(10,2),
    min_order_value numeric(10,2),
    max_discount numeric(10,2),
    usage_limit integer,
    usage_count integer default 0,
    expiry_date timestamptz,
    is_active boolean default true,
    created_at timestamptz default now()
);

create table inquiries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid
        references profiles(id),
    customer_name text not null,
    customer_phone text not null,
    coupon_id uuid
        references coupons(id),
    discount_amount numeric(10,2) default 0,
    total_amount numeric(10,2),
    notes text,
    status text default 'NEW',
    created_at timestamptz default now()
);

create table inquiry_items (
    id uuid primary key default gen_random_uuid(),
    inquiry_id uuid not null
        references inquiries(id)
        on delete cascade,
    variant_id uuid not null
        references variants(id),
    quantity integer default 1,
    unit_price numeric(10,2),
    created_at timestamptz default now()
);

-- Function to automatically update the updated_at column
create or replace function update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Apply the trigger to tables with an updated_at column
create trigger update_mattresses_modtime
    before update on mattresses
    for each row execute function update_modified_column();

create trigger update_variants_modtime
    before update on variants
    for each row execute function update_modified_column();
