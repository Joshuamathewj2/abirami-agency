-- Enable RLS on all tables
alter table materials enable row level security;
alter table mattresses enable row level security;
alter table product_images enable row level security;
alter table variants enable row level security;
alter table profiles enable row level security;
alter table coupons enable row level security;
alter table inquiries enable row level security;
alter table inquiry_items enable row level security;

-- Materials: Everyone can read
create policy "Materials are viewable by everyone" 
on materials for select using (true);

-- Mattresses: Everyone can read active mattresses
create policy "Mattresses are viewable by everyone" 
on mattresses for select using (is_active = true);

-- Product Images: Everyone can read
create policy "Product images are viewable by everyone" 
on product_images for select using (true);

-- Variants: Everyone can read
create policy "Variants are viewable by everyone" 
on variants for select using (true);

-- Profiles: Users can view and update their own profile
create policy "Users can view own profile" 
on profiles for select using (auth.uid() = id);

create policy "Users can update own profile" 
on profiles for update using (auth.uid() = id);

-- Coupons: Everyone can read active coupons
create policy "Active coupons are viewable by everyone" 
on coupons for select using (is_active = true);

-- Inquiries: Users can view and insert their own inquiries
create policy "Users can view own inquiries" 
on inquiries for select using (auth.uid() = user_id);

create policy "Users can insert own inquiries" 
on inquiries for insert with check (auth.uid() = user_id);

-- Inquiry Items: Users can view and insert items for their own inquiries
create policy "Users can view own inquiry items" 
on inquiry_items for select using (
    exists (
        select 1 from inquiries
        where inquiries.id = inquiry_items.inquiry_id
        and inquiries.user_id = auth.uid()
    )
);

create policy "Users can insert own inquiry items" 
on inquiry_items for insert with check (
    exists (
        select 1 from inquiries
        where inquiries.id = inquiry_items.inquiry_id
        and inquiries.user_id = auth.uid()
    )
);
