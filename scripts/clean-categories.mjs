import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function clean() {
  const headers = {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const getUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/materials?select=id,name`;
  const getRes = await fetch(getUrl, { headers });
  const categories = await getRes.json();

  const allowedCategories = [
    'One Piece WC (S-Trap)',
    'Wall Hung WC',
    'Floor Mounted Coupled Closet',
    'Wall Hung with Dual Flush Cistern',
    'Floor Mounted WC (EWC)',
    'Squatting Pan',
    'Wall Hung Basin',
    'Polymer Cistern Dual Flush',
    'Polymer Cistern Single Flush',
    'Urinals — Electronic',
    'Urinals — Regular',
    'Faucets — Claret Collection',
    'Faucets — Jade Collection',
    'Concealed Bodies',
    'Hand Showers Collection',
    'Health Faucet Collection'
  ];

  // Purge any category not in the allowed list
  for (const cat of categories) {
    if (!allowedCategories.includes(cat.name)) {
      console.log(`Deleting legacy/unauthorized category: "${cat.name}" (${cat.id})`);
      
      // Let's check if there are any products referencing it first, and reassign or delete them
      const checkProdUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/mattresses?material_id=eq.${cat.id}&select=id,name`;
      const checkRes = await fetch(checkProdUrl, { headers });
      const prods = await checkRes.json();
      if (prods && prods.length > 0) {
        console.log(`Found ${prods.length} products referencing "${cat.name}". Reassigning to "One Piece WC (S-Trap)"...`);
        // Find the target category ID
        const targetCat = categories.find(c => c.name === 'One Piece WC (S-Trap)');
        if (targetCat) {
          for (const prod of prods) {
            const updateProdUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/mattresses?id=eq.${prod.id}`;
            await fetch(updateProdUrl, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ material_id: targetCat.id })
            });
          }
        }
      }

      // Now perform deletion
      const deleteUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/materials?id=eq.${cat.id}`;
      const delRes = await fetch(deleteUrl, {
        method: 'DELETE',
        headers
      });
      console.log(`Deleted "${cat.name}". Status: ${delRes.status}`);
    }
  }
}

clean();
