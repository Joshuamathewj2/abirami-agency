import assert from 'node:assert/strict';

// Test calculateTotals logic in pure JavaScript
function calculateTotals(input) {
  let subtotal = 0;
  if (input.subtotal !== undefined) {
    subtotal = Number(input.subtotal) || 0;
  } else if (input.items && Array.isArray(input.items)) {
    subtotal = input.items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0);
  }

  const couponDiscount = Math.max(0, Number(input.couponDiscount) || 0);
  const manualDiscount = Math.max(0, Number(input.manualDiscount) || 0);
  const totalDiscount = couponDiscount + manualDiscount;
  const delivery = Math.max(0, Number(input.deliveryFee) || 0);

  const isGst = input.invoiceType ? input.invoiceType === 'gst' : Boolean(input.isGst);
  const invoiceType = isGst ? 'gst' : 'non-gst';
  const gstMode = input.gstMode === 'exclusive' ? 'exclusive' : 'inclusive';
  const gstRate = isGst ? Math.max(0, Number(input.gstRate ?? 18)) : 0;

  const subtotalPaise = Math.round(subtotal * 100);
  const discountPaise = Math.min(subtotalPaise, Math.round(totalDiscount * 100));
  const postDiscountPaise = Math.max(0, subtotalPaise - discountPaise);
  const deliveryPaise = Math.round(delivery * 100);
  const taxableBasePaise = postDiscountPaise + deliveryPaise;

  let taxablePaise = 0;
  let gstTotalPaise = 0;
  let grandTotalPaise = 0;

  if (!isGst || gstRate === 0) {
    taxablePaise = taxableBasePaise;
    gstTotalPaise = 0;
    grandTotalPaise = taxableBasePaise;
  } else if (gstMode === 'exclusive') {
    taxablePaise = taxableBasePaise;
    gstTotalPaise = Math.round((taxablePaise * gstRate) / 100);
    grandTotalPaise = taxablePaise + gstTotalPaise;
  } else {
    grandTotalPaise = taxableBasePaise;
    gstTotalPaise = Math.round((grandTotalPaise * gstRate) / (100 + gstRate));
    taxablePaise = grandTotalPaise - gstTotalPaise;
  }

  const cgstPaise = Math.round(gstTotalPaise / 2);
  const sgstPaise = gstTotalPaise - cgstPaise;

  return {
    invoiceType,
    gstMode,
    gstRate,
    subtotal: subtotalPaise / 100,
    totalDiscount: discountPaise / 100,
    delivery: deliveryPaise / 100,
    taxableAmount: taxablePaise / 100,
    gstTotal: gstTotalPaise / 100,
    cgst: cgstPaise / 100,
    sgst: sgstPaise / 100,
    grandTotal: grandTotalPaise / 100,
  };
}

console.log('--- RUNNING GST ENGINE UNIT TESTS ---');

// Test 1: Problem Check - ₹2,100 at 18% inclusive
{
  const res = calculateTotals({
    subtotal: 2100,
    invoiceType: 'gst',
    gstMode: 'inclusive',
    gstRate: 18,
  });
  console.log('Test 1 (Inclusive 18% on ₹2100):', res);
  assert.equal(res.grandTotal, 2100);
  assert.equal(res.gstTotal, 320.34);
  assert.equal(res.taxableAmount, 1779.66);
  assert.equal(res.cgst, 160.17);
  assert.equal(res.sgst, 160.17);
  assert.equal(res.cgst + res.sgst, 320.34);
}

// Test 2: Exclusive 18% on ₹2,000
{
  const res = calculateTotals({
    subtotal: 2000,
    invoiceType: 'gst',
    gstMode: 'exclusive',
    gstRate: 18,
  });
  console.log('Test 2 (Exclusive 18% on ₹2000):', res);
  assert.equal(res.taxableAmount, 2000);
  assert.equal(res.gstTotal, 360);
  assert.equal(res.grandTotal, 2360);
  assert.equal(res.cgst, 180);
  assert.equal(res.sgst, 180);
}

// Test 3: Post-discount calculation with ₹500 discount on ₹2,500
{
  const res = calculateTotals({
    subtotal: 2500,
    couponDiscount: 500,
    invoiceType: 'gst',
    gstMode: 'exclusive',
    gstRate: 18,
  });
  console.log('Test 3 (Discounted Exclusive):', res);
  assert.equal(res.subtotal, 2500);
  assert.equal(res.totalDiscount, 500);
  assert.equal(res.taxableAmount, 2000);
  assert.equal(res.gstTotal, 360);
  assert.equal(res.grandTotal, 2360);
}

// Test 4: Non-GST Bill
{
  const res = calculateTotals({
    subtotal: 1500,
    deliveryFee: 100,
    invoiceType: 'non-gst',
  });
  console.log('Test 4 (Non-GST):', res);
  assert.equal(res.invoiceType, 'non-gst');
  assert.equal(res.gstTotal, 0);
  assert.equal(res.grandTotal, 1600);
  assert.equal(res.taxableAmount, 1600);
}

// Test 5: 0% GST Rate
{
  const res = calculateTotals({
    subtotal: 1000,
    invoiceType: 'gst',
    gstRate: 0,
  });
  console.log('Test 5 (0% GST Rate):', res);
  assert.equal(res.gstTotal, 0);
  assert.equal(res.grandTotal, 1000);
}

// Test 6: Rounding with odd paise (e.g. ₹99.99 total at 18% inclusive)
{
  const res = calculateTotals({
    subtotal: 99.99,
    invoiceType: 'gst',
    gstMode: 'inclusive',
    gstRate: 18,
  });
  console.log('Test 6 (Odd paise inclusive):', res);
  assert.equal(res.grandTotal, 99.99);
  assert.equal(Math.round((res.taxableAmount + res.gstTotal) * 100) / 100, 99.99);
  assert.equal(Math.round((res.cgst + res.sgst) * 100) / 100, res.gstTotal);
}

console.log('ALL GST ENGINE UNIT TESTS PASSED SUCCESSFULLY! ✓');
